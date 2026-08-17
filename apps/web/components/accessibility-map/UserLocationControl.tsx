"use client";

import { Locate, LocateFixed, Loader2 } from "lucide-react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type UserLocationControlProps = {
  onRequest: () => void;
  isLoading: boolean;
  hasLocation: boolean;
  disabled?: boolean;
};

export function UserLocationControl({
  onRequest,
  isLoading,
  hasLocation,
  disabled = false,
}: UserLocationControlProps) {
  return (
    <button
      type="button"
      className={`access-map-control flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#005B7F] shadow-sm transition hover:bg-[#F6FBFC] disabled:cursor-not-allowed disabled:opacity-50 ${mapableCareFocusRing}`}
      onClick={onRequest}
      disabled={disabled || isLoading}
      aria-label={
        isLoading
          ? "Finding your approximate location"
          : hasLocation
            ? "Update my approximate location"
            : "Use my approximate location"
      }
      title="Use my approximate location"
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      ) : hasLocation ? (
        <LocateFixed className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Locate className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
