import type { MapAbleUserRole } from "@prisma/client";

import type { UserRole } from "@/types/mapable";

export const ALL_ROLES: UserRole[] = [
  "participant",
  "family_member",
  "support_coordinator",
  "support_worker",
  "provider_admin",
  "transport_operator",
  "driver",
  "employer",
  "plan_manager",
  "ambassador",
  "mapable_admin",
];

export const AMBASSADOR_ROLES: UserRole[] = ["ambassador"];

export const ADMIN_ROLES: UserRole[] = ["mapable_admin"];

export const PARTICIPANT_FAMILY_ROLES: UserRole[] = [
  "participant",
  "family_member",
];

export const SUPPORT_ROLES: UserRole[] = [
  "support_coordinator",
  "support_worker",
  "family_member",
];

export function isAdminRole(role: UserRole | MapAbleUserRole): boolean {
  return role === "mapable_admin";
}

export function roleLabel(role: UserRole | MapAbleUserRole): string {
  const labels: Record<string, string> = {
    participant: "Participant",
    family_member: "Family member",
    support_coordinator: "Support coordinator",
    support_worker: "Support worker",
    provider_admin: "Provider admin",
    transport_operator: "Transport operator",
    driver: "Driver",
    employer: "Employer",
    plan_manager: "Plan manager",
    ambassador: "MapAble Ambassador",
    mapable_admin: "MapAble admin",
  };
  return labels[role] ?? role;
}

export function isAmbassadorRole(role: UserRole | MapAbleUserRole): boolean {
  return role === "ambassador";
}

export function defaultDashboardPath(role: UserRole | MapAbleUserRole): string {
  if (isAdminRole(role)) return "/admin";
  if (role === "provider_admin" || role === "transport_operator") {
    return "/provider";
  }
  if (isAmbassadorRole(role)) return "/ambassador";
  return "/dashboard";
}
