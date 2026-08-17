import { format } from "date-fns";
import Link from "next/link";

import { SupportTicketStatusPanel } from "@/components/support/SupportTicketStatusPanel";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { isSafeguardingTicket } from "@/lib/support/ticket-service";

export const metadata = { title: "Support tickets | Safety centre" };

export default async function SafetySupportPage() {
  const user = await requireAuth();
  const tickets = await prisma.supportTicket.findMany({
    where: { OR: [{ createdById: user.id }, { participantId: user.id }] },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Support tickets</h1>
          <p className="text-muted-foreground">
            Describe your issue in plain language. For formal safeguarding reports,
            use incident reports.
          </p>
        </div>
        <Link
          href="/dashboard/safety/support/new"
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-primary-foreground"
        >
          New ticket
        </Link>
      </header>

      {tickets.length === 0 ? (
        <p className="text-muted-foreground">No support tickets yet.</p>
      ) : (
        <ul className="space-y-3">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link
                href={`/dashboard/safety/support/${t.id}`}
                className="block rounded-lg border border-border bg-card p-4 transition hover:border-primary/40"
              >
                <h2 className="font-medium">{t.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {format(t.createdAt, "d MMM yyyy")}
                </p>
                <div className="mt-2">
                  <SupportTicketStatusPanel
                    status={t.status}
                    priority={t.priority}
                    isSafeguarding={isSafeguardingTicket(t)}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
