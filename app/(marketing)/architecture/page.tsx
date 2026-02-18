import Link from "next/link";

import { PolyformLogoBadge } from "@/components/brand/polyform-logo";

export default function ArchitecturePage(): JSX.Element {
  return (
    <main className="min-h-screen bg-[#f3eee6] px-6 py-8 md:px-10">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-[28px] bg-white/75 px-6 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <PolyformLogoBadge className="h-9 w-9 rounded-xl bg-white/90" markClassName="h-6 w-6 text-[#2f3338]" />
          <span className="text-lg font-semibold text-slate-900">Polyform Architecture</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Back Home
          </Link>
          <Link href="/app" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Open App
          </Link>
        </div>
      </header>

      <section className="mx-auto mt-10 w-full max-w-6xl rounded-[28px] bg-white/78 p-8 shadow-[0_20px_44px_rgba(0,0,0,0.08)] backdrop-blur-xl md:p-10">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-6xl">How the system works</h1>
        <p className="mt-5 max-w-4xl text-base leading-8 text-slate-700">
          Polyform uses a source-first model: editing happens on canonical source content, while translated views are generated and synchronized in real time. This keeps collaboration consistent even across many active languages.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-900">Realtime transport</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Supabase broadcast channels deliver document patches, presence events, and translation updates between clients with low latency. Everyone sees the same shared source move instantly.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-900">Source + translation split</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              The source text is persisted and versioned. Translations are keyed by language and version so stale results are ignored and fresh output renders immediately when available.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto mt-8 w-full max-w-6xl rounded-[28px] bg-[#0b1220] p-8 text-white shadow-[0_20px_44px_rgba(0,0,0,0.2)] md:p-10">
        <h2 className="text-2xl font-bold md:text-3xl">lingo.dev integration (core path)</h2>
        <div className="mt-6 space-y-4 text-sm leading-7 text-slate-200 md:text-base">
          <p>1. User edits source text in the shared document.</p>
          <p>2. Client debounces updates and sends changed text units to <code className="rounded bg-white/10 px-1 py-0.5">/api/translate</code>.</p>
          <p>3. Server calls lingo.dev with source locale plus all active target locales.</p>
          <p>4. Results are mapped by language and translation version.</p>
          <p>5. Translation payloads are broadcast to collaborators and rendered in each viewer language.</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-white/20 bg-white/10 p-5">
            <h3 className="text-lg font-semibold text-sky-200">Content translation API</h3>
            <p className="mt-2 text-sm leading-6 text-slate-100">
              Uses lingo.dev string-array localization for document units. This enables consistent batch translation and predictable index mapping back into source structure.
            </p>
          </article>
          <article className="rounded-2xl border border-white/20 bg-white/10 p-5">
            <h3 className="text-lg font-semibold text-sky-200">UI localization API</h3>
            <p className="mt-2 text-sm leading-6 text-slate-100">
              Uses lingo.dev object localization via <code className="rounded bg-white/15 px-1 py-0.5">/api/ui-localize</code> so nav, labels, CTAs, and helper text switch language instantly across the landing and workspace.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}

