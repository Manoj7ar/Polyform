"use client";

import { useState } from "react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  editLink: string | null;
  viewLink: string | null;
  snapshotLink: string | null;
  copy?: {
    title: string;
    close: string;
    liveEdit: string;
    viewOnly: string;
    snapshot: string;
    generating: string;
  };
}

function ShareRow({ label, value, generating }: { label: string; value: string | null; generating: string }): JSX.Element {
  const [copied, setCopied] = useState(false);

  async function handleCopy(): Promise<void> {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="break-all rounded bg-slate-50 px-2 py-1 text-xs text-slate-700">{value ?? generating}</p>
      <button
        type="button"
        onClick={() => void handleCopy()}
        disabled={!value}
        aria-label={`Copy ${label} link`}
        className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export function ShareModal({ isOpen, onClose, editLink, viewLink, snapshotLink, copy }: ShareModalProps): JSX.Element | null {
  if (!isOpen) return null;

  const text = copy ?? {
    title: "Share Space",
    close: "Close",
    liveEdit: "Live Edit",
    viewOnly: "View Only",
    snapshot: "Snapshot",
    generating: "Generating...",
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/35 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{text.title}</h2>
          <button type="button" onClick={onClose} className="rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-600">
            {text.close}
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <ShareRow label={text.liveEdit} value={editLink} generating={text.generating} />
          <ShareRow label={text.viewOnly} value={viewLink} generating={text.generating} />
          <ShareRow label={text.snapshot} value={snapshotLink} generating={text.generating} />
        </div>
      </div>
    </div>
  );
}
