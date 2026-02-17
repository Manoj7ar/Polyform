"use client";

import { createClient } from "@supabase/supabase-js";

import { getClientEnv } from "@/lib/env";

let client: ReturnType<typeof createClient> | null = null;

export function createSupabaseBrowserClient() {
  if (client) return client;
  const env = getClientEnv();
  client = createClient(env.supabaseUrl, env.supabaseAnonKey);
  return client;
}

