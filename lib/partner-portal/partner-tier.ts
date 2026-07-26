import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { prisma } from "@/lib/prisma";

export type PartnerTierLabel =
  | "Enterprise Partner"
  | "Advocacy Partner"
  | "Government Partner"
  | "Standard Partner";

/**
 * Resolve a display tier for the Partner Portal header badge.
 * Wire to Partner API Program enrollment / billing once live.
 */
export async function resolvePartnerTierLabel(
  userId: string
): Promise<PartnerTierLabel> {
  const orgIds = await getUserOrganisationIds(userId);
  if (orgIds.length === 0) return "Standard Partner";

  // TODO: replace with the partner's primary organisation enrollment lookup.
  const enrollment = await prisma.partnerApiProgramEnrollment.findFirst({
    where: { organisationId: { in: orgIds } },
    orderBy: { createdAt: "desc" },
    select: { programTier: true },
  });

  const tier = (enrollment?.programTier ?? "standard").toLowerCase();
  switch (tier) {
    case "enterprise":
      return "Enterprise Partner";
    case "advocacy":
      return "Advocacy Partner";
    case "government":
      return "Government Partner";
    default:
      return "Standard Partner";
  }
}
