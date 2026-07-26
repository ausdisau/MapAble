import type { TransportBooking } from "@prisma/client";

import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { TransportApiError } from "@/lib/transport/transport-api-error";

export async function assertCanAccessTransportBooking(
  user: CurrentUser,
  booking: Pick<
    TransportBooking,
    "participantId" | "operatorOrganisationId" | "driverProfileId"
  >
): Promise<void> {
  if (isAdminRole(user.primaryRole)) return;

  if (booking.participantId === user.id) return;

  if (booking.operatorOrganisationId) {
    const orgIds = await getUserOrganisationIds(user.id);
    if (orgIds.includes(booking.operatorOrganisationId)) return;
  }

  if (booking.driverProfileId) {
    const driver = await prisma.driverProfile.findFirst({
      where: { userId: user.id, active: true },
      select: { id: true },
    });
    if (driver?.id === booking.driverProfileId) return;
  }

  throw new TransportApiError("TRANSPORT_ACCESS_DENIED");
}
