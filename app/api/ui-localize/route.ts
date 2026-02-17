import { LingoDotDevEngine } from "lingo.dev/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getLingoEnv } from "@/lib/env";

const schema = z.object({
  targetLang: z.string().min(2),
  texts: z.record(z.string(), z.any()),
});

let lingoEngine: LingoDotDevEngine | null = null;

function getLingoEngine(): LingoDotDevEngine {
  if (lingoEngine) return lingoEngine;
  const env = getLingoEnv();
  lingoEngine = new LingoDotDevEngine({ apiKey: env.lingoApiKey });
  return lingoEngine;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const input = schema.parse(await request.json());

    if (input.targetLang === "en") {
      return NextResponse.json({ texts: input.texts });
    }

    const engine = getLingoEngine();
    const localized = await engine.localizeObject(input.texts, {
      sourceLocale: "en",
      targetLocale: input.targetLang,
    });

    return NextResponse.json({ texts: localized });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map((issue) => issue.message).join("; ") || "Invalid localization request";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
