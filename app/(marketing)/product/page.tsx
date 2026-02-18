import Link from "next/link";

import { PolyformLogoBadge } from "@/components/brand/polyform-logo";

export default function ProductPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-[#f3eee6] px-6 py-8 md:px-10">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-[28px] bg-white/75 px-6 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <PolyformLogoBadge className="h-9 w-9 rounded-xl bg-white/90" markClassName="h-6 w-6 text-[#2f3338]" />
          <span className="text-lg font-semibold text-slate-900">Polyform Product</span>
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
        <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-6xl">One workspace. Every language. Zero barriers.</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">
          Polyform is a real-time collaboration workspace where every person writes in their own language and still collaborates on the same shared source. Docs update live across collaborators with automatic multilingual rendering in seconds.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-900">What makes Polyform different</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Standard editors are monolingual. Polyform treats language as infrastructure, so each collaborator can think, write, and review in their native language without leaving the workflow.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-900">Built for instant global teams</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Real-time presence, shared link access, and source-first multilingual content let distributed teams move fast without translation copy-paste loops.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto mt-8 w-full max-w-6xl rounded-[28px] bg-[#0f172a] p-8 text-white shadow-[0_20px_44px_rgba(0,0,0,0.2)] md:p-10">
        <h2 className="text-2xl font-bold md:text-3xl">Hackathon Edge: lingo.dev at the core</h2>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-200 md:text-base">
          Polyform is not just translated UI. lingo.dev powers the product loop itself. We translate document units in batch, localize interface copy on demand, and preserve a canonical source so meaning stays consistent while users read and edit in different languages.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-5">
            <p className="text-xs uppercase tracking-wide text-sky-200">Realtime</p>
            <p className="mt-2 text-sm leading-6 text-slate-100">Batched lingo.dev translation calls keep updates fast and synchronized across active languages.</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-5">
            <p className="text-xs uppercase tracking-wide text-sky-200">Accurate</p>
            <p className="mt-2 text-sm leading-6 text-slate-100">Source language remains canonical; translated views are derived, preventing drift and conflict.</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-5">
            <p className="text-xs uppercase tracking-wide text-sky-200">Scalable</p>
            <p className="mt-2 text-sm leading-6 text-slate-100">UI and content localization share the same lingo.dev backbone, simplifying expansion to more languages.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

