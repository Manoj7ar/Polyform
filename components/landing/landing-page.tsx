"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
    <main className="relative min-h-screen overflow-x-hidden bg-[#ead8c6] px-6 pb-16 pt-6 md:px-10">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background: [
              "radial-gradient(55% 55% at 45% 36%, rgba(255, 112, 45, 0.92), rgba(255, 112, 45, 0) 70%)",
              "radial-gradient(42% 42% at 30% 78%, rgba(18, 86, 198, 0.92), rgba(18, 86, 198, 0) 72%)",
              "radial-gradient(35% 35% at 44% 58%, rgba(255, 70, 35, 0.5), rgba(255, 70, 35, 0) 76%)",
              "linear-gradient(90deg, rgba(124, 177, 155, 0.55) 0%, rgba(124, 177, 155, 0) 10%)",
              "linear-gradient(180deg, #e7d4bf 0%, #ecd8c3 100%)",
            ].join(","),
          }}
        />

        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <g stroke="#101010" strokeWidth="0.12" fill="none" opacity="0.95">
            <line x1="5.5" y1="0" x2="5.5" y2="100" />
            <line x1="96.4" y1="0" x2="96.4" y2="100" />
            <path d="M27.5 0 C27.5 26, 27.5 45, 0 56" />
            <path d="M64 0 C64 30, 64 52, 96.4 56" />
            <path d="M100 38 C82 38, 83 60, 76 67" />
            <line x1="84.3" y1="67" x2="84.3" y2="100" />
          </g>

          <g fill="#101010" opacity="0.95">
            <circle cx="26.8" cy="9.6" r="1.1" />
            <circle cx="5.5" cy="38" r="0.9" />
            <circle cx="84.3" cy="67.2" r="1.1" />
            <circle cx="96.4" cy="26.7" r="0.9" />
          </g>

          <g fill="#101010">
            {Array.from({ length: 8 }).map((_, row) =>
              Array.from({ length: 8 }).map((__, col) => (
                <circle key={`${row}-${col}`} cx={75 + col * 2.35} cy={6 + row * 2.35} r="0.23" />
              )),
            )}
          </g>

          <g stroke="#f9f9f9" strokeWidth="0.2">
            <line x1="31.3" y1="23.2" x2="31.3" y2="28.2" />
            <line x1="28.8" y1="25.7" x2="33.8" y2="25.7" />
            <line x1="88.5" y1="58.4" x2="88.5" y2="63.4" />
            <line x1="86" y1="60.9" x2="91" y2="60.9" />
          </g>

          <g stroke="#ffffff" strokeWidth="0.15" strokeLinecap="round" opacity="0.85">
            {Array.from({ length: 10 }).map((_, i) => {
              const start = 8 + i * 1.25;
              return <line key={start} x1={start} y1="89.2" x2={start + 0.75} y2="86.8" />;
            })}
          </g>

          <g stroke="#111" strokeWidth="0.15" opacity="0.9">
            <line x1="20.5" y1="17" x2="20.5" y2="19.6" />
            <line x1="19.2" y1="18.3" x2="21.8" y2="18.3" />
            <line x1="82" y1="59.2" x2="82" y2="61.8" />
            <line x1="80.7" y1="60.5" x2="83.3" y2="60.5" />
          </g>

          <g stroke="#050505" strokeWidth="0.18" opacity="0.95" transform="translate(14.6,67.5) scale(0.58)">
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * Math.PI * 2) / 24;
              const x2 = Math.cos(angle) * 6.5;
              const y2 = Math.sin(angle) * 6.5;
              return <line key={i} x1="0" y1="0" x2={x2} y2={y2} />;
            })}
            <circle cx="0" cy="0" r="1.5" fill="#050505" />
          </g>
        </svg>
      </div>

      <div className="relative z-10 pt-24">
      <header className="fixed left-1/2 top-4 z-50 flex w-[calc(100%-3rem)] max-w-6xl -translate-x-1/2 items-center justify-between rounded-[32px] bg-white/26 px-6 py-3 text-slate-900 shadow-[0_18px_40px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-2xl md:w-[calc(100%-5rem)]">
        <div className="flex items-center gap-3">
          <PolyformLogoBadge className="h-9 w-9 rounded-xl bg-white/85" markClassName="h-6 w-6 text-[#2f3338]" title="Polyform logo" />
          <span className="text-lg font-semibold">Polyform</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-slate-700 md:flex">
          <Link href="/product" className="transition hover:text-slate-900">
            {copy.navProduct}
          </Link>
          <Link href="/architecture" className="transition hover:text-slate-900">
            {copy.navArchitecture}
          </Link>
          <Link href="/demo" className="transition hover:text-slate-900">
            {copy.navDemo}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 outline-none"
            aria-label="Select language"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
          <Link href="/app" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 backdrop-blur hover:bg-slate-50">
            {copy.openApp}
          </Link>
        </div>
      </header>

      <section className="mx-auto mt-16 flex max-w-6xl flex-col items-start gap-10">
        <div className="max-w-2xl">
          <div className="md:translate-x-60 md:translate-y-10">
            <h1 className="text-5xl font-black leading-tight tracking-tight text-slate-900 md:text-7xl">
              {copy.headingLine1}
              <br />
              {copy.headingLine2}
              <br />
              {copy.headingLine3}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-700">
              {copy.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/app" className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
                {copy.startBuilding}
              </Link>
              <a
                href="https://github.com/manoj7ar/polyform"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-[var(--border)] bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {copy.openSource}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-36 max-w-6xl">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">{copy.whyTitle}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-white/50 bg-white/65 p-6 shadow-[0_14px_28px_rgba(0,0,0,0.08)] backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-slate-900">{copy.whyCard1Title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">{copy.whyCard1Body}</p>
          </article>
          <article className="rounded-3xl border border-white/50 bg-white/65 p-6 shadow-[0_14px_28px_rgba(0,0,0,0.08)] backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-slate-900">{copy.whyCard2Title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">{copy.whyCard2Body}</p>
          </article>
          <article className="rounded-3xl border border-white/50 bg-white/65 p-6 shadow-[0_14px_28px_rgba(0,0,0,0.08)] backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-slate-900">{copy.whyCard3Title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">{copy.whyCard3Body}</p>
          </article>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-6xl rounded-[32px] bg-[#111827]/90 p-8 shadow-[0_24px_48px_rgba(0,0,0,0.28)] md:p-10">
        <h2 className="text-2xl font-bold text-white md:text-3xl">{copy.lingoTitle}</h2>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-200 md:text-base">{copy.lingoBody}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs text-sky-100">{copy.lingoPill1}</span>
          <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs text-sky-100">{copy.lingoPill2}</span>
          <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs text-sky-100">{copy.lingoPill3}</span>
          <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs text-sky-100">{copy.lingoPill4}</span>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-6xl rounded-[32px] bg-white/58 p-8 shadow-[0_14px_30px_rgba(0,0,0,0.1)] backdrop-blur-xl md:p-10">
        <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{copy.ctaTitle}</h2>
        <p className="mt-4 text-sm leading-7 text-slate-700 md:text-base">{copy.ctaBody}</p>
        <div className="mt-6">
          <Link href="/app" className="inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
            {copy.ctaButton}
          </Link>
        </div>
      </section>

      <footer className="mx-auto mt-12 flex max-w-6xl flex-col items-start justify-between gap-4 rounded-[28px] border border-white/45 bg-white/45 px-6 py-5 text-sm text-slate-700 shadow-[0_12px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <PolyformLogoBadge className="h-8 w-8 rounded-lg bg-white/85" markClassName="h-5 w-5 text-[#2f3338]" />
          <span className="font-semibold text-slate-900">Polyform</span>
        </div>
        <span>{copy.footerTagline}</span>
      </footer>
      </div>
    </main>
  );
}

