import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { y2OrchestrationConfig } from "@/lib/config/y2-orchestration";
import { requireMicroConsent } from "@/lib/consent/micro-consent-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

export async function hasPlanManagerAccess(
  participantId: string,
  planManagerId: string
) {
  const rel = await prisma.planManagerRelationship.findUnique({
    where: {
      participantId_planManagerId: { participantId, planManagerId },
    },
  });
  return rel?.status === "active";
}

export async function listAuthorisedInvoices(
  planManagerId: string,
  participantId?: string
) {
  if (y2OrchestrationConfig.planManagerIntegrationEnabled) {
    const rels = await prisma.planManagerRelationship.findMany({
      where: {
        planManagerId,
        status: "active",
        ...(participantId ? { participantId } : {}),
      },
    });

    for (const rel of rels) {
      await requireMicroConsent({
        action: "plan_manager.invoice_view",
        subjectUserId: rel.participantId,
        actorUserId: planManagerId,
        grantedToUserId: planManagerId,
      });
    }

    const participantIds = rels.map((r) => r.participantId);
    if (participantIds.length === 0) return [];

    return prisma.invoice.findMany({
      where: { participantId: { in: participantIds } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        participantId: true,
        totalCents: true,
        taxCents: true,
        subtotalCents: true,
        createdAt: true,
        lines: {
          select: {
            id: true,
            description: true,
            quantity: true,
            unitAmountCents: true,
            totalAmountCents: true,
          },
        },
      },
    });
  }

  const rels = await prisma.planManagerRelationship.findMany({
    where: { planManagerId, status: "active" },
  });
  const participantIds = rels.map((r) => r.participantId);
  return prisma.invoice.findMany({
    where: { participantId: { in: participantIds } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      participantId: true,
      createdAt: true,
    },
  });
}

export async function approveInvoiceForPayment(params: {
  invoiceId: string;
  planManagerId: string;
  notes?: string;
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
  });
  if (!invoice) throw new Error("NOT_FOUND");

  const allowed = await hasPlanManagerAccess(
    invoice.participantId,
    params.planManagerId
  );
  if (!allowed) throw new Error("CONSENT_REQUIRED");

  const existingReview = await prisma.planManagerInvoiceReview.findFirst({
    where: {
      invoiceId: params.invoiceId,
      planManagerId: params.planManagerId,
    },
  });

  let review;
  if (existingReview) {
    review = await prisma.planManagerInvoiceReview.update({
      where: { id: existingReview.id },
      data: {
        status: "approved_for_payment",
        notes: params.notes,
      },
    });
  } else {
    review = await prisma.planManagerInvoiceReview.create({
      data: {
        invoiceId: params.invoiceId,
        planManagerId: params.planManagerId,
        status: "approved_for_payment",
        notes: params.notes,
      },
    });
  }

  await createAuditEvent({
    actorUserId: params.planManagerId,
    action: "plan_manager.invoice_approved",
    entityType: "Invoice",
    entityId: params.invoiceId,
    participantId: invoice.participantId,
  });

  return review;
}

export async function raisePlanManagerQuery(params: {
  invoiceId: string;
  planManagerId: string;
  body: string;
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
  });
  if (!invoice) throw new Error("NOT_FOUND");

  const allowed = await hasPlanManagerAccess(
    invoice.participantId,
    params.planManagerId
  );
  if (!allowed) throw new Error("CONSENT_REQUIRED");

  const query = await prisma.planManagerQuery.create({
    data: {
      invoiceId: params.invoiceId,
      planManagerId: params.planManagerId,
      body: params.body,
    },
  });

  const existingReview = await prisma.planManagerInvoiceReview.findFirst({
    where: {
      invoiceId: params.invoiceId,
      planManagerId: params.planManagerId,
    },
  });
  if (existingReview) {
    await prisma.planManagerInvoiceReview.update({
      where: { id: existingReview.id },
      data: { status: "query_raised", notes: params.body.slice(0, 500) },
    });
  } else {
    await prisma.planManagerInvoiceReview.create({
      data: {
        invoiceId: params.invoiceId,
        planManagerId: params.planManagerId,
        status: "query_raised",
        notes: params.body.slice(0, 500),
      },
    });
  }

  await notifyUser(
    invoice.participantId,
    "billing",
    "Plan manager question about your invoice",
    "A plan manager has raised a question that needs review."
  );

  await createAuditEvent({
    actorUserId: params.planManagerId,
    action: "plan_manager.query_raised",
    entityType: "Invoice",
    entityId: params.invoiceId,
    participantId: invoice.participantId,
  });

  return query;
}

export async function invitePlanManager(params: {
  participantId: string;
  planManagerId: string;
}) {
  const rel = await prisma.planManagerRelationship.upsert({
    where: {
      participantId_planManagerId: {
        participantId: params.participantId,
        planManagerId: params.planManagerId,
      },
    },
    create: {
      participantId: params.participantId,
      planManagerId: params.planManagerId,
      status: "pending",
    },
    update: { status: "pending" },
  });

  if (y2OrchestrationConfig.planManagerIntegrationEnabled) {
    await recordMicroConsentForPlanManager(params);
  }

  await notifyUser(
    params.planManagerId,
    "billing",
    "Plan manager access requested",
    "A participant has invited you to review invoices."
  );

  return rel;
}

async function recordMicroConsentForPlanManager(params: {
  participantId: string;
  planManagerId: string;
}) {
  const { recordMicroConsentGrant } = await import(
    "@/lib/consent/micro-consent-service"
  );
  await recordMicroConsentGrant({
    action: "plan_manager.invoice_view",
    subjectUserId: params.participantId,
    createdById: params.participantId,
    purpose: "Share invoice summaries with plan manager",
    grantedToUserId: params.planManagerId,
    shareMode: "always_for_service",
  });

  await prisma.planManagerRelationship.update({
    where: {
      participantId_planManagerId: {
        participantId: params.participantId,
        planManagerId: params.planManagerId,
      },
    },
    data: { status: "active" },
  });
}
