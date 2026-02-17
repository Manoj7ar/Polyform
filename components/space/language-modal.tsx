"use client";

import { SUPPORTED_LANGUAGES } from "@/lib/defaults";

interface LanguageModalProps {
  isOpen: boolean;
  value: string;
  name: string;
  onChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onConfirm: () => void;
  copy?: {
    title: string;
    subtitle: string;
    namePlaceholder: string;
    enterSpace: string;
  };
}

export function LanguageModal({
  isOpen,
  value,
  name,
  onChange,
  onNameChange,
  onConfirm,
  copy,
}: LanguageModalProps): JSX.Element | null {
  if (!isOpen) return null;

  const text = copy ?? {
    title: "Choose your working language",
    subtitle: "You can change this anytime in the top bar.",
    namePlaceholder: "Your name",
    enterSpace: "Enter Space",
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/35 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">{text.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{text.subtitle}</p>

        <input
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder={text.namePlaceholder}
          className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none"
        />

        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onConfirm}
          className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          {text.enterSpace}
        </button>
      </div>
    </div>
  );
}

