"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";

export function AdminConfirmDialog({
  title,
  summary,
  confirmLabel = "Confirm action",
  onConfirm,
  triggerLabel,
  disabled,
}: {
  title: string;
  summary: string;
  confirmLabel?: string;
  onConfirm: (auditNote: string) => void | Promise<void>;
  triggerLabel: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const noteId = useId();

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm(note);
      setOpen(false);
      setNote("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="default"
        size="default"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-confirm-title"
        >
          <div className="max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <h2 id="admin-confirm-title" className="text-lg font-semibold">
              {title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{summary}</p>
            <label htmlFor={noteId} className="mt-4 block text-sm font-medium">
              Audit note (optional)
            </label>
            <textarea
              id={noteId}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                size="default"
                onClick={handleConfirm}
                disabled={busy}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
