import { ParticipantShiftOffers } from "@/components/care/ParticipantShiftOffers";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Worker options | MapAble Care" };

export default async function ParticipantShiftOffersPage() {
  const participant = await requireAuth();
  const offers = await prisma.shiftOffer.findMany({
    where: {
      participantId: participant.id,
      status: "awaiting_participant",
      expiresAt: { gt: new Date() },
    },
    include: {
      workerProfile: { select: { displayName: true } },
      careShift: {
        select: {
          startAt: true,
          accessRequirementsSnapshot: true,
        },
      },
    },
    orderBy: { expiresAt: "asc" },
  });
  return (
    <ParticipantShiftOffers
      offers={offers.map((offer) => ({
        id: offer.id,
        workerName: offer.workerProfile.displayName,
        startsAt: offer.careShift.startAt.toISOString(),
        matchedRequirements: ["Verified required credentials", "Available for the shift"],
        uncertainty: [
          "Provider acceptance and service delivery remain subject to worker acceptance.",
        ],
      }))}
    />
  );
}
