"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { DocumentBlock, type DocumentContent } from "@/components/blocks";
import { PolyformLogoBadge } from "@/components/brand/polyform-logo";
import { applyTranslatedUnits, extractTranslatableUnits } from "@/components/blocks/translation-utils";
import { LanguageModal } from "@/components/space/language-modal";
import { ShareModal } from "@/components/space/share-modal";
import { SUPPORTED_LANGUAGES } from "@/lib/defaults";
import { SupabaseRoomClient } from "@/lib/realtime/supabase-room-client";
import { randomColor } from "@/lib/utils";
import type { Block, BlockType, PresencePayload, Space } from "@/types/domain";

interface WorkspaceProps {
  spaceId: string;
  mode?: "edit" | "view";
  snapshotId?: string;
  shareToken?: string;
}

type BlockContent = DocumentContent;
type BlockRow = Block & { source_content: BlockContent };

interface TranslationState {
  [blockId: string]: {
    [langCode: string]: {
      translationVersion: number;
      texts: string[];
    };
  };
}

interface PollyMessage {
  role: "assistant" | "user";
  text: string;
}

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

interface BrowserSpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      0: { transcript: string };
    };
  };
}

interface BrowserSpeechRecognitionErrorEvent {
  error: string;
}

function detectBrowserLanguage(): string {
  if (typeof window === "undefined") return "en";
  const locale = navigator.language.slice(0, 2).toLowerCase();
  return SUPPORTED_LANGUAGES.some((lang) => lang.code === locale) ? locale : "en";
}

function isSupportedBlockType(type: string): type is BlockType {
  return type === "document";
}

function ToolbarIcon({
  label,
  onClick,
  title,
  active = false,
  disabled = false,
}: {
  label: string;
  onClick?: () => void;
  title?: string;
  active?: boolean;
  disabled?: boolean;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`rounded-lg border px-2 py-1 text-[13px] transition ${
        active ? "border-[#9ec6ff] bg-[#e8f1ff] text-[#174ea6]" : "border-transparent text-[#3c4043]"
      } hover:border-white/70 hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {label}
    </button>
  );
}

function EyeIcon({ off = false }: { off?: boolean }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
      {off ? <path d="M4 4 20 20" /> : null}
    </svg>
  );
}

function MicIcon({ active = false }: { active?: boolean }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`h-4 w-4 ${active ? "animate-pulse" : ""}`}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0" />
      <path d="M12 17v4" />
    </svg>
  );
}

const FONT_OPTIONS = [
  "Arial",
  "Times New Roman",
  "Georgia",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Calibri",
  "Cambria",
  "Garamond",
  "Courier New",
] as const;

interface DocumentFormatState {
  zoom: number;
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  lineHeight: number;
  align: "left" | "center";
  textType: "normal";
}

const DEFAULT_DOCUMENT_FORMAT: Omit<DocumentFormatState, "fontFamily"> = {
  zoom: 1,
  fontSize: 11,
  bold: false,
  italic: false,
  underline: false,
  lineHeight: 1.85,
  align: "left",
  textType: "normal",
};

function normalizeDocumentFormat(content: DocumentContent, fallbackFont: string): DocumentFormatState {
  const format = content.format ?? {};
  return {
    zoom: typeof format.zoom === "number" && format.zoom > 0 ? format.zoom : DEFAULT_DOCUMENT_FORMAT.zoom,
    fontFamily: format.fontFamily ?? fallbackFont,
    fontSize: typeof format.fontSize === "number" && format.fontSize > 0 ? format.fontSize : DEFAULT_DOCUMENT_FORMAT.fontSize,
    bold: Boolean(format.bold),
    italic: Boolean(format.italic),
    underline: Boolean(format.underline),
    lineHeight: typeof format.lineHeight === "number" && format.lineHeight > 0 ? format.lineHeight : DEFAULT_DOCUMENT_FORMAT.lineHeight,
    align: format.align === "center" ? "center" : "left",
    textType: "normal",
  };
}

function cloneBlockContent(content: BlockContent): BlockContent {
  return {
    paragraphs: [...(content.paragraphs ?? [])],
    ...(content.format ? { format: { ...content.format } } : {}),
  };
}

function sanitizePollyText(input: string): string {
  return input.replace(/\*\*/g, "").replace(/#/g, "").replace(/[—–]/g, ":").trim();
}

function normalizePollyError(errorValue: unknown): string {
  if (typeof errorValue === "string" && errorValue.trim().length > 0) return errorValue;
  if (errorValue instanceof Error && errorValue.message.trim().length > 0) return errorValue.message;

  if (errorValue && typeof errorValue === "object") {
    const value = errorValue as Record<string, unknown>;
    if (typeof value.message === "string" && value.message.trim().length > 0) return value.message;
    if (typeof value.error === "string" && value.error.trim().length > 0) return value.error;
    if (Array.isArray(value.formErrors) && value.formErrors.length > 0) {
      return value.formErrors.map((item) => String(item)).join("; ");
    }
    if (Array.isArray(value.fieldErrors)) {
      return value.fieldErrors.map((item) => String(item)).join("; ");
    }
  }

  return "Polly failed to draft text.";
}

function speechLocaleFromLanguageCode(code: string): string {
  const map: Record<string, string> = {
    en: "en-US",
    ja: "ja-JP",
    pt: "pt-BR",
    de: "de-DE",
    fr: "fr-FR",
    es: "es-ES",
    ko: "ko-KR",
    zh: "zh-CN",
  };
  return map[code] ?? "en-US";
}

export function Workspace({ spaceId, mode = "edit", snapshotId, shareToken }: WorkspaceProps): JSX.Element {
  const [space, setSpace] = useState<Space | null>(null);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [sourceById, setSourceById] = useState<Record<string, BlockContent>>({});
  const [translations, setTranslations] = useState<TranslationState>({});
  const [presenceById, setPresenceById] = useState<Record<string, PresencePayload>>({});
  const [translationPending, setTranslationPending] = useState<Record<string, boolean>>({});
  const [language, setLanguage] = useState("en");
  const [languageModalOpen, setLanguageModalOpen] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [editLink, setEditLink] = useState<string | null>(null);
  const [viewLink, setViewLink] = useState<string | null>(null);
  const [snapshotLink, setSnapshotLink] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("You");
  const [effectiveMode, setEffectiveMode] = useState<"edit" | "view">(mode);
  const [selectedFont, setSelectedFont] = useState<(typeof FONT_OPTIONS)[number]>("Arial");
  const [historyCounts, setHistoryCounts] = useState({ undo: 0, redo: 0 });
  const [focusMode, setFocusMode] = useState(false);
  const [pollyOpen, setPollyOpen] = useState(false);
  const [pollyInput, setPollyInput] = useState("");
  const [pollyListening, setPollyListening] = useState(false);
  const [pollySpeechSupported, setPollySpeechSupported] = useState(false);
  const [pollySpeechError, setPollySpeechError] = useState<string | null>(null);
  const [pollyInterim, setPollyInterim] = useState("");
  const [pollyDrafting, setPollyDrafting] = useState(false);
  const [pollyMessages, setPollyMessages] = useState<PollyMessage[]>([
    { role: "assistant", text: "Write with Polly is ready. Ask for a summary, rewrite, or outline." },
  ]);
  const [error, setError] = useState<string | null>(null);

  const effectiveDisplayName = displayName.trim() || "You";
  const readOnly = effectiveMode !== "edit" || Boolean(snapshotId);

  const sessionIdRef = useRef<string>("");
  const roomClientRef = useRef<SupabaseRoomClient | null>(null);
  const lastPresenceRef = useRef(0);
  const saveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const translationTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const undoStackRef = useRef<BlockContent[]>([]);
  const redoStackRef = useRef<BlockContent[]>([]);
  const speechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const pollyDraftTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const targetLanguages = useMemo(() => {
    const active = new Set<string>([language]);
    Object.values(presenceById).forEach((presence) => active.add(presence.language));
    return [...active];
  }, [language, presenceById]);

  const activeBlock = blocks[0] ?? null;

  function syncHistoryCounts(): void {
    setHistoryCounts({ undo: undoStackRef.current.length, redo: redoStackRef.current.length });
  }

  useEffect(() => {
    sessionIdRef.current = crypto.randomUUID();
    const fromStorage = window.localStorage.getItem("polyform-language");
    const savedName = window.localStorage.getItem("polyform-name");
    const savedFont = window.localStorage.getItem("polyform-font");
    const resolved = fromStorage && SUPPORTED_LANGUAGES.some((lang) => lang.code === fromStorage) ? fromStorage : detectBrowserLanguage();
    setLanguage(resolved);
    setDisplayName(savedName?.trim() || "You");
    if (savedFont && FONT_OPTIONS.includes(savedFont as (typeof FONT_OPTIONS)[number])) {
      setSelectedFont(savedFont as (typeof FONT_OPTIONS)[number]);
    }
    setLanguageModalOpen(!fromStorage || !savedName);
  }, []);

  useEffect(() => {
    return () => {
      if (pollyDraftTimerRef.current) {
        clearInterval(pollyDraftTimerRef.current);
        pollyDraftTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    type SpeechWindow = Window & {
      SpeechRecognition?: new () => BrowserSpeechRecognition;
      webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
    };

    const speechWindow = window as SpeechWindow;
    const RecognitionCtor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      setPollySpeechSupported(false);
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = speechLocaleFromLanguageCode(language);
    recognition.onstart = () => {
      setPollyListening(true);
      setPollySpeechError(null);
    };
    recognition.onend = () => {
      setPollyListening(false);
      setPollyInterim("");
    };
    recognition.onerror = (event) => {
      const errorMap: Record<string, string> = {
        not_allowed: "Microphone permission blocked.",
        service_not_allowed: "Speech service is unavailable.",
        no_speech: "No speech detected.",
        audio_capture: "No microphone detected.",
      };
      setPollySpeechError(errorMap[event.error] ?? "Speech recognition error.");
      setPollyListening(false);
      setPollyInterim("");
    };
    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript?.trim() ?? "";
        if (!transcript) continue;
        if (result.isFinal) {
          finalTranscript += `${transcript} `;
        } else {
          interimTranscript += `${transcript} `;
        }
      }

      setPollyInterim(interimTranscript.trim());
      const finalText = finalTranscript.trim();
      if (finalText.length > 0) {
        setPollyInput((current) => (current.trim().length > 0 ? `${current.trim()} ${finalText}` : finalText));
      }
    };

    speechRecognitionRef.current = recognition;
    setPollySpeechSupported(true);

    return () => {
      try {
        recognition.stop();
      } catch {
        // Ignore teardown errors from browser speech APIs.
      }
      speechRecognitionRef.current = null;
    };
  }, [language]);

  useEffect(() => {
    async function loadSpace(): Promise<void> {
      try {
        const endpoint = snapshotId
          ? `/api/snapshots/${snapshotId}`
          : `/api/spaces/${spaceId}?mode=${mode}&token=${encodeURIComponent(shareToken ?? "")}`;
        const response = await fetch(endpoint, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load space");

        if (snapshotId) {
          setSpace(data.snapshot.payload.space as Space);
          setBlocks((data.snapshot.payload.blocks as BlockRow[]).filter((block) => isSupportedBlockType(block.type)));
        } else {
          setSpace(data.space as Space);
          setBlocks((data.blocks as BlockRow[]).filter((block) => isSupportedBlockType(block.type)));
          setEffectiveMode((data.accessMode as "edit" | "view" | undefined) ?? mode);
        }
      } catch (loadError) {
        setError((loadError as Error).message);
      }
    }

    void loadSpace();
  }, [mode, shareToken, spaceId, snapshotId]);

  useEffect(() => {
    const nextState: Record<string, BlockContent> = {};
    for (const block of blocks) {
      nextState[block.id] = block.source_content;
    }
    setSourceById(nextState);
  }, [blocks]);

  useEffect(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    syncHistoryCounts();
  }, [activeBlock?.id]);

  useEffect(() => {
    if (snapshotId) return;

    try {
      const client = new SupabaseRoomClient({
        spaceId,
        sessionId: sessionIdRef.current,
        displayName: effectiveDisplayName,
        color: randomColor(sessionIdRef.current),
        language,
        onPresence: (presence) => {
          setPresenceById((current) => ({ ...current, [presence.sessionId]: presence }));
        },
        onBlockPatch: (patch) => {
          setBlocks((current) =>
            current.map((block) =>
              block.id === patch.id
                ? {
                    ...block,
                    ...(patch.translation_version !== undefined ? { translation_version: patch.translation_version } : {}),
                    ...(patch.universal !== undefined ? { universal: patch.universal } : {}),
                  }
                : block,
            ),
          );
        },
        onDocumentUpdate: (payload) => {
          if (payload.sessionId === sessionIdRef.current) return;
          setBlocks((current) =>
            current.map((block) =>
              block.id === payload.blockId
                ? {
                    ...block,
                    source_content: payload.sourceContent as BlockContent,
                    translation_version: payload.translationVersion,
                  }
                : block,
            ),
          );
          setSourceById((current) => ({
            ...current,
            [payload.blockId]: payload.sourceContent as BlockContent,
          }));
        },
        onTranslation: (payload) => {
          setTranslations((current) => ({
            ...current,
            [payload.blockId]: {
              ...(current[payload.blockId] ?? {}),
              [payload.language]: {
                translationVersion: payload.translationVersion,
                texts: payload.texts,
              },
            },
          }));
          setTranslationPending((current) => ({ ...current, [payload.blockId]: false }));
        },
      });

      client.connect();
      roomClientRef.current = client;

      return () => {
        client.close();
        roomClientRef.current = null;
      };
    } catch (connectionError) {
      setError((connectionError as Error).message);
      return undefined;
    }
  }, [effectiveDisplayName, spaceId, language, snapshotId]);

  function displayContent(block: BlockRow): BlockContent {
    const sourceContent = sourceById[block.id] ?? block.source_content;
    if (language === block.source_language || block.universal) return sourceContent;

    const translated = translations[block.id]?.[language];
    if (!translated || translated.translationVersion < block.translation_version) return sourceContent;

    return applyTranslatedUnits(block.type, sourceContent, translated.texts) as BlockContent;
  }

  async function runTranslation(block: BlockRow, sourceContent: BlockContent): Promise<void> {
    if (block.universal || readOnly) return;

    const texts = extractTranslatableUnits(block.type, sourceContent);
    if (texts.length === 0) return;

    const targets = targetLanguages.filter((target) => target !== block.source_language);
    if (targets.length === 0) return;

    setTranslationPending((current) => ({ ...current, [block.id]: true }));

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId,
          blockId: block.id,
          texts,
          sourceLang: block.source_language,
          targetLangs: targets,
          translationVersion: block.translation_version,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Translation failed");

      const results = data.results as Record<string, string[]>;

      setTranslations((current) => {
        const next = { ...current };
        for (const [langCode, translatedTexts] of Object.entries(results)) {
          next[block.id] = {
            ...(next[block.id] ?? {}),
            [langCode]: {
              translationVersion: block.translation_version,
              texts: translatedTexts,
            },
          };
        }
        return next;
      });

      if (roomClientRef.current) {
        for (const [langCode, translatedTexts] of Object.entries(results)) {
          roomClientRef.current.broadcastTranslation({
            blockId: block.id,
            translationVersion: block.translation_version,
            language: langCode,
            texts: translatedTexts,
          });
        }
      }
    } catch (translateError) {
      setError((translateError as Error).message);
    } finally {
      setTranslationPending((current) => ({ ...current, [block.id]: false }));
    }
  }

  function scheduleTranslation(block: BlockRow, sourceContent: BlockContent): void {
    if (translationTimersRef.current[block.id]) clearTimeout(translationTimersRef.current[block.id]);
    translationTimersRef.current[block.id] = setTimeout(() => {
      void runTranslation(block, sourceContent);
    }, 600);
  }

  function updateBlockContent(
    block: BlockRow,
    nextContent: BlockContent,
    options?: { trackHistory?: boolean; persist?: boolean; translate?: boolean },
  ): void {
    if (readOnly) return;

    const trackHistory = options?.trackHistory ?? true;
    const persist = options?.persist ?? true;
    const translate = options?.translate ?? true;
    const currentContent = sourceById[block.id] ?? block.source_content;
    if (trackHistory) {
      const hasChanged = JSON.stringify(currentContent) !== JSON.stringify(nextContent);
      if (hasChanged) {
        undoStackRef.current.push(cloneBlockContent(currentContent));
        if (undoStackRef.current.length > 120) undoStackRef.current.shift();
        redoStackRef.current = [];
        syncHistoryCounts();
      }
    }

    const nextVersion = block.translation_version + 1;
    setBlocks((current) =>
      current.map((item) =>
        item.id === block.id ? { ...item, translation_version: nextVersion, source_content: nextContent } : item,
      ),
    );
    setSourceById((current) => ({ ...current, [block.id]: nextContent }));
    roomClientRef.current?.broadcastBlockPatch({ id: block.id, translation_version: nextVersion });
    roomClientRef.current?.broadcastDocumentUpdate({
      blockId: block.id,
      translationVersion: nextVersion,
      sourceContent: nextContent,
      sessionId: sessionIdRef.current,
    });

    if (persist && !snapshotId) {
      if (saveTimersRef.current[block.id]) clearTimeout(saveTimersRef.current[block.id]);
      saveTimersRef.current[block.id] = setTimeout(() => {
        void fetch(`/api/spaces/${spaceId}/blocks`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blocks: [
              {
                id: block.id,
                source_content: nextContent,
                translation_version: nextVersion,
              },
            ],
          }),
        });
      }, 450);
    }

    if (translate) {
      scheduleTranslation({ ...block, translation_version: nextVersion, source_content: nextContent }, nextContent);
    }
  }

  async function buildShareLinks(): Promise<void> {
    setShareModalOpen(true);
    setEditLink(null);
    setViewLink(null);
    setSnapshotLink(null);

    const [editResponse, viewResponse, snapshotResponse] = await Promise.all([
      fetch(`/api/spaces/${spaceId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "edit" }),
      }),
      fetch(`/api/spaces/${spaceId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "view" }),
      }),
      fetch(`/api/spaces/${spaceId}/snapshot`, { method: "POST" }),
    ]);

    const editData = await editResponse.json();
    const viewData = await viewResponse.json();
    const snapshotData = await snapshotResponse.json();

    if (editResponse.ok) setEditLink(editData.link as string);
    if (viewResponse.ok) setViewLink(viewData.link as string);
    if (snapshotResponse.ok) setSnapshotLink(snapshotData.link as string);
  }

  function updateDocumentFormat(patch: Partial<DocumentFormatState>): void {
    if (readOnly || !activeBlock) return;

    const source = sourceById[activeBlock.id] ?? activeBlock.source_content;
    const currentFormat = normalizeDocumentFormat(source, selectedFont);
    const nextFormat: DocumentFormatState = { ...currentFormat, ...patch };
    const nextContent: BlockContent = {
      ...source,
      format: {
        zoom: nextFormat.zoom,
        fontFamily: nextFormat.fontFamily,
        fontSize: nextFormat.fontSize,
        bold: nextFormat.bold,
        italic: nextFormat.italic,
        underline: nextFormat.underline,
        lineHeight: nextFormat.lineHeight,
        align: nextFormat.align,
        textType: nextFormat.textType,
      },
    };
    updateBlockContent(activeBlock, nextContent);
  }

  function handleUndo(): void {
    if (readOnly || !activeBlock || undoStackRef.current.length === 0) return;

    const previous = undoStackRef.current.pop();
    if (!previous) return;
    const current = sourceById[activeBlock.id] ?? activeBlock.source_content;
    redoStackRef.current.push(cloneBlockContent(current));
    syncHistoryCounts();
    updateBlockContent(activeBlock, previous, { trackHistory: false });
  }

  function handleRedo(): void {
    if (readOnly || !activeBlock || redoStackRef.current.length === 0) return;

    const next = redoStackRef.current.pop();
    if (!next) return;
    const current = sourceById[activeBlock.id] ?? activeBlock.source_content;
    undoStackRef.current.push(cloneBlockContent(current));
    syncHistoryCounts();
    updateBlockContent(activeBlock, next, { trackHistory: false });
  }

  function appendDraftTemplate(template: "heading" | "meeting" | "checklist"): void {
    if (readOnly || !activeBlock) return;

    const source = sourceById[activeBlock.id] ?? activeBlock.source_content;
    const currentText = (source.paragraphs ?? []).join("\n").trimEnd();
    const snippets: Record<"heading" | "meeting" | "checklist", string> = {
      heading: "Heading\nStart drafting here.",
      meeting: "Meeting Notes\nDate:\nAttendees:\n\nAgenda\n- \n\nNotes\n- \n\nAction Items\n- [ ] ",
      checklist: "Checklist\n- [ ] Item 1\n- [ ] Item 2\n- [ ] Item 3",
    };
    const nextText = currentText.length > 0 ? `${currentText}\n\n${snippets[template]}` : snippets[template];
    updateBlockContent(activeBlock, { ...source, paragraphs: nextText.split("\n") });
  }

  function animatePollyDraft(draftText: string, center: boolean): void {
    if (!activeBlock || readOnly) return;

    if (pollyDraftTimerRef.current) {
      clearInterval(pollyDraftTimerRef.current);
      pollyDraftTimerRef.current = null;
    }

    const source = sourceById[activeBlock.id] ?? activeBlock.source_content;
    const tokens = (sanitizePollyText(draftText).match(/\S+\s*/g) ?? []).slice(0, 2500);
    if (tokens.length === 0) return;

    undoStackRef.current.push(cloneBlockContent(source));
    redoStackRef.current = [];
    syncHistoryCounts();
    setPollyDrafting(true);

    const baseFormat = normalizeDocumentFormat(source, selectedFont);
    let cursor = 0;

    pollyDraftTimerRef.current = setInterval(() => {
      cursor = Math.min(tokens.length, cursor + 6);
      const chunk = tokens.slice(0, cursor).join("");
      const mergedText = chunk.trimEnd();
      const isFinal = cursor >= tokens.length;

      const nextContent: BlockContent = {
        ...source,
        paragraphs: mergedText.split("\n"),
        format: {
          ...source.format,
          zoom: baseFormat.zoom,
          fontFamily: baseFormat.fontFamily,
          fontSize: baseFormat.fontSize,
          bold: baseFormat.bold,
          italic: baseFormat.italic,
          underline: baseFormat.underline,
          lineHeight: 1.9,
          align: center ? "center" : "left",
          textType: "normal",
        },
      };

      updateBlockContent(activeBlock, nextContent, {
        trackHistory: false,
        persist: isFinal,
        translate: isFinal,
      });

      if (isFinal) {
        if (pollyDraftTimerRef.current) {
          clearInterval(pollyDraftTimerRef.current);
          pollyDraftTimerRef.current = null;
        }
        setPollyDrafting(false);
      }
    }, 28);
  }

  async function submitPollyMessage(): Promise<void> {
    const prompt = pollyInput.trim();
    if (prompt.length === 0) return;

    const source = activeBlock ? sourceById[activeBlock.id] ?? activeBlock.source_content : { paragraphs: [] };
    const sourceText = (source.paragraphs ?? []).join("\n");

    setPollyMessages((current) => [...current, { role: "user", text: sanitizePollyText(prompt) }]);
    setPollyInput("");
    setPollyOpen(true);

    try {
      const response = await fetch("/api/polly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          sourceText,
        }),
      });
      const data = (await response.json()) as {
        assistantText?: string;
        draftText?: string;
        center?: boolean;
        error?: unknown;
      };

      if (!response.ok) {
        throw new Error(normalizePollyError(data.error));
      }

      const assistantText = sanitizePollyText(data.assistantText ?? "Draft ready. Typing it into the document now.");
      setPollyMessages((current) => [...current, { role: "assistant", text: assistantText }]);

      if (data.draftText && activeBlock) {
        animatePollyDraft(data.draftText, Boolean(data.center));
      }
    } catch (pollyError) {
      setPollyMessages((current) => [
        ...current,
        { role: "assistant", text: sanitizePollyText(normalizePollyError(pollyError)) },
      ]);
    }
  }

  function togglePollyListening(): void {
    if (!pollySpeechSupported) {
      setPollySpeechError("Speech input is not supported in this browser.");
      return;
    }

    const recognition = speechRecognitionRef.current;
    if (!recognition) return;

    setPollySpeechError(null);
    if (pollyListening) {
      recognition.stop();
      return;
    }

    setPollyOpen(true);
    try {
      recognition.start();
    } catch {
      setPollySpeechError("Speech input is already active.");
    }
  }

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <div className="w-full max-w-xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      </main>
    );
  }

  if (!space || !activeBlock) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">Loading document...</div>
      </main>
    );
  }

  const activeSourceContent = sourceById[activeBlock.id] ?? activeBlock.source_content;
  const visibleContent = displayContent(activeBlock);
  const documentFormat = normalizeDocumentFormat(activeSourceContent, selectedFont);
  const visibleText = (visibleContent.paragraphs ?? []).join("\n");
  const compactText = visibleText.replace(/\s+/g, " ").trim();
  const wordCount = compactText.length > 0 ? compactText.split(" ").length : 0;
  const characterCount = visibleText.replace(/\n/g, "").length;
  const readingMinutes = wordCount > 0 ? Math.max(1, Math.ceil(wordCount / 200)) : 0;

  return (
    <main className="h-screen overflow-hidden bg-[#ecebe7] text-[#202124]">
      <LanguageModal
        isOpen={languageModalOpen}
        value={language}
        name={effectiveDisplayName}
        onChange={(next) => setLanguage(next)}
        onNameChange={(next) => setDisplayName(next)}
        onConfirm={() => {
          window.localStorage.setItem("polyform-language", language);
          window.localStorage.setItem("polyform-name", effectiveDisplayName);
          setLanguageModalOpen(false);
        }}
      />

      <ShareModal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} editLink={editLink} viewLink={viewLink} snapshotLink={snapshotLink} />

      <div className="flex h-full flex-col px-2 pb-2 pt-1">
        <header className="sticky top-2 z-30 mx-auto w-full max-w-[1360px] rounded-[20px] border border-white/70 bg-white/35 shadow-[0_14px_36px_rgba(15,23,42,0.14)] backdrop-blur-2xl">
          <div className="m-2 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/55 px-5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-md">
            <PolyformLogoBadge className="h-10 w-10 rounded-lg" markClassName="h-6 w-6 text-[#2f3338]" title="Polyform logo" />
            <div className="min-w-0">
              <input
                value={space.title}
                readOnly={readOnly}
                onChange={(event) => {
                  const title = event.target.value;
                  setSpace((current) => (current ? { ...current, title } : current));
                }}
                onBlur={() => {
                  if (readOnly) return;
                  void fetch(`/api/spaces/${spaceId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: space.title }),
                  });
                }}
                className="w-72 rounded border border-transparent bg-transparent px-1 text-[22px] leading-none text-[#202124] outline-none focus:border-[#dadce0]"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <input
                value={displayName}
                onChange={(event) => {
                  const next = event.target.value;
                  setDisplayName(next);
                  window.localStorage.setItem("polyform-name", next.trim() || "You");
                }}
                className="w-28 rounded-lg border border-white/80 bg-white/70 px-2 py-1 text-xs backdrop-blur"
                placeholder="Name"
              />
              <select
                value={language}
                onChange={(event) => {
                  const next = event.target.value;
                  setLanguage(next);
                  window.localStorage.setItem("polyform-language", next);
                }}
                className="rounded-lg border border-white/80 bg-white/70 px-2 py-1 text-xs backdrop-blur"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void buildShareLinks()}
                className="rounded-full border border-[#8bc4ff] bg-[#c2e7ff]/90 px-5 py-2 text-sm font-semibold text-[#001d35] shadow-[0_1px_0_rgba(255,255,255,0.8)]"
              >
                Share
              </button>
              <Link href="/app" className="rounded-lg px-2 py-1 text-xs text-[#5f6368] hover:bg-white/70">
                Back
              </Link>
            </div>
          </div>

          <div className="mx-2 mb-2 flex items-center gap-1 rounded-2xl border border-white/80 bg-white/55 px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-md">
            <ToolbarIcon label="Undo" onClick={handleUndo} disabled={readOnly || historyCounts.undo === 0} />
            <ToolbarIcon label="Redo" onClick={handleRedo} disabled={readOnly || historyCounts.redo === 0} />
            <ToolbarIcon label="Print" onClick={() => window.print()} />
            <span className="mx-2 h-5 w-px bg-[#dadce0]" />
            <select
              value={Math.round(documentFormat.zoom * 100)}
              onChange={(event) => {
                const percent = Number(event.target.value);
                updateDocumentFormat({ zoom: percent / 100 });
              }}
              className="rounded-lg border border-transparent bg-transparent px-2 py-1 text-[13px] text-[#3c4043] outline-none transition hover:border-white/70 hover:bg-white/70"
              title="Zoom"
              disabled={readOnly}
            >
              {[50, 75, 90, 100, 110, 125, 150, 175, 200].map((percent) => (
                <option key={percent} value={percent}>
                  {percent}%
                </option>
              ))}
            </select>
            <ToolbarIcon
              label="Normal text"
              title="Reset text style"
              onClick={() =>
                updateDocumentFormat({
                  textType: "normal",
                  fontSize: DEFAULT_DOCUMENT_FORMAT.fontSize,
                  bold: false,
                  italic: false,
                  underline: false,
                  lineHeight: DEFAULT_DOCUMENT_FORMAT.lineHeight,
                  align: DEFAULT_DOCUMENT_FORMAT.align,
                })
              }
              disabled={readOnly}
            />
            <select
              value={documentFormat.fontFamily}
              onChange={(event) => {
                const next = event.target.value as (typeof FONT_OPTIONS)[number];
                setSelectedFont(next);
                window.localStorage.setItem("polyform-font", next);
                updateDocumentFormat({ fontFamily: next });
              }}
              className="rounded-lg border border-transparent bg-transparent px-2 py-1 text-[13px] text-[#3c4043] outline-none transition hover:border-white/70 hover:bg-white/70"
              title="Font family"
              disabled={readOnly}
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
            <ToolbarIcon
              label={String(documentFormat.fontSize)}
              title="Increase font size"
              onClick={() => updateDocumentFormat({ fontSize: Math.min(72, documentFormat.fontSize + 1) })}
              disabled={readOnly}
            />
            <ToolbarIcon
              label="B"
              title="Bold"
              onClick={() => updateDocumentFormat({ bold: !documentFormat.bold })}
              active={documentFormat.bold}
              disabled={readOnly}
            />
            <ToolbarIcon
              label="I"
              title="Italic"
              onClick={() => updateDocumentFormat({ italic: !documentFormat.italic })}
              active={documentFormat.italic}
              disabled={readOnly}
            />
            <ToolbarIcon
              label="U"
              title="Underline"
              onClick={() => updateDocumentFormat({ underline: !documentFormat.underline })}
              active={documentFormat.underline}
              disabled={readOnly}
            />
            <ToolbarIcon label="A" />
            <ToolbarIcon label="Align" />
            <ToolbarIcon label="List" />
            <ToolbarIcon label="1." />
            <div className="ml-auto flex items-center gap-2 text-xs text-[#5f6368]">
              <span className="rounded-full border border-white/80 bg-white/70 px-2 py-0.5">Editing</span>
              <span className="rounded-full border border-white/80 bg-white/70 px-2 py-0.5">
                {translationPending[activeBlock.id] ? "Translating..." : "Synced"}
              </span>
            </div>
          </div>
        </header>

        <section
          className="relative mt-3 min-h-0 flex-1 overflow-auto"
          onMouseMove={(event) => {
            if (snapshotId || !roomClientRef.current) return;
            const now = Date.now();
            if (now - lastPresenceRef.current < 100) return;
            lastPresenceRef.current = now;

            roomClientRef.current?.broadcastPresence({
              sessionId: sessionIdRef.current,
              displayName: effectiveDisplayName,
              language,
              color: randomColor(sessionIdRef.current),
              cursorPosition: { x: event.clientX, y: event.clientY },
              lastSeen: now,
            });
          }}
        >
          <div className="relative z-40 mx-auto my-3 w-[794px]" style={{ zoom: documentFormat.zoom }}>
            {pollyDrafting ? (
              <div className="pointer-events-none absolute -inset-2 rounded-md bg-[conic-gradient(from_180deg,#4285f4,#34a853,#fbbc05,#ea4335,#4285f4)] opacity-85 blur-[1.2px] animate-pulse" />
            ) : null}
            <DocumentBlock
              content={visibleContent as DocumentContent}
              readOnly={readOnly}
              onChange={(next) => updateBlockContent(activeBlock, next)}
              editorStyle={{
                fontFamily: documentFormat.fontFamily,
                fontSize: `${documentFormat.fontSize}px`,
                fontWeight: documentFormat.bold ? 700 : 400,
                fontStyle: documentFormat.italic ? "italic" : "normal",
                textDecoration: documentFormat.underline ? "underline" : "none",
                lineHeight: documentFormat.lineHeight,
                textAlign: documentFormat.align,
              }}
            />
          </div>

          <div className="fixed bottom-[72px] left-[12px] z-50 hidden xl:block">
            <button
              type="button"
              onClick={() => setFocusMode((current) => !current)}
              aria-pressed={focusMode}
              title={focusMode ? "Disable focus mode" : "Enable focus mode"}
              className={`grid h-10 w-10 place-items-center rounded-full border shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-xl transition ${
                focusMode
                  ? "border-[#9ec6ff] bg-[#e8f1ff] text-[#174ea6]"
                  : "border-white/80 bg-white/75 text-[#3c4043] hover:bg-white"
              }`}
            >
              <EyeIcon off={focusMode} />
            </button>
          </div>

          <div
            className="pointer-events-none fixed bottom-5 z-20 hidden xl:block"
            style={{ left: "12px" }}
          >
            <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/80 bg-white/65 px-4 py-2 text-xs text-[#3c4043] shadow-[0_10px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl">
              <span className="rounded-full bg-white/75 px-2 py-0.5 font-medium">{wordCount} words</span>
              <span className="rounded-full bg-white/75 px-2 py-0.5 font-medium">{characterCount} chars</span>
              <span className="rounded-full bg-white/75 px-2 py-0.5 font-medium">{readingMinutes} min read</span>
            </div>
          </div>

          {pollyOpen ? (
            <div className="pointer-events-none fixed bottom-[126px] right-[32px] z-50 hidden xl:block">
              <div className="pointer-events-auto w-[320px] overflow-hidden rounded-2xl border border-white/80 bg-white/70 shadow-[0_14px_30px_rgba(0,0,0,0.16)] backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/70 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <PolyformLogoBadge className="h-6 w-6 rounded-full" markClassName="h-3.5 w-3.5 text-[#2f3338]" />
                    <span className="text-xs font-semibold text-[#2f3338]">Write with Polly</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPollyOpen(false);
                      if (pollyListening) {
                        speechRecognitionRef.current?.stop();
                      }
                    }}
                    className="rounded-full px-2 py-0.5 text-xs text-[#5f6368] hover:bg-white/80"
                  >
                    Close
                  </button>
                </div>
                <div className="max-h-[180px] space-y-2 overflow-auto px-3 py-2">
                  {pollyMessages.slice(-6).map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`rounded-2xl px-3 py-2 text-xs whitespace-pre-wrap ${
                        message.role === "user"
                          ? "ml-10 bg-[#dbeafe] text-[#1e3a8a]"
                          : "mr-10 bg-white/85 text-[#374151]"
                      }`}
                    >
                      {message.text}
                    </div>
                  ))}
                  {pollyInterim.length > 0 ? (
                    <div className="mr-10 rounded-2xl bg-white/70 px-3 py-2 text-xs italic text-[#4b5563]">{pollyInterim}</div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 border-t border-white/70 px-3 py-2">
                  <input
                    value={pollyInput}
                    onChange={(event) => setPollyInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void submitPollyMessage();
                      }
                    }}
                    placeholder="Ask Polly..."
                    className="w-full rounded-full border border-white/80 bg-white/85 px-3 py-1.5 text-xs text-[#2f3338] outline-none focus:border-[#9ec6ff]"
                  />
                  <button
                    type="button"
                    onClick={togglePollyListening}
                    title={pollyListening ? "Stop speech input" : "Start speech input"}
                    disabled={!pollySpeechSupported}
                    className={`rounded-full border px-2 py-1.5 disabled:cursor-not-allowed disabled:opacity-50 ${
                      pollyListening
                        ? "border-[#9ec6ff] bg-[#e8f1ff] text-[#174ea6]"
                        : "border-white/80 bg-white/90 text-[#2f3338] hover:bg-white"
                    }`}
                  >
                    <MicIcon active={pollyListening} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void submitPollyMessage()}
                    className="rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-xs font-medium text-[#2f3338] hover:bg-white"
                  >
                    Send
                  </button>
                </div>
                {pollySpeechError ? <div className="px-3 pb-2 text-[11px] text-[#b91c1c]">{pollySpeechError}</div> : null}
                {!pollySpeechSupported ? (
                  <div className="px-3 pb-2 text-[11px] text-[#6b7280]">Speech input is unavailable in this browser.</div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="pointer-events-none fixed bottom-[72px] right-[32px] z-50 hidden xl:block">
            <button
              type="button"
              onClick={() => {
                setPollyOpen((current) => {
                  const next = !current;
                  if (!next && pollyListening) {
                    speechRecognitionRef.current?.stop();
                  }
                  return next;
                });
              }}
              aria-pressed={pollyOpen}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-3 py-1.5 text-xs font-medium text-[#2f3338] shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-xl transition hover:bg-white"
            >
              <PolyformLogoBadge className="h-6 w-6 rounded-full" markClassName="h-3.5 w-3.5 text-[#2f3338]" />
              <span>Write with Polly</span>
            </button>
          </div>

          <div
            className="pointer-events-none fixed bottom-5 z-20 hidden xl:block"
            style={{ right: "32px" }}
          >
            <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/80 bg-white/65 px-3 py-2 text-xs text-[#3c4043] shadow-[0_10px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl">
              <button
                type="button"
                onClick={() => appendDraftTemplate("heading")}
                disabled={readOnly}
                className="rounded-full border border-white/70 bg-white/80 px-3 py-1 font-medium hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Heading
              </button>
              <button
                type="button"
                onClick={() => appendDraftTemplate("meeting")}
                disabled={readOnly}
                className="rounded-full border border-white/70 bg-white/80 px-3 py-1 font-medium hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Meeting Notes
              </button>
              <button
                type="button"
                onClick={() => appendDraftTemplate("checklist")}
                disabled={readOnly}
                className="rounded-full border border-white/70 bg-white/80 px-3 py-1 font-medium hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Checklist
              </button>
            </div>
          </div>

          {Object.values(presenceById)
            .filter((presence) => presence.sessionId !== sessionIdRef.current)
            .map((presence) => (
              <div
                key={presence.sessionId}
                className="pointer-events-none fixed z-40 -translate-x-1/2 -translate-y-1/2"
                style={{ left: presence.cursorPosition.x, top: presence.cursorPosition.y }}
              >
                <div className="h-3 w-3 rounded-full" style={{ background: presence.color }} />
                <div className="mt-1 rounded bg-black px-2 py-1 text-[10px] text-white">{presence.displayName}</div>
              </div>
            ))}
        </section>
      </div>

      {focusMode ? <div className="pointer-events-none fixed inset-0 z-30 bg-[#2f3338]/50" /> : null}
    </main>
  );
}
