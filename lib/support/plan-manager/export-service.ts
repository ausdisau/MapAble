import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { y2OrchestrationConfig } from "@/lib/config/y2-orchestration";
import { prisma } from "@/lib/prisma";
import { listAuthorisedInvoices } from "@/lib/support/plan-manager/invoice-review-service";

export type PlanManagerExportRow = {
  invoiceId: string;
  participantRef: string;
  status: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  lineItems: {
    description: string;
    quantity: string;
    unitAmountCents: number;
    totalAmountCents: number;
  }[];
};

export async function createPlanManagerExportV1(params: {
  planManagerId: string;
  format: "json" | "csv";
  pseudonymiseParticipants?: boolean;
}) {
  if (!y2OrchestrationConfig.planManagerIntegrationEnabled) {
    throw new Error("PLAN_MANAGER_INTEGRATION_DISABLED");
  }

  const invoices = await listAuthorisedInvoices(params.planManagerId);

  const rows: PlanManagerExportRow[] = invoices.map((inv) => ({
    invoiceId: inv.id,
    participantRef: params.pseudonymiseParticipants
      ? `p_${inv.participantId.slice(0, 8)}`
      : inv.participantId,
    status: inv.status,
    subtotalCents: "subtotalCents" in inv ? (inv.subtotalCents as number) : 0,
    taxCents: "taxCents" in inv ? (inv.taxCents as number) : 0,
    totalCents: "totalCents" in inv ? (inv.totalCents as number) : 0,
    lineItems:
      "lines" in inv && Array.isArray(inv.lines)
        ? inv.lines.map((l: Record<string, unknown>) => ({
            description: String(l.description),
            quantity: String(l.quantity),
            unitAmountCents: Number(l.unitAmountCents),
            totalAmountCents: Number(l.totalAmountCents),
          }))
        : [],
  }));

  const fileName = `plan-manager-export-${Date.now()}.${params.format}`;

  let partner = await prisma.planManagerPilotPartner.findFirst({
    where: { active: true },
  });
  if (!partner) {
    partner = await prisma.planManagerPilotPartner.create({
      data: { name: "Default partner", exportFormat: params.format, active: true },
    });
  }

  const exportRecord = await prisma.planManagerPilotExport.create({
    data: {
      partnerId: partner.id,
      status: "generated",
      fileName,
    },
  });

  await createAuditEvent({
    actorUserId: params.planManagerId,
    action: "plan_manager.export_created",
    entityType: "PlanManagerPilotExport",
    entityId: exportRecord.id,
    metadata: { rowCount: rows.length, format: params.format },
  });

  if (params.format === "csv") {
    const header =
      "invoiceId,participantRef,status,subtotalCents,taxCents,totalCents\n";
    const csv =
      header +
      rows
        .map(
          (r) =>
            `${r.invoiceId},${r.participantRef},${r.status},${r.subtotalCents},${r.taxCents},${r.totalCents}`
        )
        .join("\n");
    return { export: exportRecord, format: "csv" as const, content: csv, rows };
  }

  return { export: exportRecord, format: "json" as const, rows };
}

export async function createPlanManagerExportV2(params: {
  planManagerId: string;
  format: "json" | "csv";
  pseudonymiseParticipants?: boolean;
}) {
  const v1 = await createPlanManagerExportV1(params);
  return {
    ...v1,
    apiVersion: "v2" as const,
    meta: {
      exportedAt: new Date().toISOString(),
      rowCount: v1.rows.length,
      includesLineItems: true,
    },
    rows: v1.rows.map((r) => ({
      ...r,
      schemaVersion: 2,
    })),
  };
}
