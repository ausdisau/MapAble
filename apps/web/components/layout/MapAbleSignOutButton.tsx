"use client";

import { signOut } from "next-auth/react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

/**
 * Clear user-specific client keys that must not survive sign-out, then end
 * the NextAuth session. Navigation chrome still uses session as display-only —
 * route guards remain authoritative.
 */
function clearClientAccountArtifacts(): void {
  if (typeof window === "undefined") return;
  try {
    const keys = Object.keys(window.localStorage);
    for (const key of keys) {
      if (
        key.startsWith("mapable.") ||
        key.startsWith("mapable:") ||
        key.startsWith("MapAble")
      ) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // Storage may be unavailable (private mode / policy); sign-out still proceeds.
  }
}

export function MapAbleSignOutButton({
  callbackUrl = "/",
}: {
  callbackUrl?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        clearClientAccountArtifacts();
        void signOut({ callbackUrl });
      }}
      className={`inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-slate-200 px-4 py-2 text-sm font-black text-[#0C1833] transition hover:bg-white ${mapableCareFocusRing}`}
    >
      Sign out
    </button>
  );
}
