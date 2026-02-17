import { Redis } from "@upstash/redis";

import { getServerEnv } from "@/lib/env";

let client: Redis | null = null;

function getClient(): Redis | null {
  if (client) return client;
  const env = getServerEnv();
  if (!env.upstashRedisUrl || !env.upstashRedisToken) {
    return null;
  }
  client = new Redis({
    url: env.upstashRedisUrl,
    token: env.upstashRedisToken,
  });
  return client;
}

export async function getTranslationCache<T>(key: string): Promise<T | null> {
  const redis = getClient();
  if (!redis) return null;
  return redis.get<T>(key);
}

export async function setTranslationCache<T>(key: string, value: T): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  await redis.set(key, value, { ex: 60 * 60 * 24 });
}

