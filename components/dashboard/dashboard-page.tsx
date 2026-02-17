"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { PolyformLogoBadge } from "@/components/brand/polyform-logo";
import { BLOCK_META, BLOCK_ORDER } from "@/lib/defaults";
import type { Space } from "@/types/domain";

function TrashIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export function DashboardPage(): JSX.Element {
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingSpaceId, setDeletingSpaceId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadSpaces(): Promise<void> {
    try {
      const response = await fetch("/api/spaces", { cache: "no-store" });
      const data = await response.json();
      if (response.ok) {
        setSpaces(data.spaces as Space[]);
        setActionError(null);
      } else {
        setActionError(data.error ?? "Failed to load spaces.");
      }
    } catch {
      setActionError("Failed to load spaces.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSpaces();
  }, []);

  async function createSpace(): Promise<void> {
    setIsCreating(true);
    try {
      const response = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Space", sourceLanguage: "en" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to create space");
      router.push(`/space/${data.space.id}`);
    } finally {
      setIsCreating(false);
    }
  }

  async function deleteSpace(space: Space): Promise<void> {
    if (deletingSpaceId) return;
    const shouldDelete = window.confirm(`Delete "${space.title}"? This cannot be undone.`);
    if (!shouldDelete) return;

    setDeletingSpaceId(space.id);
    setActionError(null);
    try {
      const response = await fetch(`/api/spaces/${space.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to delete space");
      setSpaces((current) => current.filter((item) => item.id !== space.id));
    } catch (error) {
      setActionError((error as Error).message);
    } finally {
      setDeletingSpaceId(null);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#ecebe7] px-6 pb-20 pt-6 md:px-10">
      <section className="relative z-10 mx-auto max-w-6xl">
        <div className="rounded-[28px] border border-white/70 bg-white/45 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/70 bg-white/60 px-5 py-4">
            <div className="flex items-center gap-3">
              <PolyformLogoBadge className="h-11 w-11 rounded-xl" markClassName="h-6 w-6 text-[#2f3338]" title="Polyform logo" />
              <div>
                <h1 className="text-xl font-bold text-[#1f2937]">Polyform Workspace</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void createSpace()}
              disabled={isCreating}
              className="rounded-full border border-[#8bc4ff] bg-[#c2e7ff]/90 px-5 py-2 text-sm font-semibold text-[#001d35] shadow-[0_1px_0_rgba(255,255,255,0.8)] disabled:opacity-70"
            >
              {isCreating ? "Creating..." : "Create New Space"}
            </button>
          </div>

        </div>
      </section>

      <section className="relative z-10 mx-auto mt-8 max-w-6xl">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Quick Start Templates</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {BLOCK_ORDER.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => void createSpace()}
              className="rounded-2xl border border-white/70 bg-white/60 p-4 text-left shadow-[0_10px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl transition hover:-translate-y-0.5"
            >
              <div className="h-8 w-8 rounded-lg" style={{ background: BLOCK_META[type].bg }} />
              <p className="mt-3 text-sm font-semibold text-[#1f2937]">{BLOCK_META[type].label}</p>
              <p className="mt-1 text-xs text-[#6b7280]">Start a new space with this setup</p>
            </button>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto mt-10 max-w-6xl rounded-[28px] border border-white/70 bg-white/50 p-3 shadow-[0_16px_36px_rgba(15,23,42,0.12)] backdrop-blur-2xl">
        <div className="rounded-2xl border border-white/70 bg-white/65">
          <div className="border-b border-white/70 px-5 py-4">
            <h2 className="text-sm font-semibold text-[#1f2937]">Recent Spaces</h2>
            {actionError ? <p className="mt-1 text-xs text-red-600">{actionError}</p> : null}
          </div>

          {isLoading ? (
            <div className="p-5 text-sm text-[#6b7280]">Loading spaces...</div>
          ) : spaces.length === 0 ? (
            <div className="p-5 text-sm text-[#6b7280]">No spaces yet. Create your first one.</div>
          ) : (
            <ul>
              {spaces.map((space) => (
                <li key={space.id}>
                  <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b border-white/70 px-5 py-4 last:border-none hover:bg-white/45">
                    <button type="button" onClick={() => router.push(`/space/${space.id}`)} className="text-left">
                      <span className="block text-sm font-semibold text-[#1f2937]">{space.title}</span>
                      <span className="block text-xs text-[#6b7280]">{space.id}</span>
                    </button>
                    <span className="text-xs text-[#6b7280]">Space</span>
                    <span className="text-xs text-[#6b7280]">{new Date(space.updated_at).toLocaleString()}</span>
                    <button
                      type="button"
                      onClick={() => void deleteSpace(space)}
                      disabled={deletingSpaceId === space.id}
                      title="Delete space"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6b7280] transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
