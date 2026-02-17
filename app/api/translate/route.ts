import { createHash } from "node:crypto";

import { LingoDotDevEngine } from "lingo.dev/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getLingoEnv } from "@/lib/env";
import { getTranslationCache, setTranslationCache } from "@/lib/translation/cache";

const schema = z.object({
  spaceId: z.string().min(1),
  blockId: z.string().min(1),
  texts: z.array(z.string()).min(1),
  sourceLang: z.string().min(2),
  targetLangs: z.array(z.string()).min(1),
  translationVersion: z.number().int().positive(),
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
    const textsDigest = createHash("sha1").update(input.texts.join("|"), "utf8").digest("hex");
    const targetsDigest = createHash("sha1").update(input.targetLangs.sort().join(","), "utf8").digest("hex");
    const cacheKey = `translation:${input.spaceId}:${input.blockId}:${input.translationVersion}:${input.sourceLang}:${targetsDigest}:${textsDigest}`;

    const cached = await getTranslationCache<Record<string, string[]>>(cacheKey);
    if (cached) {
      return NextResponse.json({
        blockId: input.blockId,
        translationVersion: input.translationVersion,
        results: cached,
        cached: true,
      });
    }

    const engine = getLingoEngine();
    const entries = await Promise.all(
      input.targetLangs.map(async (targetLang) => {
        const translated = await engine.localizeStringArray(input.texts, {
          sourceLocale: input.sourceLang,
          targetLocale: targetLang,
        });

        const normalized = Array.isArray(translated) ? translated.map((value) => String(value)) : [];
        return [targetLang, normalized] as const;
      }),
    );

    const parsed = Object.fromEntries(entries) as Record<string, string[]>;

    await setTranslationCache(cacheKey, parsed);

    return NextResponse.json({
      blockId: input.blockId,
      translationVersion: input.translationVersion,
      results: parsed,
      cached: false,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
