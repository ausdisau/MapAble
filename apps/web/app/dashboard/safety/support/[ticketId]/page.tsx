import Link from "next/link";

import { SafetySupportTicketDetailClient } from "@/components/safety/SafetySupportTicketDetailClient";
import { requireAuth } from "@/lib/auth/guards";
import { getSupportTicketForUser } from "@/lib/safety/support-access";

export default async function SafetySupportTicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const user = await requireAuth();
  const { ticketId } = await params;
  const ticket = await getSupportTicketForUser(
    ticketId,
    user.id,
    user.primaryRole
  );

  if (!ticket) {
    return (
      <div className="space-y-4">
        <p role="alert">Support ticket not found.</p>
        <Link
          href="/dashboard/safety/support"
          className="text-sm font-medium text-primary hover:underline"
        >
          Back to support tickets
        </Link>
      </div>
    );
  }

  const detail = {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    requiresIncidentReview: ticket.requiresIncidentReview,
    resolutionSummary: ticket.resolutionSummary,
    createdAt: ticket.createdAt.toISOString(),
    closedAt: ticket.closedAt?.toISOString() ?? null,
    comments: ticket.comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
      authorName: c.author?.name ?? null,
    })),
  };

  return <SafetySupportTicketDetailClient ticket={detail} />;
}
