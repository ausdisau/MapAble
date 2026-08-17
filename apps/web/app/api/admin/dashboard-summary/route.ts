import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const [
    totalUsers,
    participantProfiles,
    organisationsPendingReview,
    bookingsRequested,
    consentRecords,
    recentAuditEvents,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.participantProfile.count(),
    prisma.organisation.count({
      where: { verificationStatus: "pending_review" },
    }),
    prisma.booking.count({ where: { status: "requested" } }),
    prisma.consentRecord.count({ where: { status: "active" } }),
    prisma.auditEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        actorUser: { select: { name: true, email: true } },
      },
    }),
  ]);

  return jsonOk({
    metrics: {
      totalUsers,
      participantProfiles,
      organisationsPendingReview,
      bookingsRequested,
      consentRecords,
      unresolvedSystemAlerts: 0,
    },
    recentAuditEvents,
  });
}
