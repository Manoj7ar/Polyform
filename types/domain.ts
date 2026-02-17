export type BlockType = "document";

export type ShareMode = "edit" | "view";

export interface Space {
  id: string;
  title: string;
  source_language: string;
  share_mode_default: ShareMode;
  created_at: string;
  updated_at: string;
}

export interface Block {
  id: string;
  space_id: string;
  type: BlockType;
  x: number;
  y: number;
  w: number;
  h: number;
  source_language: string;
  translation_version: number;
  universal: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlockWithSource extends Block {
  source_content: unknown;
}

export interface PresencePayload {
  sessionId: string;
  displayName: string;
  language: string;
  color: string;
  cursorPosition: { x: number; y: number };
  lastSeen: number;
}

export interface BlockPatchPayload {
  id: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  universal?: boolean;
  translation_version?: number;
}

export interface TranslationRequestPayload {
  spaceId: string;
  blockId: string;
  texts: string[];
  sourceLang: string;
  targetLangs: string[];
  translationVersion: number;
}

export interface TranslationResponsePayload {
  blockId: string;
  translationVersion: number;
  results: Record<string, string[]>;
}

export interface Snapshot {
  id: string;
  space_id: string;
  payload: {
    space: Space;
    blocks: Array<BlockWithSource>;
  };
  created_at: string;
}
