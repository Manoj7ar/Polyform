"use client";

import Link from "next/link";
import Script from "next/script";
import { createElement, useEffect, useState } from "react";

import { PolyformLogoBadge } from "@/components/brand/polyform-logo";
import { SUPPORTED_LANGUAGES } from "@/lib/defaults";

interface LandingCopy {
  navProduct: string;
  navArchitecture: string;
  navDemo: string;
  openApp: string;
  headingLine1: string;
  headingLine2: string;
  headingLine3: string;
  subtitle: string;
  startBuilding: string;
  openSource: string;
  whyTitle: string;
  whyCard1Title: string;
  whyCard1Body: string;
  whyCard2Title: string;
  whyCard2Body: string;
  whyCard3Title: string;
  whyCard3Body: string;
  lingoTitle: string;
  lingoBody: string;
  lingoPill1: string;
  lingoPill2: string;
  lingoPill3: string;
  lingoPill4: string;
  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;
  footerTagline: string;
}

const DEFAULT_LANDING_COPY: LandingCopy = {
  navProduct: "Product",
  navArchitecture: "Architecture",
  navDemo: "Demo",
  openApp: "Open App",
  headingLine1: "One workspace.",
  headingLine2: "Every language.",
  headingLine3: "Zero barriers.",
  subtitle: "Build shared docs together while every collaborator reads and edits in their native language.",
  startBuilding: "Start Building",
  openSource: "Open Source",
  whyTitle: "Why teams switch to Polyform",
  whyCard1Title: "Native-language collaboration",
  whyCard1Body: "Each collaborator reads and writes in their own language while staying in one shared workspace.",
  whyCard2Title: "Source stays canonical",
  whyCard2Body: "Translations are derived from the source document version, preventing drift and conflicting edits.",
  whyCard3Title: "Instant share links",
  whyCard3Body: "Create a space, share a link, and collaborate live with presence and multilingual rendering.",
  lingoTitle: "Built to showcase lingo.dev in production workflow",
  lingoBody:
    "Polyform relies on lingo.dev for both content translation and full interface localization. It translates document units in batch, returns language-specific outputs quickly, and keeps multi-language collaboration dependable under live edits.",
  lingoPill1: "Batched translation calls",
  lingoPill2: "UI localization endpoint",
  lingoPill3: "Source-first translation model",
  lingoPill4: "Realtime multilingual rendering",
  ctaTitle: "Ready to test multilingual collaboration live?",
  ctaBody: "Open the app, share a space, and watch edits sync across languages in real time.",
  ctaButton: "Launch Workspace",
  footerTagline: "Language should be infrastructure, not a barrier.",
};

function detectLandingLanguage(): string {
  if (typeof window === "undefined") return "en";
  const locale = navigator.language.slice(0, 2).toLowerCase();
  return SUPPORTED_LANGUAGES.some((lang) => lang.code === locale) ? locale : "en";
}

function readLocalizedText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function resolveLandingCopy(candidate: unknown): LandingCopy {
  const value = candidate && typeof candidate === "object" ? (candidate as Record<string, unknown>) : {};
  return {
    navProduct: readLocalizedText(value.navProduct, DEFAULT_LANDING_COPY.navProduct),
    navArchitecture: readLocalizedText(value.navArchitecture, DEFAULT_LANDING_COPY.navArchitecture),
    navDemo: readLocalizedText(value.navDemo, DEFAULT_LANDING_COPY.navDemo),
    openApp: readLocalizedText(value.openApp, DEFAULT_LANDING_COPY.openApp),
    headingLine1: readLocalizedText(value.headingLine1, DEFAULT_LANDING_COPY.headingLine1),
    headingLine2: readLocalizedText(value.headingLine2, DEFAULT_LANDING_COPY.headingLine2),
    headingLine3: readLocalizedText(value.headingLine3, DEFAULT_LANDING_COPY.headingLine3),
    subtitle: readLocalizedText(value.subtitle, DEFAULT_LANDING_COPY.subtitle),
    startBuilding: readLocalizedText(value.startBuilding, DEFAULT_LANDING_COPY.startBuilding),
    openSource: readLocalizedText(value.openSource, DEFAULT_LANDING_COPY.openSource),
    whyTitle: readLocalizedText(value.whyTitle, DEFAULT_LANDING_COPY.whyTitle),
    whyCard1Title: readLocalizedText(value.whyCard1Title, DEFAULT_LANDING_COPY.whyCard1Title),
    whyCard1Body: readLocalizedText(value.whyCard1Body, DEFAULT_LANDING_COPY.whyCard1Body),
    whyCard2Title: readLocalizedText(value.whyCard2Title, DEFAULT_LANDING_COPY.whyCard2Title),
    whyCard2Body: readLocalizedText(value.whyCard2Body, DEFAULT_LANDING_COPY.whyCard2Body),
    whyCard3Title: readLocalizedText(value.whyCard3Title, DEFAULT_LANDING_COPY.whyCard3Title),
    whyCard3Body: readLocalizedText(value.whyCard3Body, DEFAULT_LANDING_COPY.whyCard3Body),
    lingoTitle: readLocalizedText(value.lingoTitle, DEFAULT_LANDING_COPY.lingoTitle),
    lingoBody: readLocalizedText(value.lingoBody, DEFAULT_LANDING_COPY.lingoBody),
    lingoPill1: readLocalizedText(value.lingoPill1, DEFAULT_LANDING_COPY.lingoPill1),
    lingoPill2: readLocalizedText(value.lingoPill2, DEFAULT_LANDING_COPY.lingoPill2),
    lingoPill3: readLocalizedText(value.lingoPill3, DEFAULT_LANDING_COPY.lingoPill3),
    lingoPill4: readLocalizedText(value.lingoPill4, DEFAULT_LANDING_COPY.lingoPill4),
    ctaTitle: readLocalizedText(value.ctaTitle, DEFAULT_LANDING_COPY.ctaTitle),
    ctaBody: readLocalizedText(value.ctaBody, DEFAULT_LANDING_COPY.ctaBody),
    ctaButton: readLocalizedText(value.ctaButton, DEFAULT_LANDING_COPY.ctaButton),
    footerTagline: readLocalizedText(value.footerTagline, DEFAULT_LANDING_COPY.footerTagline),
  };
}

export function LandingPage(): JSX.Element {
  const [language, setLanguage] = useState("en");
  const [copyByLanguage, setCopyByLanguage] = useState<Record<string, LandingCopy>>({ en: DEFAULT_LANDING_COPY });
  const copy = copyByLanguage[language] ?? DEFAULT_LANDING_COPY;
  const whyCards = [
    { title: copy.whyCard1Title, body: copy.whyCard1Body },
    { title: copy.whyCard2Title, body: copy.whyCard2Body },
    { title: copy.whyCard3Title, body: copy.whyCard3Body },
  ];
  const lingoPills = [copy.lingoPill1, copy.lingoPill2, copy.lingoPill3, copy.lingoPill4];
  const glassPanelClass =
    "rounded-[28px] border border-white/60 bg-white/30 shadow-[0_20px_48px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-2xl";
  const glassTileClass =
    "rounded-2xl border border-white/60 bg-white/38 shadow-[0_12px_28px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-xl";

  useEffect(() => {
    const fromStorage = window.localStorage.getItem("polyform-landing-language");
    const resolved =
      fromStorage && SUPPORTED_LANGUAGES.some((lang) => lang.code === fromStorage) ? fromStorage : detectLandingLanguage();
    setLanguage(resolved);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("polyform-landing-language", language);
    if (language === "en" || copyByLanguage[language]) return;

    let cancelled = false;
    async function localizeLanding(): Promise<void> {
      try {
        const response = await fetch("/api/ui-localize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetLang: language,
            texts: DEFAULT_LANDING_COPY,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Failed to localize landing page");
        if (cancelled) return;
        setCopyByLanguage((current) => ({ ...current, [language]: resolveLandingCopy(data.texts) }));
      } catch {
        if (cancelled) return;
        setCopyByLanguage((current) => ({ ...current, [language]: DEFAULT_LANDING_COPY }));
      }
    }

    void localizeLanding();
    return () => {
      cancelled = true;
    };
  }, [copyByLanguage, language]);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#d9dde2] px-4 pb-16 pt-4 text-slate-900 md:px-8">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background: [
              "radial-gradient(48% 42% at 18% 18%, rgba(255,255,255,0.7), rgba(255,255,255,0) 70%)",
              "radial-gradient(40% 34% at 85% 14%, rgba(184, 197, 214, 0.45), rgba(184, 197, 214, 0) 72%)",
              "radial-gradient(52% 44% at 80% 78%, rgba(148, 163, 184, 0.35), rgba(148, 163, 184, 0) 74%)",
              "radial-gradient(36% 30% at 24% 78%, rgba(226, 232, 240, 0.8), rgba(226, 232, 240, 0) 78%)",
              "linear-gradient(180deg, #e6e9ee 0%, #d7dce3 52%, #d1d7df 100%)",
            ].join(","),
          }}
        />
        <div className="absolute left-[-8rem] top-16 h-72 w-72 rounded-full bg-white/45 blur-3xl" />
        <div className="absolute right-[-7rem] top-40 h-80 w-80 rounded-full bg-slate-300/35 blur-3xl" />
        <div className="absolute bottom-12 left-1/3 h-72 w-72 rounded-full bg-slate-100/55 blur-3xl" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: [
              "linear-gradient(rgba(255,255,255,0.22) 1px, transparent 1px)",
              "linear-gradient(90deg, rgba(255,255,255,0.22) 1px, transparent 1px)",
            ].join(","),
            backgroundSize: "42px 42px, 42px 42px",
          }}
        />
        <div
          className="absolute inset-0 mix-blend-overlay opacity-[0.08]"
          style={{
            backgroundImage: [
              "radial-gradient(circle, rgba(15,23,42,0.85) 0.7px, transparent 0.9px)",
              "radial-gradient(circle, rgba(255,255,255,0.95) 0.6px, transparent 0.8px)",
              "radial-gradient(circle, rgba(100,116,139,0.6) 0.5px, transparent 0.7px)",
            ].join(","),
            backgroundPosition: "0 0, 1.5px 1.5px, 3px 2px",
            backgroundSize: "4px 4px, 5px 5px, 6px 6px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_48%,rgba(15,23,42,0.08)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl pt-20 md:pt-24">
        <header
          className={`fixed left-1/2 top-4 z-50 flex w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2 items-center justify-between rounded-[26px] px-4 py-3 text-slate-900 md:w-[calc(100%-4rem)] md:px-6 ${glassPanelClass}`}
        >
          <div className="flex items-center gap-3">
            <PolyformLogoBadge className="h-9 w-9 rounded-xl bg-white/80" markClassName="h-6 w-6 text-[#2f3338]" title="Polyform logo" />
            <div className="leading-tight">
              <span className="block text-base font-semibold tracking-tight">Polyform</span>
              <span className="hidden text-[11px] text-slate-600 md:block">Multilingual workspace</span>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-700 md:flex">
            <Link href="/product" className="rounded-full px-3 py-1.5 transition hover:bg-white/35 hover:text-slate-950">
              {copy.navProduct}
            </Link>
            <Link href="/architecture" className="rounded-full px-3 py-1.5 transition hover:bg-white/35 hover:text-slate-950">
              {copy.navArchitecture}
            </Link>
            <Link href="/demo" className="rounded-full px-3 py-1.5 transition hover:bg-white/35 hover:text-slate-950">
              {copy.navDemo}
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="rounded-full border border-white/70 bg-white/60 px-3 py-2 text-xs font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] outline-none backdrop-blur-xl"
              aria-label="Select language"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
            <Link
              href="/app"
              className="rounded-xl border border-white/75 bg-white/65 px-4 py-2 text-sm font-medium text-slate-800 shadow-[0_8px_18px_rgba(15,23,42,0.06)] backdrop-blur-xl transition hover:bg-white/80"
            >
              {copy.openApp}
            </Link>
          </div>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="space-y-6">
            <div className={`${glassPanelClass} relative overflow-hidden p-7 md:p-10`}>
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/40 to-transparent" />
              <div className="absolute -right-10 top-10 h-36 w-36 rounded-full bg-white/55 blur-3xl" />
              <div className="relative">
                <span className="inline-flex rounded-full border border-white/70 bg-white/55 px-4 py-1.5 text-xs font-medium tracking-wide text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-xl">
                  Realtime multilingual collaboration
                </span>
                <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-6xl lg:text-7xl">
                  {copy.headingLine1}
                  <br />
                  {copy.headingLine2}
                  <br />
                  {copy.headingLine3}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 md:text-lg">
                  {copy.subtitle}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/app"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-900/80 bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(15,23,42,0.22)] transition hover:bg-slate-800"
                  >
                    {copy.startBuilding}
                  </Link>
                  <a
                    href="https://github.com/manoj7ar/polyform"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-white/75 bg-white/55 px-6 py-3 text-sm font-semibold text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl transition hover:bg-white/75"
                  >
                    {copy.openSource}
                  </a>
                </div>
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className={`${glassTileClass} p-4`}>
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Language-first</p>
                    <p className="mt-2 text-sm font-semibold leading-5 text-slate-800">{copy.whyCard1Title}</p>
                  </div>
                  <div className={`${glassTileClass} p-4`}>
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Single source</p>
                    <p className="mt-2 text-sm font-semibold leading-5 text-slate-800">{copy.whyCard2Title}</p>
                  </div>
                  <div className={`${glassTileClass} p-4`}>
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Fast sharing</p>
                    <p className="mt-2 text-sm font-semibold leading-5 text-slate-800">{copy.whyCard3Title}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${glassPanelClass} p-6 md:p-7`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Interface localization</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">{copy.lingoTitle}</h2>
                </div>
                <span className="rounded-full border border-white/70 bg-white/55 px-3 py-1.5 text-xs font-medium text-slate-700 backdrop-blur-xl">
                  {SUPPORTED_LANGUAGES.length}+ UI locales
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-700 md:text-base">{copy.lingoBody}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {lingoPills.map((pill) => (
                  <span
                    key={pill}
                    className="rounded-full border border-white/65 bg-white/45 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-xl"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`${glassPanelClass} p-6 md:p-7`}>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">How it feels</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{copy.whyTitle}</h2>
              <div className="mt-5 space-y-3">
                {whyCards.map((card, index) => (
                  <article key={card.title} className={`${glassTileClass} p-4`}>
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-white/70 text-xs font-semibold text-slate-700">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{card.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{card.body}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className={`${glassPanelClass} relative overflow-hidden p-6 md:p-7`}>
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/35 to-transparent" />
              <div className="relative">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Live workflow</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Glass-first workspace preview</h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Every key piece of information is surfaced in soft translucent panels so the page feels calmer, lighter, and easier to scan.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className={`${glassTileClass} p-4`}>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Theme</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">Gray + grain</p>
                  </div>
                  <div className={`${glassTileClass} p-4`}>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Surface</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">Glass cards</p>
                  </div>
                  <div className={`${glassTileClass} p-4`}>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Density</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">Readable spacing</p>
                  </div>
                  <div className={`${glassTileClass} p-4`}>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Focus</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">Clear CTAs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`mt-6 ${glassPanelClass} p-6 md:p-8`}>
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Launch a shared space</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{copy.ctaTitle}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-700 md:text-base">{copy.ctaBody}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/65 bg-white/45 px-3 py-1.5 text-xs text-slate-700 backdrop-blur-xl">
                  Realtime edits
                </span>
                <span className="rounded-full border border-white/65 bg-white/45 px-3 py-1.5 text-xs text-slate-700 backdrop-blur-xl">
                  Shared links
                </span>
                <span className="rounded-full border border-white/65 bg-white/45 px-3 py-1.5 text-xs text-slate-700 backdrop-blur-xl">
                  Multilingual rendering
                </span>
              </div>
            </div>
            <div className="md:justify-self-end">
              <Link
                href="/app"
                className="inline-flex items-center justify-center rounded-xl border border-slate-900/80 bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(15,23,42,0.22)] transition hover:bg-slate-800"
              >
                {copy.ctaButton}
              </Link>
            </div>
          </div>
        </section>

        <footer className={`mt-8 flex flex-col items-start justify-between gap-4 px-6 py-5 text-sm text-slate-700 md:flex-row md:items-center ${glassPanelClass}`}>
          <div className="flex items-center gap-3">
            <PolyformLogoBadge className="h-8 w-8 rounded-lg bg-white/80" markClassName="h-5 w-5 text-[#2f3338]" />
            <span className="font-semibold text-slate-900">Polyform</span>
          </div>
          <span>{copy.footerTagline}</span>
        </footer>
      </div>
      <Script src="https://unpkg.com/@elevenlabs/convai-widget-embed" strategy="afterInteractive" />
      {createElement("elevenlabs-convai", {
        "agent-id": "agent_0201kj518ss9fpqstqced05xe7be",
        style: {
          position: "fixed",
          right: "0",
          bottom: "0",
          zIndex: 80,
        },
      })}
    </main>
  );
}

