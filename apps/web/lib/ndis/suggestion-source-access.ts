import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { assertCanViewCareShift } from "@/lib/care/access-control";
import { assertOrgAccess } from "@/lib/ndis/claiming/claim-service";
import { prisma } from "@/lib/prisma";

export class SuggestionSourceAccessError extends Error {
  constructor(
    message: string,
    public code: "FORBIDDEN" | "NOT_FOUND" | "UNSUPPORTED" = "FORBIDDEN"
  ) {
    super(message);
    this.name = "SuggestionSourceAccessError";
  }
}

export async function assertCanAccessSuggestionSource(
  user: CurrentUser,
  sourceType: string,
  sourceId: string
) {
  const normalized = sourceType.trim().toLowerCase();

  if (normalized === "booking") {
    const booking = await prisma.booking.findUnique({
      where: { id: sourceId },
      select: {
        id: true,
        participantId: true,
        assignedOrganisationId: true,
      },
    });
    if (!booking) {
      throw new SuggestionSourceAccessError("Source not found.", "NOT_FOUND");
    }
    if (isAdminRole(user.primaryRole)) return booking;
    if (booking.participantId === user.id) return booking;
    if (booking.assignedOrganisationId) {
      await assertOrgAccess(user, booking.assignedOrganisationId);
      return booking;
    }
    throw new SuggestionSourceAccessError("Access denied.");
  }

  if (normalized === "care_shift" || normalized === "careshift") {
    const shift = await prisma.careShift.findUnique({
      where: { id: sourceId },
      select: {
        id: true,
        participantId: true,
        organisationId: true,
        workerProfileId: true,
      },
    });
    if (!shift) {
      throw new SuggestionSourceAccessError("Source not found.", "NOT_FOUND");
    }
    await assertCanViewCareShift(user, shift);
    return shift;
  }

  if (normalized === "care_booking" || normalized === "carebooking") {
    const careBooking = await prisma.careBooking.findUnique({
      where: { id: sourceId },
      select: {
        id: true,
        participantId: true,
        organisationId: true,
      },
    });
    if (!careBooking) {
      throw new SuggestionSourceAccessError("Source not found.", "NOT_FOUND");
    }
    if (isAdminRole(user.primaryRole)) return careBooking;
    if (careBooking.participantId === user.id) return careBooking;
    await assertOrgAccess(user, careBooking.organisationId);
    return careBooking;
  }

  throw new SuggestionSourceAccessError(
    `Unsupported source type: ${sourceType}`,
    "UNSUPPORTED"
  );
}
