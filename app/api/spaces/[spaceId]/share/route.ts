import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  context: { params: { spaceId: string } },
): Promise<NextResponse> {
  try {
    const body = (await request.json().catch(() => ({}))) as { mode?: "edit" | "view" };
    const mode = body.mode === "view" ? "view" : "edit";
    const token = randomUUID().replaceAll("-", "");

    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from("share_links")
      .insert({ space_id: context.params.spaceId, mode, token });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const link = `${appUrl}/space/${context.params.spaceId}?mode=${mode}&token=${token}`;

    return NextResponse.json({ link, mode, token });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

