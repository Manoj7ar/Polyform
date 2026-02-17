import type { BlockType } from "@/types/domain";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", flag: "US" },
  { code: "ja", label: "Japanese", flag: "JP" },
  { code: "pt", label: "Portuguese", flag: "BR" },
  { code: "de", label: "German", flag: "DE" },
  { code: "fr", label: "French", flag: "FR" },
  { code: "es", label: "Spanish", flag: "ES" },
  { code: "ko", label: "Korean", flag: "KR" },
  { code: "zh", label: "Chinese", flag: "CN" },
];

export const BLOCK_META: Record<BlockType, { label: string; color: string; bg: string }> = {
  document: { label: "Google Doc", color: "#2563eb", bg: "#dbeafe" },
};

export const BLOCK_ORDER: BlockType[] = ["document"];

export const DEFAULT_BLOCK_CONTENT: Record<BlockType, unknown> = {
  document: {
    paragraphs: [
      "Welcome to your shared document.",
      "Type here and collaborators will see updates in real time.",
    ],
  },
};

export function defaultBlockSize(type: BlockType): { w: number; h: number } {
  if (type === "document") return { w: 760, h: 520 };
  return { w: 760, h: 520 };
}
