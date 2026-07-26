import { notFound } from "next/navigation";

import { AccessNeedsSummary } from "@/components/care/AccessNeedsSummary";
import { AssignWorkerForm } from "@/components/care/AssignWorkerForm";
import { InvoicePlaceholderCard } from "@/components/care/InvoicePlaceholderCard";
import { ProviderCareBookingActions } from "@/components/care/ProviderCareBookingActions";
import { ServiceAgreementPlaceholder } from "@/components/care/ServiceAgreementPlaceholder";
import { SupportTasksSummary } from "@/components/care/SupportTasksSummary";
import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { requirePermission } from "@/lib/auth/guards";
import { assertProviderOrgAccess } from "@/lib/care/access-control";
import { checkConsent } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";

export default async function ProviderCareBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("care:manage:org");
  const { id } = await params;
  const orgIds = await getUserOrganisationIds(user.id);

  const booking = await prisma.careBooking.findUnique({
    where: { id },
    include: {
      careRequest: true,
      serviceAgreement: true,
      accessNeeds: true,
      bookingWorkers: { include: { workerProfile: true } },
      serviceLogs: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
  if (!booking || !orgIds.includes(booking.organisationId)) notFound();

  try {
    await assertProviderOrgAccess(user, booking.organisationId);
  } catch {
    notFound();
  }

  let accessSummary = booking.careRequest.accessRequirementsSummary;
  if (booking.careRequest.shareAccessibility) {
    const hasConsent = await checkConsent({
      subjectUserId: booking.participantId,
      scope: "care.accessibility_share",
      grantedToOrganisationId: booking.organisationId,
    });
    if (!hasConsent) accessSummary = null;
  }

  const workers = await prisma.workerProfile.findMany({
    where: { organisationId: booking.organisationId, active: true },
    select: { id: true, displayName: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{booking.careRequest.title}</h1>
      <p className="text-sm text-muted-foreground">Status: {booking.status}</p>
      {booking.status === "pending_provider" ? (
        <ProviderCareBookingActions careBookingId={booking.id} />
      ) : null}
      <SupportTasksSummary tasks={booking.tasks} />
      <AccessNeedsSummary summary={accessSummary} needs={booking.accessNeeds} />
      <ServiceAgreementPlaceholder
        title={booking.serviceAgreement?.placeholderTitle}
        summary={booking.serviceAgreement?.placeholderSummary}
      />
      <section className="rounded-xl border p-4">
        <h2 className="font-semibold">Assign worker</h2>
        <AssignWorkerForm careBookingId={booking.id} workers={workers} />
      </section>
      <InvoicePlaceholderCard careBookingId={booking.id} />
      <section>
        <h2 className="font-semibold">Service logs</h2>
        <ul className="mt-2 text-sm">
          {booking.serviceLogs.map((l) => (
            <li key={l.id}>
              {l.status} — {l.submittedAt?.toLocaleString() ?? "draft"}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
