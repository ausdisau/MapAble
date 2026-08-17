import type { SupportTicketCategory, SupportTicketPriority } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { recordBookingTimelineEvent } from "@/lib/bookings/timeline-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

export async function createSupportTicket(params: {
  title: string;
  description: string;
  category: SupportTicketCategory;
  priority?: SupportTicketPriority;
  participantId?: string;
  organisationId?: string;
  bookingId?: string;
  createdById: string;
  requiresIncidentReview?: boolean;
}) {
  const isSafeguarding = params.category === "safeguarding_concern";

  const ticket = await prisma.supportTicket.create({
    data: {
      title: params.title,
      description: params.description,
      category: params.category,
      priority: params.priority ?? (isSafeguarding ? "urgent" : "normal"),
      participantId: params.participantId,
      organisationId: params.organisationId,
      bookingId: params.bookingId,
      createdById: params.createdById,
      requiresIncidentReview:
        params.requiresIncidentReview ?? isSafeguarding,
      status: isSafeguarding ? "escalated" : "open",
    },
  });

  await createAuditEvent({
    actorUserId: params.createdById,
    action: "support_ticket.created",
    entityType: "SupportTicket",
    entityId: ticket.id,
    participantId: params.participantId ?? undefined,
    metadata: {
      category: params.category,
      requiresIncidentReview: ticket.requiresIncidentReview,
    },
  });

  if (params.bookingId) {
    await recordBookingTimelineEvent({
      bookingId: params.bookingId,
      eventType: "support_ticket_created",
      title: "Support ticket created",
      actorUserId: params.createdById,
    });
  }

  const admins = await prisma.user.findMany({
    where: { primaryRole: "mapable_admin" },
    select: { id: true },
  });
  for (const admin of admins) {
    await notifyUser(
      admin.id,
      "safeguarding",
      isSafeguarding ? "Safeguarding concern ticket" : "New support ticket",
      ticket.title
    );
  }

  return ticket;
}

export async function updateTicketStatus(
  ticketId: string,
  status: string,
  actorUserId: string,
  extra?: { assignedAdminId?: string; resolutionSummary?: string }
) {
  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: status as never,
      ...extra,
      closedAt: status === "closed" || status === "resolved" ? new Date() : undefined,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "support_ticket.status_changed",
    entityType: "SupportTicket",
    entityId: ticketId,
    participantId: ticket.participantId ?? undefined,
    metadata: { status },
  });

  return ticket;
}

export { isSafeguardingTicket } from "@/lib/support/safeguarding-helpers";
