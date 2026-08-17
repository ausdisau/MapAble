"use client";

import { signOut } from "next-auth/react";

export function MapAbleSignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-xl border-2 border-slate-200 px-4 py-2 text-sm font-black text-[#0C1833] transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
    >
      Sign out
    </button>
  );
}
