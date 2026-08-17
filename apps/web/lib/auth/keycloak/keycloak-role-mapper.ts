import type { MapAbleUserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const PRIVILEGED_ROLES: MapAbleUserRole[] = [
  "provider_admin",
  "support_worker",
  "driver",
  "plan_manager",
  "mapable_admin",
];

export async function suggestRoleFromKeycloakGroup(
  externalGroup: string
): Promise<{ suggestedRole: string; requiresApproval: boolean } | null> {
  const mapping = await prisma.externalRoleMapping.findUnique({
    where: {
      provider_externalGroup: {
        provider: "keycloak",
        externalGroup,
      },
    },
  });
  if (!mapping) return null;
  return {
    suggestedRole: mapping.suggestedRole,
    requiresApproval: mapping.requiresApproval,
  };
}

export function isPrivilegedRole(role: string): boolean {
  return PRIVILEGED_ROLES.includes(role as MapAbleUserRole);
}

export function canAutoApproveRole(role: string): boolean {
  return !isPrivilegedRole(role);
}
