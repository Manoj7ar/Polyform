import type { BlockType } from "@/types/domain";

export function extractTranslatableUnits(type: BlockType, content: unknown): string[] {
  if (type === "document") {
    const paragraphs = ((content as { paragraphs?: string[] }).paragraphs ?? []).map((item) => String(item));
    return paragraphs;
  }

  return [];
}

export function applyTranslatedUnits(type: BlockType, _content: unknown, translated: string[]): unknown {
  if (type === "document") {
    const content = (_content as Record<string, unknown>) ?? {};
    return { ...content, paragraphs: translated };
  }

  return { paragraphs: translated };
}
