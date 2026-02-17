import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  context: { params: { spaceId: string } },
): Promise<NextResponse> {
  try {
    const supabase = createSupabaseServerClient();
    const { spaceId } = context.params;

    const { data: space, error: spaceError } = await supabase
      .from("spaces")
      .select("id,title,source_language,share_mode_default,created_at,updated_at")
      .eq("id", spaceId)
      .single();

    if (spaceError || !space) {
      return NextResponse.json({ error: spaceError?.message ?? "Space not found" }, { status: 404 });
    }

    const { data: blocks, error: blockError } = await supabase
      .from("blocks")
      .select("id,space_id,type,x,y,w,h,source_language,translation_version,universal,source_content,created_at,updated_at")
      .eq("space_id", spaceId)
      .order("created_at", { ascending: true });

    if (blockError) {
      return NextResponse.json({ error: blockError.message }, { status: 500 });
    }

    const payload = {
      space,
      blocks: blocks ?? [],
    };

    const { data: snapshot, error: snapshotError } = await supabase
      .from("space_snapshots")
      .insert({
        space_id: spaceId,
        payload,
      })
      .select("id,created_at")
      .single();

    if (snapshotError || !snapshot) {
      return NextResponse.json({ error: snapshotError?.message ?? "Unable to create snapshot" }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const link = `${appUrl}/space/${spaceId}/snapshot/${snapshot.id}`;

    return NextResponse.json({ snapshotId: snapshot.id, createdAt: snapshot.created_at, link });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

