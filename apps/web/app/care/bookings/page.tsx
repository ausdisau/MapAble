import Link from "next/link";

import { CareListCard } from "@/components/care/CareListCard";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const PENDING_REQUEST_STATUSES = [
  "submitted",
  "awaiting_admin_review",
  "awaiting_provider_response",
  "matched",
] as const;

export default async function CareBookingsPage() {
  const user = await requirePermission("care:read:self");
  const [bookings, pendingRequests] = await Promise.all([
    prisma.careBooking.findMany({
      where: { participantId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        organisation: { select: { name: true } },
        careRequest: { select: { title: true } },
      },
    }),
    prisma.careRequest.findMany({
      where: {
        participantId: user.id,
        status: { in: [...PENDING_REQUEST_STATUSES] },
        careBooking: null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        assignedOrganisation: { select: { name: true } },
      },
    }),
  ]);

  const pendingWithoutBooking = pendingRequests.filter(
    (request) =>
      !bookings.some((booking) => booking.careRequestId === request.id)
  );

  return (
    <div className="space-y-8">
      <CorePageHeader
        eyebrow="Bookings"
        title="My care bookings"
        description="Track provider responses and service delivery. Status updates appear here as your support progresses."
        className="border-0 pb-0"
      />

      <Button asChild variant="outline" size="default">
        <Link href="/care/request">New support request</Link>
      </Button>

      {pendingWithoutBooking.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Requests in progress</h2>
          <p className="text-sm text-muted-foreground">
            These requests are submitted and awaiting assignment or provider
            response. You do not need to do anything unless we contact you.
          </p>
          <ul className="space-y-3">
            {pendingWithoutBooking.map((request) => (
              <li key={request.id}>
                <CareListCard
                  href={`/dashboard/care/${request.id}`}
                  title={request.title}
                  subtitle={
                    request.assignedOrganisation?.name ??
                    "Awaiting provider assignment"
                  }
                  status={request.status}
                  meta="Submitted — our team is matching you with a service-ready provider"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Bookings</h2>
        <ul className="space-y-3">
          {bookings.map((b) => (
            <li key={b.id}>
              <CareListCard
                href={`/care/bookings/${b.id}`}
                title={b.careRequest.title}
                subtitle={b.organisation.name}
                status={b.status}
              />
            </li>
          ))}
          {bookings.length === 0 && pendingWithoutBooking.length === 0 ? (
            <li className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              No bookings yet.{" "}
              <Link
                href="/care/request"
                className="font-medium text-primary hover:underline"
              >
                Describe what you need
              </Link>{" "}
              to create a request and review your draft plan first.
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
