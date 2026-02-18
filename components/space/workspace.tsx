"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const PRESENCE_BROADCAST_INTERVAL_MS = 80;
const TRANSLATION_DEBOUNCE_MS = 180;

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

interface WorkspaceUiText {
  loadingDocument: string;
  namePlaceholder: string;
  share: string;
  back: string;
  undo: string;
  redo: string;
  print: string;
  zoom: string;
  normalText: string;
  resetTextStyle: string;
  fontFamily: string;
  increaseFontSize: string;
  bold: string;
  italic: string;
  underline: string;
  align: string;
  list: string;
  numberedList: string;
  editing: string;
  translating: string;
  synced: string;
  focusEnable: string;
  focusDisable: string;
  words: string;
  chars: string;
  minRead: string;
  writeWithPolly: string;
  close: string;
  askPolly: string;
  stopSpeechInput: string;
  startSpeechInput: string;
  speechAlreadyActive: string;
  send: string;
  speechUnavailable: string;
  heading: string;
  meetingNotes: string;
  checklist: string;
  pollyReady: string;
  languageModal: {
    title: string;
    subtitle: string;
    namePlaceholder: string;
    enterSpace: string;
  };
  shareModal: {
    title: string;
    close: string;
    liveEdit: string;
    viewOnly: string;
    snapshot: string;
    generating: string;
  };
}

const DEFAULT_UI_TEXT: WorkspaceUiText = {
  loadingDocument: "Loading document...",
  namePlaceholder: "Name",
  share: "Share",
  back: "Back",
  undo: "Undo",
  redo: "Redo",
  print: "Print",
  zoom: "Zoom",
  normalText: "Normal text",
  resetTextStyle: "Reset text style",
  fontFamily: "Font family",
  increaseFontSize: "Increase font size",
  bold: "Bold",
  italic: "Italic",
  underline: "Underline",
  align: "Align",
  list: "List",
  numberedList: "1.",
  editing: "Editing",
  translating: "Translating...",
  synced: "Synced",
  focusEnable: "Enable focus mode",
  focusDisable: "Disable focus mode",
  words: "words",
  chars: "chars",
  minRead: "min read",
  writeWithPolly: "Write with Polly",
  close: "Close",
  askPolly: "Ask Polly...",
  stopSpeechInput: "Stop speech input",
  startSpeechInput: "Start speech input",
  speechAlreadyActive: "Speech input is already active.",
  send: "Send",
  speechUnavailable: "Speech input is unavailable in this browser.",
  heading: "Heading",
  meetingNotes: "Meeting Notes",
  checklist: "Checklist",
  pollyReady: "Write with Polly is ready. Ask for a summary, rewrite, or outline.",
  languageModal: {
    title: "Choose your working language",
    subtitle: "You can change this anytime in the top bar.",
    namePlaceholder: "Your name",
    enterSpace: "Enter Space",
  },
  shareModal: {
    title: "Share Space",
    close: "Close",
    liveEdit: "Live Edit",
    viewOnly: "View Only",
    snapshot: "Snapshot",
    generating: "Generating...",
  },
};

function readLocalizedText(candidate: unknown, fallback: string): string {
  return typeof candidate === "string" && candidate.trim().length > 0 ? candidate : fallback;
}

function resolveWorkspaceUiText(candidate: unknown): WorkspaceUiText {
  const value = candidate && typeof candidate === "object" ? (candidate as Record<string, unknown>) : {};
  const languageModal = value.languageModal && typeof value.languageModal === "object" ? (value.languageModal as Record<string, unknown>) : {};
  const shareModal = value.shareModal && typeof value.shareModal === "object" ? (value.shareModal as Record<string, unknown>) : {};

  return {
    loadingDocument: readLocalizedText(value.loadingDocument, DEFAULT_UI_TEXT.loadingDocument),
    namePlaceholder: readLocalizedText(value.namePlaceholder, DEFAULT_UI_TEXT.namePlaceholder),
    share: readLocalizedText(value.share, DEFAULT_UI_TEXT.share),
    back: readLocalizedText(value.back, DEFAULT_UI_TEXT.back),
    undo: readLocalizedText(value.undo, DEFAULT_UI_TEXT.undo),
    redo: readLocalizedText(value.redo, DEFAULT_UI_TEXT.redo),
    print: readLocalizedText(value.print, DEFAULT_UI_TEXT.print),
    zoom: readLocalizedText(value.zoom, DEFAULT_UI_TEXT.zoom),
    normalText: readLocalizedText(value.normalText, DEFAULT_UI_TEXT.normalText),
    resetTextStyle: readLocalizedText(value.resetTextStyle, DEFAULT_UI_TEXT.resetTextStyle),
    fontFamily: readLocalizedText(value.fontFamily, DEFAULT_UI_TEXT.fontFamily),
    increaseFontSize: readLocalizedText(value.increaseFontSize, DEFAULT_UI_TEXT.increaseFontSize),
    bold: readLocalizedText(value.bold, DEFAULT_UI_TEXT.bold),
    italic: readLocalizedText(value.italic, DEFAULT_UI_TEXT.italic),
    underline: readLocalizedText(value.underline, DEFAULT_UI_TEXT.underline),
    align: readLocalizedText(value.align, DEFAULT_UI_TEXT.align),
    list: readLocalizedText(value.list, DEFAULT_UI_TEXT.list),
    numberedList: readLocalizedText(value.numberedList, DEFAULT_UI_TEXT.numberedList),
    editing: readLocalizedText(value.editing, DEFAULT_UI_TEXT.editing),
    translating: readLocalizedText(value.translating, DEFAULT_UI_TEXT.translating),
    synced: readLocalizedText(value.synced, DEFAULT_UI_TEXT.synced),
    focusEnable: readLocalizedText(value.focusEnable, DEFAULT_UI_TEXT.focusEnable),
    focusDisable: readLocalizedText(value.focusDisable, DEFAULT_UI_TEXT.focusDisable),
    words: readLocalizedText(value.words, DEFAULT_UI_TEXT.words),
    chars: readLocalizedText(value.chars, DEFAULT_UI_TEXT.chars),
    minRead: readLocalizedText(value.minRead, DEFAULT_UI_TEXT.minRead),
    writeWithPolly: readLocalizedText(value.writeWithPolly, DEFAULT_UI_TEXT.writeWithPolly),
    close: readLocalizedText(value.close, DEFAULT_UI_TEXT.close),
    askPolly: readLocalizedText(value.askPolly, DEFAULT_UI_TEXT.askPolly),
    stopSpeechInput: readLocalizedText(value.stopSpeechInput, DEFAULT_UI_TEXT.stopSpeechInput),
    startSpeechInput: readLocalizedText(value.startSpeechInput, DEFAULT_UI_TEXT.startSpeechInput),
    speechAlreadyActive: readLocalizedText(value.speechAlreadyActive, DEFAULT_UI_TEXT.speechAlreadyActive),
    send: readLocalizedText(value.send, DEFAULT_UI_TEXT.send),
    speechUnavailable: readLocalizedText(value.speechUnavailable, DEFAULT_UI_TEXT.speechUnavailable),
    heading: readLocalizedText(value.heading, DEFAULT_UI_TEXT.heading),
    meetingNotes: readLocalizedText(value.meetingNotes, DEFAULT_UI_TEXT.meetingNotes),
    checklist: readLocalizedText(value.checklist, DEFAULT_UI_TEXT.checklist),
    pollyReady: readLocalizedText(value.pollyReady, DEFAULT_UI_TEXT.pollyReady),
    languageModal: {
      title: readLocalizedText(languageModal.title, DEFAULT_UI_TEXT.languageModal.title),
      subtitle: readLocalizedText(languageModal.subtitle, DEFAULT_UI_TEXT.languageModal.subtitle),
      namePlaceholder: readLocalizedText(languageModal.namePlaceholder, DEFAULT_UI_TEXT.languageModal.namePlaceholder),
      enterSpace: readLocalizedText(languageModal.enterSpace, DEFAULT_UI_TEXT.languageModal.enterSpace),
    },
    shareModal: {
      title: readLocalizedText(shareModal.title, DEFAULT_UI_TEXT.shareModal.title),
      close: readLocalizedText(shareModal.close, DEFAULT_UI_TEXT.shareModal.close),
      liveEdit: readLocalizedText(shareModal.liveEdit, DEFAULT_UI_TEXT.shareModal.liveEdit),
      viewOnly: readLocalizedText(shareModal.viewOnly, DEFAULT_UI_TEXT.shareModal.viewOnly),
      snapshot: readLocalizedText(shareModal.snapshot, DEFAULT_UI_TEXT.shareModal.snapshot),
      generating: readLocalizedText(shareModal.generating, DEFAULT_UI_TEXT.shareModal.generating),
    },
  };
}

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
  const [pollyMessages, setPollyMessages] = useState<PollyMessage[]>([{ role: "assistant", text: DEFAULT_UI_TEXT.pollyReady }]);
  const [uiTextByLanguage, setUiTextByLanguage] = useState<Record<string, WorkspaceUiText>>({ en: DEFAULT_UI_TEXT });
  const [error, setError] = useState<string | null>(null);

  const effectiveDisplayName = displayName.trim() || "You";
  const readOnly = effectiveMode !== "edit" || Boolean(snapshotId);
  const uiText = uiTextByLanguage[language] ?? DEFAULT_UI_TEXT;

  const sessionIdRef = useRef<string>("");
  const roomClientRef = useRef<SupabaseRoomClient | null>(null);
  const lastPresenceRef = useRef(0);
  const cursorPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
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

  const broadcastPresence = useCallback(
    (cursorPosition?: { x: number; y: number }, force = false): void => {
      if (snapshotId || !roomClientRef.current) return;

      const now = Date.now();
      if (!force && now - lastPresenceRef.current < PRESENCE_BROADCAST_INTERVAL_MS) return;
      lastPresenceRef.current = now;

      const nextCursor = cursorPosition ?? cursorPositionRef.current;
      cursorPositionRef.current = nextCursor;

      roomClientRef.current.broadcastPresence({
        sessionId: sessionIdRef.current,
        displayName: effectiveDisplayName,
        language,
        color: randomColor(sessionIdRef.current),
        cursorPosition: nextCursor,
        lastSeen: now,
      });
    },
    [effectiveDisplayName, language, snapshotId],
  );

  function syncHistoryCounts(): void {
    setHistoryCounts({ undo: undoStackRef.current.length, redo: redoStackRef.current.length });
  }

  useEffect(() => {
    sessionIdRef.current = crypto.randomUUID();
    if (typeof window !== "undefined") {
      cursorPositionRef.current = {
        x: Math.round(window.innerWidth / 2),
        y: Math.round(window.innerHeight / 2),
      };
    }
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
    if (language === "en" || uiTextByLanguage[language]) return;

    let cancelled = false;

    async function localizeUi(): Promise<void> {
      try {
        const response = await fetch("/api/ui-localize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetLang: language,
            texts: DEFAULT_UI_TEXT,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Failed to localize workspace UI");
        if (cancelled) return;

        const localized = resolveWorkspaceUiText(data.texts);
        setUiTextByLanguage((current) => ({ ...current, [language]: localized }));
      } catch {
        if (cancelled) return;
        setUiTextByLanguage((current) => ({ ...current, [language]: DEFAULT_UI_TEXT }));
      }
    }

    void localizeUi();

    return () => {
      cancelled = true;
    };
  }, [language, uiTextByLanguage]);

  useEffect(() => {
    setPollyMessages((current) => {
      if (current.length === 1 && current[0]?.role === "assistant" && current[0].text !== uiText.pollyReady) {
        return [{ role: "assistant", text: uiText.pollyReady }];
      }
      return current;
    });
  }, [uiText.pollyReady]);

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
      const initialPresenceTimer = setTimeout(() => {
        broadcastPresence(undefined, true);
      }, 140);

      return () => {
        clearTimeout(initialPresenceTimer);
        client.close();
        roomClientRef.current = null;
      };
    } catch (connectionError) {
      setError((connectionError as Error).message);
      return undefined;
    }
  }, [broadcastPresence, effectiveDisplayName, spaceId, language, snapshotId]);

  useEffect(() => {
    if (languageModalOpen) return;
    broadcastPresence(undefined, true);
  }, [broadcastPresence, languageModalOpen]);

  function displayContent(block: BlockRow): BlockContent {
    const sourceContent = sourceById[block.id] ?? block.source_content;
    if (language === block.source_language || block.universal) return sourceContent;

    const translated = translations[block.id]?.[language];
    if (!translated || translated.translationVersion < block.translation_version) return sourceContent;

    return applyTranslatedUnits(block.type, sourceContent, translated.texts) as BlockContent;
  }

  const runTranslation = useCallback(async (block: BlockRow, sourceContent: BlockContent): Promise<void> => {
    if (block.universal) return;

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
  }, [spaceId, targetLanguages]);

  useEffect(() => {
    if (!activeBlock) return;
    if (activeBlock.universal || language === activeBlock.source_language) return;
    if (translationPending[activeBlock.id]) return;

    const translated = translations[activeBlock.id]?.[language];
    if (translated && translated.translationVersion >= activeBlock.translation_version) return;

    const sourceContent = sourceById[activeBlock.id] ?? activeBlock.source_content;
    void runTranslation(activeBlock, sourceContent);
  }, [activeBlock, language, runTranslation, sourceById, translationPending, translations]);

  function scheduleTranslation(block: BlockRow, sourceContent: BlockContent): void {
    if (translationTimersRef.current[block.id]) clearTimeout(translationTimersRef.current[block.id]);
    translationTimersRef.current[block.id] = setTimeout(() => {
      void runTranslation(block, sourceContent);
    }, TRANSLATION_DEBOUNCE_MS);
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
      setPollySpeechError(uiText.speechUnavailable);
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
      setPollySpeechError(uiText.speechAlreadyActive);
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
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{uiText.loadingDocument}</div>
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
        copy={uiText.languageModal}
      />

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        editLink={editLink}
        viewLink={viewLink}
        snapshotLink={snapshotLink}
        copy={uiText.shareModal}
      />

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
                placeholder={uiText.namePlaceholder}
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
                {uiText.share}
              </button>
              <Link href="/app" className="rounded-lg px-2 py-1 text-xs text-[#5f6368] hover:bg-white/70">
                {uiText.back}
              </Link>
            </div>
          </div>

          <div className="mx-2 mb-2 flex items-center gap-1 rounded-2xl border border-white/80 bg-white/55 px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-md">
            <ToolbarIcon label={uiText.undo} onClick={handleUndo} disabled={readOnly || historyCounts.undo === 0} />
            <ToolbarIcon label={uiText.redo} onClick={handleRedo} disabled={readOnly || historyCounts.redo === 0} />
            <ToolbarIcon label={uiText.print} onClick={() => window.print()} />
            <span className="mx-2 h-5 w-px bg-[#dadce0]" />
            <select
              value={Math.round(documentFormat.zoom * 100)}
              onChange={(event) => {
                const percent = Number(event.target.value);
                updateDocumentFormat({ zoom: percent / 100 });
              }}
              className="rounded-lg border border-transparent bg-transparent px-2 py-1 text-[13px] text-[#3c4043] outline-none transition hover:border-white/70 hover:bg-white/70"
              title={uiText.zoom}
              disabled={readOnly}
            >
              {[50, 75, 90, 100, 110, 125, 150, 175, 200].map((percent) => (
                <option key={percent} value={percent}>
                  {percent}%
                </option>
              ))}
            </select>
            <ToolbarIcon
              label={uiText.normalText}
              title={uiText.resetTextStyle}
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
              title={uiText.fontFamily}
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
              title={uiText.increaseFontSize}
              onClick={() => updateDocumentFormat({ fontSize: Math.min(72, documentFormat.fontSize + 1) })}
              disabled={readOnly}
            />
            <ToolbarIcon
              label="B"
              title={uiText.bold}
              onClick={() => updateDocumentFormat({ bold: !documentFormat.bold })}
              active={documentFormat.bold}
              disabled={readOnly}
            />
            <ToolbarIcon
              label="I"
              title={uiText.italic}
              onClick={() => updateDocumentFormat({ italic: !documentFormat.italic })}
              active={documentFormat.italic}
              disabled={readOnly}
            />
            <ToolbarIcon
              label="U"
              title={uiText.underline}
              onClick={() => updateDocumentFormat({ underline: !documentFormat.underline })}
              active={documentFormat.underline}
              disabled={readOnly}
            />
            <ToolbarIcon label="A" />
            <ToolbarIcon label={uiText.align} />
            <ToolbarIcon label={uiText.list} />
            <ToolbarIcon label={uiText.numberedList} />
            <div className="ml-auto flex items-center gap-2 text-xs text-[#5f6368]">
              <span className="rounded-full border border-white/80 bg-white/70 px-2 py-0.5">{uiText.editing}</span>
              <span className="rounded-full border border-white/80 bg-white/70 px-2 py-0.5">
                {translationPending[activeBlock.id] ? uiText.translating : uiText.synced}
              </span>
            </div>
          </div>
        </header>

        <section
          className="relative mt-3 min-h-0 flex-1 overflow-auto"
          onMouseMove={(event) => {
            broadcastPresence({ x: event.clientX, y: event.clientY });
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
              title={focusMode ? uiText.focusDisable : uiText.focusEnable}
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
              <span className="rounded-full bg-white/75 px-2 py-0.5 font-medium">{wordCount} {uiText.words}</span>
              <span className="rounded-full bg-white/75 px-2 py-0.5 font-medium">{characterCount} {uiText.chars}</span>
              <span className="rounded-full bg-white/75 px-2 py-0.5 font-medium">{readingMinutes} {uiText.minRead}</span>
            </div>
          </div>

          {pollyOpen ? (
            <div className="pointer-events-none fixed bottom-[126px] right-[32px] z-50 hidden xl:block">
              <div className="pointer-events-auto w-[320px] overflow-hidden rounded-2xl border border-white/80 bg-white/70 shadow-[0_14px_30px_rgba(0,0,0,0.16)] backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/70 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <PolyformLogoBadge className="h-6 w-6 rounded-full" markClassName="h-3.5 w-3.5 text-[#2f3338]" />
                    <span className="text-xs font-semibold text-[#2f3338]">{uiText.writeWithPolly}</span>
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
                    {uiText.close}
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
                    placeholder={uiText.askPolly}
                    className="w-full rounded-full border border-white/80 bg-white/85 px-3 py-1.5 text-xs text-[#2f3338] outline-none focus:border-[#9ec6ff]"
                  />
                  <button
                    type="button"
                    onClick={() => togglePollyListening()}
                    title={pollyListening ? uiText.stopSpeechInput : uiText.startSpeechInput}
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
                    {uiText.send}
                  </button>
                </div>
                {pollySpeechError ? <div className="px-3 pb-2 text-[11px] text-[#b91c1c]">{pollySpeechError}</div> : null}
                {!pollySpeechSupported ? (
                  <div className="px-3 pb-2 text-[11px] text-[#6b7280]">{uiText.speechUnavailable}</div>
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
              <span>{uiText.writeWithPolly}</span>
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
                {uiText.heading}
              </button>
              <button
                type="button"
                onClick={() => appendDraftTemplate("meeting")}
                disabled={readOnly}
                className="rounded-full border border-white/70 bg-white/80 px-3 py-1 font-medium hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uiText.meetingNotes}
              </button>
              <button
                type="button"
                onClick={() => appendDraftTemplate("checklist")}
                disabled={readOnly}
                className="rounded-full border border-white/70 bg-white/80 px-3 py-1 font-medium hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uiText.checklist}
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
