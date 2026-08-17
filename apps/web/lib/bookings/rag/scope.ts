import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";

import type { BookingRAGScope } from "./types";

export async function buildBookingRAGScope(user: CurrentUser): Promise<BookingRAGScope> {
  const isAdmin = isAdminRole(user.primaryRole);
  if (isAdmin) {
    return {
      isAdmin: true,
      viewerUserId: user.id,
      viewerRole: user.primaryRole,
    };
  }

  const orgIds = await getUserOrganisationIds(user.id);
  const isProvider =
    user.primaryRole === "provider_admin" ||
    user.primaryRole === "support_coordinator" ||
    user.primaryRole === "transport_operator" ||
    orgIds.length > 0;

  if (isProvider && orgIds.length > 0) {
    return {
      isAdmin: false,
      organisationIds: orgIds,
      viewerUserId: user.id,
      viewerRole: user.primaryRole,
    };
  }

  return {
    isAdmin: false,
    participantId: user.id,
    viewerUserId: user.id,
    viewerRole: user.primaryRole,
  };
}

export function canViewSensitiveBookingFields(
  scope: BookingRAGScope,
  snapshot: { participantId: string; organisationId: string | null },
): boolean {
  if (scope.isAdmin) return true;
  if (scope.participantId && scope.participantId === snapshot.participantId) {
    return true;
  }
  if (
    scope.organisationIds?.length &&
    snapshot.organisationId &&
    scope.organisationIds.includes(snapshot.organisationId)
  ) {
    return true;
  }
  return false;
}
