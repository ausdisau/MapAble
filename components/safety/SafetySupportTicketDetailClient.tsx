"use client";

import { format } from "date-fns";
import Link from "next/link";

import { SupportTicketStatusPanel } from "@/components/support/SupportTicketStatusPanel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { isSafeguardingTicket } from "@/lib/support/safeguarding-helpers";

export type SafetySupportTicketDetail = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  requiresIncidentReview: boolean;
  resolutionSummary: string | null;
  createdAt: string;
  closedAt: string | null;
  comments: {
    id: string;
    body: string;
    createdAt: string;
    authorName: string | null;
  }[];
};

const CATEGORY_LABELS: Record<string, string> = {
  booking_help: "Booking help",
  transport_issue: "Transport issue",
  billing_question: "Billing question",
  safeguarding_concern: "Safeguarding concern",
  other: "Other",
};

export function SafetySupportTicketDetailClient({
  ticket,
}: {
  ticket: SafetySupportTicketDetail;
}) {
  const safeguarding = isSafeguardingTicket({
    category: ticket.category,
    requiresIncidentReview: ticket.requiresIncidentReview,
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link
          href="/dashboard/safety/support"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Support tickets
        </Link>
        <h1 className="font-heading text-2xl font-bold">{ticket.title}</h1>
        <SupportTicketStatusPanel
          status={ticket.status}
          priority={ticket.priority}
          isSafeguarding={safeguarding}
        />
        <p className="text-sm text-muted-foreground">
          {CATEGORY_LABELS[ticket.category] ?? ticket.category} · Opened{" "}
          {format(new Date(ticket.createdAt), "d MMM yyyy HH:mm")}
        </p>
      </header>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Your message</h2>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
        </CardContent>
      </Card>

      {ticket.resolutionSummary ? (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Resolution</h2>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{ticket.resolutionSummary}</p>
            {ticket.closedAt ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Closed {format(new Date(ticket.closedAt), "d MMM yyyy")}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {ticket.comments.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-semibold">Conversation</h2>
          <ul className="space-y-2">
            {ticket.comments.map((c) => (
              <li key={c.id} className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm">{c.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.authorName ?? "Team"} ·{" "}
                  {format(new Date(c.createdAt), "d MMM yyyy HH:mm")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">
          A team member will respond here. You do not need to refresh the page repeatedly.
        </p>
      )}
    </div>
  );
}
