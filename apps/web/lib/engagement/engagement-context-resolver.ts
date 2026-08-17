import { prisma } from "@/lib/prisma";

export type EngagementContextLabel = {
  label: string;
  organisationId?: string;
  organisationName?: string;
};

export async function resolveEngagementContext(
  contextType?: string | null,
  contextId?: string | null
): Promise<EngagementContextLabel | null> {
  if (!contextType || !contextId) return null;

  switch (contextType) {
    case "care_shift": {
      const shift = await prisma.careShift.findUnique({
        where: { id: contextId },
        include: { organisation: { select: { id: true, name: true } } },
      });
      if (!shift) return null;
      return {
        label: `Care shift ${shift.startAt.toLocaleDateString("en-AU")}`,
        organisationId: shift.organisationId,
        organisationName: shift.organisation.name,
      };
    }
    case "transport_trip": {
      const trip = await prisma.transportTrip.findUnique({
        where: { id: contextId },
        include: {
          providerOrganisation: { select: { id: true, name: true } },
        },
      });
      if (!trip) return null;
      return {
        label: `Transport trip ${trip.scheduledStart.toLocaleDateString("en-AU")}`,
        organisationId: trip.providerOrganisationId ?? undefined,
        organisationName: trip.providerOrganisation?.name,
      };
    }
    case "care_booking": {
      const booking = await prisma.careBooking.findUnique({
        where: { id: contextId },
        include: { organisation: { select: { id: true, name: true } } },
      });
      if (!booking) return null;
      return {
        label: `Care booking ${booking.createdAt.toLocaleDateString("en-AU")}`,
        organisationId: booking.organisationId,
        organisationName: booking.organisation.name,
      };
    }
    case "timesheet": {
      const ts = await prisma.timesheet.findUnique({
        where: { id: contextId },
        include: { organisation: { select: { id: true, name: true } } },
      });
      if (!ts) return null;
      return {
        label: `Timesheet ${ts.scheduledStart.toLocaleDateString("en-AU")}`,
        organisationId: ts.organisationId,
        organisationName: ts.organisation.name,
      };
    }
    default:
      return { label: contextType };
  }
}
