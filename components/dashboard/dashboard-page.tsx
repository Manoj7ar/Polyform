"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { PolyformLogoBadge } from "@/components/brand/polyform-logo";
import { BLOCK_META, BLOCK_ORDER } from "@/lib/defaults";
import type { BlockType, Space } from "@/types/domain";

type SortMode = "updated_desc" | "updated_asc" | "title_asc" | "title_desc";
type ViewMode = "grid" | "list";

function SearchIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

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

function StarIcon({ filled = false }: { filled?: boolean }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6-4.3-4.2 6-.9L12 3Z" />
    </svg>
  );
}

function GridIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function ListIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </svg>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function sortSpaces(items: Space[], mode: SortMode): Space[] {
  const sorted = [...items];
  sorted.sort((a, b) => {
    if (mode === "updated_desc") return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    if (mode === "updated_asc") return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
    if (mode === "title_desc") return b.title.localeCompare(a.title);
    return a.title.localeCompare(b.title);
  });
  return sorted;
}

export function DashboardPage(): JSX.Element {
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingSpaceId, setDeletingSpaceId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("updated_desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [pinnedSpaceIds, setPinnedSpaceIds] = useState<string[]>([]);

  async function loadSpaces(): Promise<void> {
    try {
      const response = await fetch("/api/spaces", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        setActionError(data.error ?? "Failed to load spaces.");
        return;
      }
      setSpaces(data.spaces as Space[]);
      setActionError(null);
    } catch {
      setActionError("Failed to load spaces.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSpaces();
    const rawPinned = window.localStorage.getItem("polyform-pinned-spaces");
    if (!rawPinned) return;
    try {
      const parsed = JSON.parse(rawPinned) as string[];
      if (Array.isArray(parsed)) setPinnedSpaceIds(parsed);
    } catch {
      // Ignore invalid local storage payload.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("polyform-pinned-spaces", JSON.stringify(pinnedSpaceIds));
  }, [pinnedSpaceIds]);

  async function createSpace(type: BlockType = "document"): Promise<void> {
    setIsCreating(true);
    try {
      const response = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: type === "document" ? "Untitled Polly Doc" : "Untitled Space",
          sourceLanguage: "en",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to create space");
      router.push(`/space/${data.space.id}`);
    } catch (error) {
      setActionError((error as Error).message);
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
      setPinnedSpaceIds((current) => current.filter((id) => id !== space.id));
    } catch (error) {
      setActionError((error as Error).message);
    } finally {
      setDeletingSpaceId(null);
    }
  }

  async function copySpaceLink(spaceId: string): Promise<void> {
    const url = `${window.location.origin}/space/${spaceId}`;
    await navigator.clipboard.writeText(url);
  }

  function joinSpaceByLink(): void {
    const input = window.prompt("Paste a space URL or space ID");
    if (!input) return;

    const trimmed = input.trim();
    const match = trimmed.match(/\/space\/([^/?#]+)/i);
    const spaceId = match?.[1] ?? trimmed;
    if (!spaceId) return;
    router.push(`/space/${spaceId}`);
  }

  function togglePin(spaceId: string): void {
    setPinnedSpaceIds((current) => (current.includes(spaceId) ? current.filter((id) => id !== spaceId) : [spaceId, ...current]));
  }

  const filteredSpaces = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortSpaces(spaces, sortMode);
    const matched = spaces.filter((space) => space.title.toLowerCase().includes(q) || space.id.toLowerCase().includes(q));
    return sortSpaces(matched, sortMode);
  }, [query, sortMode, spaces]);

  const pinnedSpaces = useMemo(() => {
    const map = new Map(spaces.map((space) => [space.id, space]));
    return pinnedSpaceIds.map((id) => map.get(id)).filter((space): space is Space => Boolean(space));
  }, [pinnedSpaceIds, spaces]);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const updatedToday = spaces.filter((space) => new Date(space.updated_at).getTime() >= startOfDay).length;
    return {
      total: spaces.length,
      pinned: pinnedSpaces.length,
      updatedToday,
    };
  }, [pinnedSpaces.length, spaces]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#e9e7e1] px-6 pb-20 pt-8 md:px-10">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-[-14%] h-[420px] w-[420px] rounded-full bg-[#7dd3fc]/25 blur-3xl" />
        <div className="absolute right-[-8%] top-[18%] h-[440px] w-[440px] rounded-full bg-[#f97316]/20 blur-3xl" />
        <div className="absolute bottom-[-18%] left-[26%] h-[460px] w-[460px] rounded-full bg-[#a78bfa]/20 blur-3xl" />
      </div>

      <section className="relative z-10 mx-auto max-w-6xl">
        <header className="rounded-[34px] border border-white/35 bg-white/16 p-3 shadow-[0_18px_36px_rgba(15,23,42,0.14)] backdrop-blur-3xl">
          <div className="flex flex-wrap items-center gap-3 rounded-[26px] border border-white/35 bg-white/24 px-5 py-4 backdrop-blur-3xl">
            <div className="flex items-center gap-3">
              <PolyformLogoBadge className="h-11 w-11 rounded-xl bg-white/65" markClassName="h-6 w-6 text-[#2f3338]" title="Polyform logo" />
              <div>
                <h1 className="text-xl font-bold text-[#172033]">Polyform App</h1>
                <p className="text-xs text-[#61708d]">Realtime multilingual spaces with Polly Docs</p>
              </div>
            </div>

            <div className="ml-auto flex w-full flex-wrap items-center gap-2 md:w-auto">
              <label className="flex w-full items-center gap-2 rounded-full border border-white/45 bg-white/26 px-3 py-2 text-xs text-[#61708d] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-2xl md:w-[260px]">
                <SearchIcon />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search spaces by title or ID"
                  className="w-full bg-transparent text-sm text-[#172033] outline-none placeholder:text-[#94a3b8]"
                />
              </label>
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                className="rounded-full border border-white/45 bg-white/26 px-3 py-2 text-xs font-medium text-[#475569] outline-none backdrop-blur-2xl"
              >
                <option value="updated_desc">Recently updated</option>
                <option value="updated_asc">Oldest updated</option>
                <option value="title_asc">Title A-Z</option>
                <option value="title_desc">Title Z-A</option>
              </select>
              <button
                type="button"
                onClick={() => void createSpace("document")}
                disabled={isCreating}
                className="rounded-full bg-[#1f6feb] px-5 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(31,111,235,0.35)] transition hover:bg-[#1557b5] disabled:opacity-70"
              >
                {isCreating ? "Creating..." : "New Polly Doc"}
              </button>
            </div>
          </div>
        </header>
      </section>

      <section className="relative z-10 mx-auto mt-6 grid max-w-6xl gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-white/38 bg-white/22 p-5 shadow-[0_14px_28px_rgba(15,23,42,0.08)] backdrop-blur-3xl">
          <p className="text-xs uppercase tracking-wide text-[#64748b]">Total Spaces</p>
          <p className="mt-2 text-3xl font-black text-[#172033]">{stats.total}</p>
        </article>
        <article className="rounded-2xl border border-white/38 bg-white/22 p-5 shadow-[0_14px_28px_rgba(15,23,42,0.08)] backdrop-blur-3xl">
          <p className="text-xs uppercase tracking-wide text-[#64748b]">Updated Today</p>
          <p className="mt-2 text-3xl font-black text-[#172033]">{stats.updatedToday}</p>
        </article>
        <article className="rounded-2xl border border-white/38 bg-white/22 p-5 shadow-[0_14px_28px_rgba(15,23,42,0.08)] backdrop-blur-3xl">
          <p className="text-xs uppercase tracking-wide text-[#64748b]">Pinned Spaces</p>
          <p className="mt-2 text-3xl font-black text-[#172033]">{stats.pinned}</p>
        </article>
      </section>

      <section className="relative z-10 mx-auto mt-6 max-w-6xl rounded-[30px] border border-white/38 bg-white/20 p-4 shadow-[0_16px_34px_rgba(15,23,42,0.1)] backdrop-blur-3xl">
        <div className="grid gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={() => void createSpace("document")}
            className="rounded-2xl border border-white/42 bg-white/24 p-4 text-left text-[#172033] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-white/30 hover:shadow-sm"
          >
            <p className="text-sm font-semibold">Create Polly Doc Space</p>
            <p className="mt-1 text-xs text-[#64748b]">Start a fresh collaborative document space.</p>
          </button>
          <button
            type="button"
            onClick={joinSpaceByLink}
            className="rounded-2xl border border-white/42 bg-white/24 p-4 text-left text-[#172033] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-white/30 hover:shadow-sm"
          >
            <p className="text-sm font-semibold">Join by Link</p>
            <p className="mt-1 text-xs text-[#64748b]">Paste a shared URL or ID to jump into a space.</p>
          </button>
          <button
            type="button"
            onClick={() => router.push("/architecture")}
            className="rounded-2xl border border-white/42 bg-white/24 p-4 text-left text-[#172033] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-white/30 hover:shadow-sm"
          >
            <p className="text-sm font-semibold">View Architecture</p>
            <p className="mt-1 text-xs text-[#64748b]">Review realtime + lingo.dev integration flow.</p>
          </button>
        </div>
      </section>

      <section className="relative z-10 mx-auto mt-6 max-w-6xl">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">Template Library</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {BLOCK_ORDER.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => void createSpace(type)}
              className="rounded-2xl border border-white/42 bg-white/22 p-4 text-left shadow-[0_10px_24px_rgba(15,23,42,0.08)] backdrop-blur-3xl transition hover:-translate-y-0.5 hover:bg-white/28"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-[#1f2937]" style={{ background: BLOCK_META[type].bg }}>
                P
              </div>
              <p className="mt-3 text-sm font-semibold text-[#172033]">{BLOCK_META[type].label}</p>
              <p className="mt-1 text-xs text-[#64748b]">Use template</p>
            </button>
          ))}
        </div>
      </section>

      {pinnedSpaces.length > 0 ? (
        <section className="relative z-10 mx-auto mt-8 max-w-6xl">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">Pinned</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {pinnedSpaces.slice(0, 3).map((space) => (
              <article key={`pinned-${space.id}`} className="rounded-2xl border border-white/42 bg-white/22 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)] backdrop-blur-3xl">
                <h3 className="truncate text-sm font-semibold text-[#172033]">{space.title}</h3>
                <p className="mt-1 text-xs text-[#64748b]">{space.id}</p>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/space/${space.id}`)}
                    className="rounded-full bg-[#1f6feb] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePin(space.id)}
                    className="rounded-full border border-white/46 bg-white/26 px-3 py-1.5 text-xs font-medium text-[#475569] backdrop-blur-2xl"
                  >
                    Unpin
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="relative z-10 mx-auto mt-8 max-w-6xl rounded-[30px] border border-white/38 bg-white/20 p-3 shadow-[0_16px_34px_rgba(15,23,42,0.1)] backdrop-blur-3xl">
        <div className="rounded-2xl border border-white/38 bg-white/24 backdrop-blur-3xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/42 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-[#172033]">Recent Spaces</h2>
              {actionError ? <p className="mt-1 text-xs text-red-600">{actionError}</p> : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${
                  viewMode === "grid" ? "bg-[#e8f1ff]/54 text-[#174ea6]" : "bg-white/26 text-[#64748b]"
                }`}
              >
                <GridIcon />
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${
                  viewMode === "list" ? "bg-[#e8f1ff]/54 text-[#174ea6]" : "bg-white/26 text-[#64748b]"
                }`}
              >
                <ListIcon />
                List
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="p-5 text-sm text-[#6b7280]">Loading spaces...</div>
          ) : filteredSpaces.length === 0 ? (
            <div className="p-5 text-sm text-[#6b7280]">No matching spaces found.</div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredSpaces.map((space) => {
                const isPinned = pinnedSpaceIds.includes(space.id);
                return (
                  <article key={space.id} className="rounded-2xl border border-white/45 bg-white/24 p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)] backdrop-blur-3xl">
                    <div className="flex items-start justify-between gap-2">
                      <button type="button" onClick={() => router.push(`/space/${space.id}`)} className="min-w-0 text-left">
                        <h3 className="truncate text-sm font-semibold text-[#172033]">{space.title}</h3>
                        <p className="mt-1 truncate text-xs text-[#64748b]">{space.id}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePin(space.id)}
                        className={`rounded-full p-1.5 ${isPinned ? "text-amber-500" : "text-[#94a3b8]"}`}
                        title={isPinned ? "Unpin" : "Pin"}
                      >
                        <StarIcon filled={isPinned} />
                      </button>
                    </div>
                    <p className="mt-3 text-xs text-[#64748b]">Updated {formatDate(space.updated_at)}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/space/${space.id}`)}
                        className="rounded-full bg-[#1f6feb] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => void copySpaceLink(space.id)}
                        className="rounded-full border border-white/46 bg-white/26 px-3 py-1.5 text-xs font-medium text-[#475569] backdrop-blur-2xl"
                      >
                        Copy Link
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteSpace(space)}
                        disabled={deletingSpaceId === space.id}
                        className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-[#64748b] transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Delete space"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <ul>
              {filteredSpaces.map((space) => {
                const isPinned = pinnedSpaceIds.includes(space.id);
                return (
                  <li key={space.id}>
                    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 border-b border-white/42 px-5 py-4 last:border-none hover:bg-white/24">
                      <button type="button" onClick={() => router.push(`/space/${space.id}`)} className="text-left">
                        <span className="block text-sm font-semibold text-[#172033]">{space.title}</span>
                        <span className="block text-xs text-[#64748b]">{space.id}</span>
                      </button>
                      <span className="text-xs text-[#64748b]">{formatDate(space.updated_at)}</span>
                      <button
                        type="button"
                        onClick={() => togglePin(space.id)}
                        className={`rounded-full p-1.5 ${isPinned ? "text-amber-500" : "text-[#94a3b8]"}`}
                        title={isPinned ? "Unpin" : "Pin"}
                      >
                        <StarIcon filled={isPinned} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void copySpaceLink(space.id)}
                        className="rounded-full border border-white/46 bg-white/26 px-3 py-1.5 text-xs font-medium text-[#475569] backdrop-blur-2xl"
                      >
                        Copy Link
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteSpace(space)}
                        disabled={deletingSpaceId === space.id}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#64748b] transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Delete space"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
