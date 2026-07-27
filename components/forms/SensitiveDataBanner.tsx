"use client";

import { CircleHelp } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/app/lib/utils";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type SensitiveDataBannerProps = {
  className?: string;
  id?: string;
};

const SENSITIVE_DATA_TITLE =
  "Do not paste sensitive health or NDIS plan details";

const SENSITIVE_DATA_BODY =
  "Avoid unencrypted NDIS plan documents, diagnoses, clinical notes, or full participant identifiers in generic message fields. MapAble will invite you through a secure, consent-controlled pathway when those records are needed.";

/**
 * Compact form tooltip warning against pasting NDIS plans / clinical records
 * into open forms. Content stays in the accessibility tree for aria-describedby.
 */
export function SensitiveDataBanner({ className, id }: SensitiveDataBannerProps) {
  const [open, setOpen] = useState(false);
  const autoId = useId();
  const tipId = id ?? `sensitive-data-tip-${autoId}`;
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        className={cn(
          "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-950 transition hover:bg-amber-100",
          mapableCareFocusRing,
        )}
        aria-expanded={open}
        aria-controls={tipId}
        onClick={() => setOpen((value) => !value)}
      >
        <CircleHelp className="h-4 w-4 shrink-0" aria-hidden="true" />
        Privacy tip
      </button>
      <div
        id={tipId}
        role="tooltip"
        className={cn(
          "z-20 w-[min(100vw-2.5rem,24rem)] rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 shadow-sm",
          open
            ? "absolute left-0 top-full mt-2"
            : "sr-only",
        )}
      >
        <p className="font-black">{SENSITIVE_DATA_TITLE}</p>
        <p className="mt-1">{SENSITIVE_DATA_BODY}</p>
      </div>
    </div>
  );
}
