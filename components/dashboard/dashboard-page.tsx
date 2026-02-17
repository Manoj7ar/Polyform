"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { PolyformLogoBadge } from "@/components/brand/polyform-logo";
import { BLOCK_META, BLOCK_ORDER, SUPPORTED_LANGUAGES } from "@/lib/defaults";
import type { Space } from "@/types/domain";

export function DashboardPage(): JSX.Element {
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/spaces", { cache: "no-store" });
      const data = await response.json();
      if (response.ok) {
        setSpaces(data.spaces as Space[]);
      }
      setIsLoading(false);
    })();
  }, []);

  const sourceLanguage = useMemo(() => SUPPORTED_LANGUAGES.find((lang) => lang.code === "en")?.label ?? "English", []);

  async function createSpace(): Promise<void> {
    setIsCreating(true);
    try {
      const response = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Space", sourceLanguage: "en" }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to create space");
      }
      router.push(`/space/${data.space.id}`);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="min-h-screen px-6 pb-20 pt-6 md:px-10">
      <div className="mx-auto max-w-6xl rounded-2xl border border-[var(--border)] bg-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PolyformLogoBadge className="h-10 w-10 rounded-xl" markClassName="h-6 w-6 text-[#2f3338]" title="Polyform logo" />
            <div>
            <h1 className="text-xl font-bold text-slate-900">Polyform Workspace</h1>
            <p className="text-sm text-slate-600">Create and share multilingual spaces instantly.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void createSpace()}
            disabled={isCreating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {isCreating ? "Creating..." : "Create New Space"}
          </button>
        </div>
      </div>

      <section className="mx-auto mt-8 max-w-6xl">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Create Block Templates</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {BLOCK_ORDER.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => void createSpace()}
              className="rounded-xl border border-[var(--border)] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="h-8 w-8 rounded-md" style={{ background: BLOCK_META[type].bg }} />
              <p className="mt-3 text-sm font-semibold text-slate-900">{BLOCK_META[type].label}</p>
              <p className="mt-1 text-xs text-slate-500">Starts with this block in a new Space</p>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-6xl rounded-2xl border border-[var(--border)] bg-white">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Recent Spaces</h2>
        </div>

        {isLoading ? (
          <div className="p-5 text-sm text-slate-500">Loading spaces...</div>
        ) : spaces.length === 0 ? (
          <div className="p-5 text-sm text-slate-500">No spaces yet. Create your first one.</div>
        ) : (
          <ul>
            {spaces.map((space) => (
              <li key={space.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/space/${space.id}`)}
                  className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-slate-100 px-5 py-4 text-left last:border-none hover:bg-slate-50"
                >
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{space.title}</span>
                    <span className="block text-xs text-slate-500">{space.id}</span>
                  </span>
                  <span className="text-xs text-slate-500">{sourceLanguage}</span>
                  <span className="text-xs text-slate-500">{new Date(space.updated_at).toLocaleString()}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

