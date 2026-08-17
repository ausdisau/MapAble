import { notFound } from "next/navigation";

import { AccessNeedsSummary } from "@/components/care/AccessNeedsSummary";
import { ServiceAgreementPlaceholder } from "@/components/care/ServiceAgreementPlaceholder";
import { ServiceLogConfirmDispute } from "@/components/care/ServiceLogConfirmDispute";
import { SupportTasksSummary } from "@/components/care/SupportTasksSummary";
import { requirePermission } from "@/lib/auth/guards";
import { assertParticipantOwnsBooking } from "@/lib/care/access-control";
import { prisma } from "@/lib/prisma";

export default async function CareBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("care:read:self");
  const { id } = await params;

  const booking = await prisma.careBooking.findUnique({
    where: { id },
    include: {
      careRequest: true,
      organisation: { select: { name: true } },
      serviceAgreement: true,
      serviceLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      accessNeeds: true,
      shifts: { take: 5 },
    },
  });
  if (!booking) notFound();
  try {
    assertParticipantOwnsBooking(user, booking);
  } catch {
    notFound();
  }

  const log = booking.serviceLogs[0];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{booking.careRequest.title}</h1>
      <p className="text-sm text-muted-foreground">
        {booking.organisation.name} · {booking.status}
      </p>
      <SupportTasksSummary tasks={booking.tasks} />
      <AccessNeedsSummary
        summary={booking.careRequest.accessRequirementsSummary}
        needs={booking.accessNeeds}
      />
      <ServiceAgreementPlaceholder
        title={booking.serviceAgreement?.placeholderTitle}
        summary={booking.serviceAgreement?.placeholderSummary}
      />
      {log ? (
        <ServiceLogConfirmDispute
          logId={log.careShiftId ?? log.id}
          status={log.status}
          organisationId={booking.organisationId}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Service log will appear after your worker completes the shift.
        </p>
      )}
    </div>
  );
}
