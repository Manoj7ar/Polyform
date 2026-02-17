"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BlockPatchPayload, PresencePayload } from "@/types/domain";

interface TranslationPayload {
  blockId: string;
  translationVersion: number;
  language: string;
  texts: string[];
}

interface DocumentUpdatePayload {
  blockId: string;
  translationVersion: number;
  sourceContent: unknown;
  sessionId: string;
}

interface SupabaseRoomClientOptions {
  spaceId: string;
  sessionId: string;
  displayName: string;
  color: string;
  language: string;
  onPresence: (presence: PresencePayload) => void;
  onBlockPatch: (patch: BlockPatchPayload) => void;
  onTranslation: (payload: TranslationPayload) => void;
  onDocumentUpdate: (payload: DocumentUpdatePayload) => void;
}

export class SupabaseRoomClient {
  private readonly options: SupabaseRoomClientOptions;

  private channel: ReturnType<ReturnType<typeof createSupabaseBrowserClient>["channel"]> | null = null;

  constructor(options: SupabaseRoomClientOptions) {
    this.options = options;
  }

  connect(): void {
    const supabase = createSupabaseBrowserClient();
    this.channel = supabase.channel(`space:${this.options.spaceId}`, {
      config: {
        broadcast: { self: false, ack: false },
      },
    });

    this.channel
      .on("broadcast", { event: "cursor_update" }, ({ payload }) => {
        this.options.onPresence(payload as PresencePayload);
      })
      .on("broadcast", { event: "block_patch" }, ({ payload }) => {
        this.options.onBlockPatch(payload as BlockPatchPayload);
      })
      .on("broadcast", { event: "translation_update" }, ({ payload }) => {
        this.options.onTranslation(payload as TranslationPayload);
      })
      .on("broadcast", { event: "document_update" }, ({ payload }) => {
        this.options.onDocumentUpdate(payload as DocumentUpdatePayload);
      })
      .subscribe();
  }

  broadcastPresence(presence: PresencePayload): void {
    void this.channel?.send({ type: "broadcast", event: "cursor_update", payload: presence });
  }

  broadcastBlockPatch(payload: BlockPatchPayload): void {
    void this.channel?.send({ type: "broadcast", event: "block_patch", payload });
  }

  broadcastTranslation(payload: TranslationPayload): void {
    void this.channel?.send({ type: "broadcast", event: "translation_update", payload });
  }

  broadcastDocumentUpdate(payload: DocumentUpdatePayload): void {
    void this.channel?.send({ type: "broadcast", event: "document_update", payload });
  }

  close(): void {
    if (!this.channel) return;
    const supabase = createSupabaseBrowserClient();
    void supabase.removeChannel(this.channel);
    this.channel = null;
  }
}
