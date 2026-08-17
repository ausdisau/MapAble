import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { incidentListWhereForUser } from "@/lib/safety/incident-access";

export default async function SafetyCentrePage() {
  const user = await requireAuth();

  const incidentWhere = incidentListWhereForUser(user.id, false);
  const [incidentCount, supportCount, openSupportCount] = await Promise.all([
    prisma.incidentReport.count({ where: incidentWhere }),
    prisma.supportTicket.count({
      where: {
        OR: [{ createdById: user.id }, { participantId: user.id }],
      },
    }),
    prisma.supportTicket.count({
      where: {
        OR: [{ createdById: user.id }, { participantId: user.id }],
        status: { notIn: ["resolved", "closed"] },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">
          Safety & incident management centre
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Report concerns, track incident reports, and get help through support
          tickets. MapAble does not automatically report to the NDIS Commission —
          urgent safety risks require calling 000.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <CentreCard
          title="Incident reports"
          description={
            incidentCount
              ? `${incidentCount} report(s) on your record`
              : "Formal concern or safeguarding reports"
          }
          href="/dashboard/safety/incidents"
        />
        <CentreCard
          title="Support tickets"
          description={
            openSupportCount
              ? `${openSupportCount} open ticket(s) of ${supportCount} total`
              : supportCount
                ? `${supportCount} ticket(s)`
                : "Booking, transport, billing or general help"
          }
          href="/dashboard/safety/support"
        />
      </div>

      <section className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Immediate danger?</span>{" "}
          Call <strong>000</strong>. For platform safeguarding principles see{" "}
          <Link
            href="/safeguards"
            className="font-medium text-foreground underline underline-offset-2"
          >
            MapAble safeguards
          </Link>
          . Provider staff triage happens in the provider and admin consoles.
        </p>
      </section>
    </div>
  );
}

function CentreCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <span className="mt-3 inline-block text-sm font-medium text-primary">
        Open →
      </span>
    </Link>
  );
}
