import type { Prisma } from "@prisma/client";

import { isAdminRole } from "@/lib/auth/roles";
import type { UserRole } from "@/types/mapable";

/**
 * Build a Prisma `where` clause for a case list scoped to the given user.
 *
 * - mapable_admin sees everything (regardless of the `userId`).
 * - support_coordinator and plan_manager see cases they created, own, or
 *   are listed as the participant on. (Provider-org scoping is intentionally
 *   not modelled yet — see TODO in docs/modules/case-management.md.)
 * - everyone else only sees cases where they are the participant.
 */
export function caseListWhereForUser(
  userId: string,
  role: UserRole,
): Prisma.CaseWhereInput {
  if (isAdminRole(role)) return {};

  if (role === "support_coordinator" || role === "plan_manager") {
    return {
      OR: [
        { createdById: userId },
        { assignedToId: userId },
        { participantId: userId },
      ],
    };
  }

  return { participantId: userId };
}

export function canUserAccessCase(
  caseRow: {
    participantId: string | null;
    assignedToId: string | null;
    createdById: string;
  },
  userId: string,
  role: UserRole,
): boolean {
  if (isAdminRole(role)) return true;
  if (caseRow.participantId === userId) return true;
  if (role === "support_coordinator" || role === "plan_manager") {
    return caseRow.createdById === userId || caseRow.assignedToId === userId;
  }
  return false;
}

export function canUserManageCase(
  caseRow: {
    participantId: string | null;
    assignedToId: string | null;
    createdById: string;
  },
  userId: string,
  role: UserRole,
): boolean {
  if (isAdminRole(role)) return true;
  if (role === "support_coordinator" || role === "plan_manager") {
    return caseRow.createdById === userId || caseRow.assignedToId === userId;
  }
  return false;
}
