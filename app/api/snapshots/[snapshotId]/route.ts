import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: { snapshotId: string } },
): Promise<NextResponse> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("space_snapshots")
      .select("id,space_id,payload,created_at")
      .eq("id", context.params.snapshotId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Snapshot not found" }, { status: 404 });
    }

    return NextResponse.json({ snapshot: data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

