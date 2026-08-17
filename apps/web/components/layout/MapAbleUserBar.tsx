"use client";

import { MapAbleSignOutButton } from "@/components/layout/MapAbleSignOutButton";
import { RoleBadge } from "@/components/ui/role-badge";
import type { UserRole } from "@/types/mapable";

export function MapAbleUserBar({
  userName,
  role,
}: {
  userName?: string;
  role?: UserRole;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {userName ? (
        <span className="hidden text-sm font-bold text-slate-600 sm:inline">{userName}</span>
      ) : null}
      {role ? <RoleBadge role={role} /> : null}
      <MapAbleSignOutButton />
    </div>
  );
}
