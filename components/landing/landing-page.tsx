"use client";

import Link from "next/link";

import { PolyformLogoBadge } from "@/components/brand/polyform-logo";

const featurePills = [
  "Realtime sync",
  "80+ languages",
  "Shareable spaces",
  "Mind maps + docs",
  "No auth for demo",
];

const previewCards = [
  { language: "English", text: "Plan Q3 launch with regional teams." },
  { language: "Japanese", text: "??????Q3?????????????" },
  { language: "Portuguese", text: "Planeje o lancamento do Q3 com times globais." },
];

export function LandingPage(): JSX.Element {
  return (
    <main className="min-h-screen px-6 pb-24 pt-6 md:px-10">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-2xl border border-[var(--border)] bg-white/80 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <PolyformLogoBadge className="h-9 w-9 rounded-xl" markClassName="h-6 w-6 text-[#2f3338]" title="Polyform logo" />
          <span className="text-lg font-semibold">Polyform</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
          <span>Product</span>
          <span>Architecture</span>
          <span>Demo</span>
        </nav>
        <Link href="/app" className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Open App
        </Link>
      </header>

      <section className="mx-auto mt-16 flex max-w-6xl flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="mb-6 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            Built on lingo.dev for instant multilingual collaboration
          </p>
          <h1 className="text-5xl font-black leading-tight tracking-tight text-slate-900 md:text-7xl">
            One workspace.
            <br />
            Every language.
            <br />
            Zero barriers.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-600">
            Build shared docs together while every collaborator reads and edits in their native language.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/app" className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
              Start Building
            </Link>
            <a href="#features" className="rounded-xl border border-[var(--border)] bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Explore Flow
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {featurePills.map((pill) => (
              <span key={pill} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                {pill}
              </span>
            ))}
          </div>
        </div>

        <div className="grid w-full max-w-xl gap-4">
          {previewCards.map((card) => (
            <article key={card.language} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.language}</p>
              <p className="mt-2 text-sm text-slate-800">{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto mt-20 grid max-w-6xl gap-6 md:grid-cols-3">
        {[
          ["Source is Canon", "Source document content is canonical. Translations are always derived outputs."],
          ["Live Presence", "See who is active, where they are on canvas, and which language they are working in."],
          ["Batched Translation", "Changes debounce and translate in batched calls for all active room languages."],
        ].map(([title, body]) => (
          <article key={title} className="rounded-2xl border border-[var(--border)] bg-white p-6">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
          </article>
        ))}
      </section>

      <footer className="mx-auto mt-20 flex w-full max-w-6xl items-center justify-between rounded-2xl border border-[var(--border)] bg-white/80 px-5 py-4 text-sm text-slate-600">
        <div className="flex items-center gap-3">
          <PolyformLogoBadge className="h-8 w-8 rounded-lg" markClassName="h-5 w-5 text-[#2f3338]" title="Polyform logo" />
          <span className="font-medium text-slate-800">Polyform</span>
        </div>
        <span>Language should be infrastructure, not a barrier.</span>
      </footer>
    </main>
  );
}

