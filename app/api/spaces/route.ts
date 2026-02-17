import { NextResponse } from "next/server";

import { BLOCK_ORDER, DEFAULT_BLOCK_CONTENT, defaultBlockSize } from "@/lib/defaults";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BlockType } from "@/types/domain";

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("spaces")
      .select("id,title,source_language,share_mode_default,created_at,updated_at")
      .order("updated_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ spaces: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json().catch(() => ({}))) as { title?: string; sourceLanguage?: string };
    const title = body.title?.trim() || "Untitled Space";
    const sourceLanguage = body.sourceLanguage?.trim() || "en";

    const supabase = createSupabaseServerClient();

    const { data: space, error: spaceError } = await supabase
      .from("spaces")
      .insert({
        title,
        source_language: sourceLanguage,
        share_mode_default: "edit",
      })
      .select("id,title,source_language,share_mode_default,created_at,updated_at")
      .single();

    if (spaceError || !space) {
      return NextResponse.json({ error: spaceError?.message ?? "Unable to create space" }, { status: 500 });
    }

    const blockRows = BLOCK_ORDER.map((type: BlockType, index) => {
      const size = defaultBlockSize(type);
      return {
        space_id: space.id,
        type,
        x: 120 + index * 90,
        y: 120 + index * 70,
        w: size.w,
        h: size.h,
        source_language: sourceLanguage,
        translation_version: 1,
        universal: false,
        source_content: DEFAULT_BLOCK_CONTENT[type],
      };
    });

    const { error: blockError } = await supabase.from("blocks").insert(blockRows);
    if (blockError) {
      return NextResponse.json({ error: blockError.message }, { status: 500 });
    }

    return NextResponse.json({ space }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

