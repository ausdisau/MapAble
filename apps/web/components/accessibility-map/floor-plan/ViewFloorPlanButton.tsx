"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useVenueFloorPlanSummaries } from "@/hooks/useVenueFloorPlans";
import { demoVenueHasFloorPlan } from "@/lib/demo/floor-plan-fixture";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

const FloorPlanViewer = dynamic(
  () =>
    import("@/components/accessibility-map/floor-plan/FloorPlanViewer").then(
      (m) => m.FloorPlanViewer,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="p-8 text-center text-sm text-slate-600" role="status">
        Loading floor plan viewer…
      </div>
    ),
  },
);

type ViewFloorPlanButtonProps = {
  venueId: string;
  venueName: string;
  venueSlug?: string;
  className?: string;
  variant?: "primary" | "secondary";
};

export function ViewFloorPlanButton({
  venueId,
  venueName,
  venueSlug,
  className = "",
  variant = "secondary",
}: ViewFloorPlanButtonProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dialogId = useId();
  const { data, isLoading } = useVenueFloorPlanSummaries(venueId);

  const hasFloorPlan = demoVenueHasFloorPlan(venueId) || data?.hasFloorPlan;

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

  if (isLoading && !demoVenueHasFloorPlan(venueId)) {
    return (
      <span className="text-xs text-slate-500" aria-live="polite">
        Checking floor plan…
      </span>
    );
  }

  if (!hasFloorPlan) {
    return (
      <span className="text-xs text-slate-500" title="No published floor plan">
        Floor plan not currently available
      </span>
    );
  }

  const baseClass =
    variant === "primary"
      ? "bg-[#005B7F] text-white"
      : "border border-slate-300 bg-white text-[#0C1833]";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-black ${baseClass} ${mapableCareFocusRing} ${className}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
      >
        View floor plan
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/40 sm:items-center sm:justify-center sm:p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div
            ref={dialogRef}
            id={dialogId}
            className="flex h-full w-full flex-col overflow-y-auto bg-white sm:h-auto sm:max-h-[95vh] sm:max-w-6xl sm:rounded-2xl sm:shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label={`Floor plan for ${venueName}`}
          >
            <div className="p-4 sm:p-6">
              <FloorPlanViewer
                venueId={venueId}
                venueName={venueName}
                venueSlug={venueSlug}
                onClose={handleClose}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
