"use client";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  editLink: string | null;
  viewLink: string | null;
  snapshotLink: string | null;
}

function ShareRow({ label, value }: { label: string; value: string | null }): JSX.Element {
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="break-all rounded bg-slate-50 px-2 py-1 text-xs text-slate-700">{value ?? "Generating..."}</p>
    </div>
  );
}

export function ShareModal({ isOpen, onClose, editLink, viewLink, snapshotLink }: ShareModalProps): JSX.Element | null {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/35 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Share Space</h2>
          <button type="button" onClick={onClose} className="rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-600">
            Close
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <ShareRow label="Live Edit" value={editLink} />
          <ShareRow label="View Only" value={viewLink} />
          <ShareRow label="Snapshot" value={snapshotLink} />
        </div>
      </div>
    </div>
  );
}

