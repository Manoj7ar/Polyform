const REQUIRED_SERVER = ["SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_URL"] as const;

function assertRequired(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function getServerEnv(): {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  upstashRedisUrl: string | undefined;
  upstashRedisToken: string | undefined;
} {
  for (const key of REQUIRED_SERVER) {
    assertRequired(key, process.env[key]);
  }

  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    upstashRedisUrl: process.env.UPSTASH_REDIS_REST_URL,
    upstashRedisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

export function getLingoEnv(): {
  lingoApiKey: string;
} {
  const lingoApiKey = process.env.LINGO_API_KEY ?? process.env.LINGODOTDEV_API_KEY;
  return {
    lingoApiKey: assertRequired("LINGO_API_KEY or LINGODOTDEV_API_KEY", lingoApiKey),
  };
}

export function getGeminiEnv(): {
  geminiApiKey: string;
  geminiModel: string;
} {
  const geminiApiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  return {
    geminiApiKey: assertRequired("GEMINI_API_KEY or GOOGLE_API_KEY", geminiApiKey),
    geminiModel: process.env.GEMINI_MODEL ?? "gemini-1.5-flash",
  };
}

export function getClientEnv(): {
  appUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
} {
  const supabaseUrl = assertRequired("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = assertRequired("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    supabaseUrl,
    supabaseAnonKey,
  };
}
