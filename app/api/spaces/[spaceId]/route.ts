import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  context: { params: { spaceId: string } },
): Promise<NextResponse> {
  try {
    const supabase = createSupabaseServerClient();
    const { spaceId } = context.params;
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    const requestedMode = url.searchParams.get("mode");

    let accessMode: "edit" | "view" = requestedMode === "view" ? "view" : "edit";

    if (token) {
      const { data: sharedLink, error: linkError } = await supabase
        .from("share_links")
        .select("mode")
        .eq("space_id", spaceId)
        .eq("token", token)
        .single();

      if (linkError || !sharedLink) {
        return NextResponse.json({ error: "Invalid share link token" }, { status: 403 });
      }

      accessMode = sharedLink.mode === "view" ? "view" : "edit";
    }

    const { data: space, error: spaceError } = await supabase
      .from("spaces")
      .select("id,title,source_language,share_mode_default,created_at,updated_at")
      .eq("id", spaceId)
      .single();

    if (spaceError || !space) {
      return NextResponse.json({ error: spaceError?.message ?? "Space not found" }, { status: 404 });
    }

    const { data: blocks, error: blocksError } = await supabase
      .from("blocks")
      .select("id,space_id,type,x,y,w,h,source_language,translation_version,universal,source_content,created_at,updated_at")
      .eq("space_id", spaceId)
      .order("created_at", { ascending: true });

    if (blocksError) {
      return NextResponse.json({ error: blocksError.message }, { status: 500 });
    }

    return NextResponse.json({ space, blocks: blocks ?? [], accessMode });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: { spaceId: string } },
): Promise<NextResponse> {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      title?: string;
      shareModeDefault?: "edit" | "view";
    };

    const updates: Record<string, string> = {};
    if (body.title) updates.title = body.title;
    if (body.shareModeDefault) updates.share_mode_default = body.shareModeDefault;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("spaces")
      .update(updates)
      .eq("id", context.params.spaceId)
      .select("id,title,source_language,share_mode_default,created_at,updated_at")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Unable to update space" }, { status: 500 });
    }

    return NextResponse.json({ space: data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: { spaceId: string } },
): Promise<NextResponse> {
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("spaces").delete().eq("id", context.params.spaceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

