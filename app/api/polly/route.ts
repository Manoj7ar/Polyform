import { LingoDotDevEngine } from "lingo.dev/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getGeminiEnv, getLingoEnv } from "@/lib/env";

const schema = z.object({
  prompt: z.string().min(1),
  sourceText: z.string().optional().default(""),
});

const LANGUAGE_ALIASES: Array<{ code: string; label: string; aliases: string[] }> = [
  { code: "en", label: "English", aliases: ["english", "eng"] },
  { code: "de", label: "German", aliases: ["german", "deutsch"] },
  { code: "fr", label: "French", aliases: ["french", "francais", "français"] },
  { code: "es", label: "Spanish", aliases: ["spanish", "espanol", "español"] },
  { code: "pt", label: "Portuguese", aliases: ["portuguese", "portugues", "português", "brazilian portuguese"] },
  { code: "ja", label: "Japanese", aliases: ["japanese", "nihongo"] },
  { code: "ko", label: "Korean", aliases: ["korean"] },
  { code: "zh", label: "Chinese", aliases: ["chinese", "mandarin"] },
];

let lingoEngine: LingoDotDevEngine | null = null;
const PREFERRED_GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash",
  "gemini-1.5-pro-latest",
  "gemini-1.5-pro",
] as const;

function getLingoEngine(): LingoDotDevEngine {
  if (lingoEngine) return lingoEngine;
  const env = getLingoEnv();
  lingoEngine = new LingoDotDevEngine({ apiKey: env.lingoApiKey });
  return lingoEngine;
}

function detectTargetLanguage(prompt: string): { code: string; label: string } {
  const lower = prompt.toLowerCase();

  for (const language of LANGUAGE_ALIASES) {
    if (language.aliases.some((alias) => new RegExp(`\\b${alias}\\b`, "i").test(lower))) {
      return { code: language.code, label: language.label };
    }
  }

  return { code: "en", label: "English" };
}

function sanitizeText(input: string): string {
  return input
    .replace(/\*\*/g, "")
    .replace(/#/g, "")
    .replace(/[—–]/g, ":")
    .replace(/^\s*[*]\s+/gm, "- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeGeminiModelName(model: string): string {
  return model.replace(/^models\//, "").trim();
}

async function listGenerateContentModels(apiKey: string): Promise<string[]> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
    method: "GET",
  });

  const data = (await response.json()) as {
    models?: Array<{
      name?: string;
      supportedGenerationMethods?: string[];
    }>;
  };

  if (!response.ok || !Array.isArray(data.models)) {
    return [];
  }

  return data.models
    .filter((model) => (model.supportedGenerationMethods ?? []).includes("generateContent"))
    .map((model) => normalizeGeminiModelName(model.name ?? ""))
    .filter((model) => model.length > 0);
}

async function resolveGeminiModelCandidates(apiKey: string, configuredModel: string): Promise<string[]> {
  const configured = normalizeGeminiModelName(configuredModel);
  const available = await listGenerateContentModels(apiKey);

  const ordered = [configured, ...PREFERRED_GEMINI_MODELS, ...available.map((model) => normalizeGeminiModelName(model))].filter(
    (model) => model.length > 0,
  );

  const unique = [...new Set(ordered)];
  if (available.length === 0) return unique;

  return unique.filter((model) => available.includes(model));
}

async function generateEnglishDraft(prompt: string, sourceText: string): Promise<string> {
  const { geminiApiKey, geminiModel } = getGeminiEnv();
  const modelCandidates = await resolveGeminiModelCandidates(geminiApiKey, geminiModel);

  const instruction = [
    "You are Polly, an expert document drafting assistant.",
    "Return plain text only.",
    "Never use these characters in output: #, **, or em dash.",
    "Use clean section titles, spacing, and bullet points with '-'.",
    "Write in polished A-grade quality with clear structure.",
    "Target length: approximately 700 words (acceptable range: 680 to 740 words).",
    "",
    "User request:",
    prompt,
    "",
    "Current document context (optional):",
    sourceText || "(empty)",
  ].join("\n");

  let lastError = "Gemini generation failed";

  for (const candidateModel of modelCandidates) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${candidateModel}:generateContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: instruction }] }],
        generationConfig: {
          temperature: 0.5,
          topP: 0.9,
          maxOutputTokens: 1800,
        },
      }),
    });

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      lastError = data.error?.message ?? `Gemini generation failed for model ${candidateModel}`;
      continue;
    }

    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!text) {
      lastError = `Gemini returned empty draft for model ${candidateModel}`;
      continue;
    }

    return sanitizeText(text);
  }

  throw new Error(lastError);
}

async function translateWithLingo(text: string, targetCode: string): Promise<string> {
  const engine = getLingoEngine();
  const translated = await engine.localizeText(text, {
    sourceLocale: "en",
    targetLocale: targetCode,
  });

  if (typeof translated !== "string" || translated.length === 0) {
    throw new Error("Lingo translation returned empty text");
  }

  return sanitizeText(translated);
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const input = schema.parse(await request.json());
    const targetLanguage = detectTargetLanguage(input.prompt);
    const shouldCenter = /\b(center|centre|centered|align center|center align)\b/i.test(input.prompt);

    const englishDraft = await generateEnglishDraft(input.prompt, input.sourceText);
    const finalDraft = targetLanguage.code === "en" ? englishDraft : await translateWithLingo(englishDraft, targetLanguage.code);

    const assistantText =
      targetLanguage.code === "en"
        ? "Draft ready in English. I will type it into the document now."
        : `Draft ready in ${targetLanguage.label}. I will type it into the document now.`;

    return NextResponse.json({
      assistantText: sanitizeText(assistantText),
      draftText: finalDraft,
      targetLanguageCode: targetLanguage.code,
      targetLanguageLabel: targetLanguage.label,
      center: shouldCenter,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map((issue) => issue.message).join("; ") || "Invalid Polly request payload";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
