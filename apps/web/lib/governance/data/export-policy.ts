import type { MapAbleUserRole } from "@prisma/client";

const EXPORT_ROLES: MapAbleUserRole[] = ["mapable_admin", "plan_manager"];

export function canExportSensitiveData(role: MapAbleUserRole): boolean {
  return EXPORT_ROLES.includes(role);
}

export function requiresExportPurpose(role: MapAbleUserRole): boolean {
  return role === "plan_manager" || role === "participant";
}

export const BLOCKED_EXPORT_FIELDS = [
  "passwordHash",
  "clinicalNotes",
  "incidentNarrative",
  "safeguardingDetails",
  "privateMessages",
  "ndisPlanDocument",
  "exactHomeAddress",
] as const;
