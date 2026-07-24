"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { useFocusTrap } from "@/hooks/useFocusTrap";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function ReportPlaceIssueButton({ placeId }: { placeId: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dialogId = useId();

  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch(`/api/access/places/${placeId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: fd.get("reason"),
        details: fd.get("details"),
      }),
    });
    setDone(true);
    handleClose();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`min-h-11 rounded-lg border border-border px-4 text-sm ${mapableInteractiveFocusRing}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
      >
        Report inaccurate information
      </button>
      {done ? (
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
          Thank you — your report was received.
        </p>
      ) : null}
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div
            ref={dialogRef}
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
            className="w-full max-w-md rounded-lg bg-background p-4 shadow-lg"
          >
            <form onSubmit={submit}>
              <h2 id="report-title" className="text-lg font-semibold">
                Report issue
              </h2>
              <label className="mt-3 block">
                <span className="text-sm">Reason</span>
                <select
                  name="reason"
                  required
                  className={`mt-1 min-h-11 w-full rounded-lg border px-2 ${mapableInteractiveFocusRing}`}
                >
                  <option value="inaccurate_access_information">
                    Inaccurate access information
                  </option>
                  <option value="closed_or_moved_place">Closed or moved</option>
                  <option value="duplicate_place">Duplicate</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="mt-3 block">
                <span className="text-sm">Details</span>
                <textarea
                  name="details"
                  rows={3}
                  className={`mt-1 w-full rounded-lg border px-2 ${mapableInteractiveFocusRing}`}
                />
              </label>
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  className={`min-h-11 flex-1 rounded-lg bg-primary text-primary-foreground ${mapableInteractiveFocusRing}`}
                >
                  Submit
                </button>
                <button
                  type="button"
                  className={`min-h-11 rounded-lg border px-4 ${mapableInteractiveFocusRing}`}
                  onClick={handleClose}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
