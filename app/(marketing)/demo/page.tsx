import Link from "next/link";

import { PolyformLogoBadge } from "@/components/brand/polyform-logo";

export default function DemoPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-[#f3eee6] px-6 py-8 md:px-10">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-[28px] bg-white/75 px-6 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <PolyformLogoBadge className="h-9 w-9 rounded-xl bg-white/90" markClassName="h-6 w-6 text-[#2f3338]" />
          <span className="text-lg font-semibold text-slate-900">Polyform Demo</span>
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
        <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-6xl">Live demo flow</h1>
        <p className="mt-5 max-w-4xl text-base leading-8 text-slate-700">
          This page is a staging surface for the final scripted demo. It is already linked from the landing nav and can be expanded with screen recordings, GIF loops, and scorecard metrics.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 1</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">Open two screens</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">Set different languages in each screen using the top selector.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 2</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">Type once</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">Source updates broadcast in realtime, then lingo.dev translations render per viewer language.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step 3</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">Show the wow moment</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">Cursor presence, live edits, and multilingual output stay synchronized in one shared space.</p>
          </article>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
          Demo upgrades can be added here next: embedded recordings, benchmark timings, translation latency chart, and hackathon comparison matrix.
        </div>
      </section>
    </main>
  );
}

