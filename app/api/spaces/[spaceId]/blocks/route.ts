import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

interface BlockPatch {
  id: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  source_content?: unknown;
  translation_version?: number;
  universal?: boolean;
}

export async function PATCH(
  request: Request,
  context: { params: { spaceId: string } },
): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { blocks?: BlockPatch[] };
    const blocks = body.blocks ?? [];

    if (blocks.length === 0) {
      return NextResponse.json({ error: "No block updates" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    for (const block of blocks) {
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (block.x !== undefined) update.x = block.x;
      if (block.y !== undefined) update.y = block.y;
      if (block.w !== undefined) update.w = block.w;
      if (block.h !== undefined) update.h = block.h;
      if (block.source_content !== undefined) update.source_content = block.source_content;
      if (block.translation_version !== undefined) update.translation_version = block.translation_version;
      if (block.universal !== undefined) update.universal = block.universal;

      const { error } = await supabase
        .from("blocks")
        .update(update)
        .eq("id", block.id)
        .eq("space_id", context.params.spaceId);

      if (error) {
        return NextResponse.json({ error: error.message, failedBlockId: block.id }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

