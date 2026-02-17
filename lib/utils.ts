import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function debounce<T extends (...args: any[]) => void>(fn: T, wait = 600): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => fn(...args), wait);
  };
}

export function isNumericValue(value: string): boolean {
  return /^-?\d+(?:[.,]\d+)?$/.test(value.trim());
}

export function dominantLanguage(value: string): string {
  const hasKana = /[\u3040-\u30ff]/.test(value);
  const hasCjk = /[\u4e00-\u9fff]/.test(value);
  if (hasKana) return "ja";
  if (hasCjk) return "zh";
  return "en";
}

export function randomColor(seed: string): string {
  const palette = ["#2563eb", "#0891b2", "#16a34a", "#ea580c", "#dc2626", "#7c3aed"];
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

export function wsBaseFromHttp(baseUrl: string): string {
  if (baseUrl.startsWith("https://")) {
    return `wss://${baseUrl.slice(8)}`;
  }
  if (baseUrl.startsWith("http://")) {
    return `ws://${baseUrl.slice(7)}`;
  }
  return baseUrl;
}

export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function stringify(value: unknown): string {
  return JSON.stringify(value);
}

