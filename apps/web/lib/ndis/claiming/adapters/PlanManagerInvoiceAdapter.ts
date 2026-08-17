import type { NdisInvoiceDraft } from "@/lib/ndis/claiming/types";
import { prisma } from "@/lib/prisma";

export async function buildPlanManagerInvoiceDraft(
  batchId: string
): Promise<NdisInvoiceDraft | null> {
  const batch = await prisma.ndisClaimBatch.findUnique({
    where: { id: batchId },
    include: {
      lines: { where: { paymentRoute: "plan_managed" } },
    },
  });
  if (!batch || batch.paymentRoute !== "plan_managed" || batch.lines.length === 0) {
    return null;
  }

  const participantId = batch.lines[0]!.participantId;
  const funding = await prisma.participantFundingSource.findFirst({
    where: {
      participantId,
      type: "ndis_plan_managed",
      status: "active",
    },
  });

  const lines = batch.lines.map((l) => ({
    supportItemCode: l.supportItemCode,
    description: l.supportDescription,
    serviceDate: l.serviceStartDate.toISOString().slice(0, 10),
    quantity: Number(l.quantity),
    unitPriceCents: l.unitPriceCents,
    totalCents: l.totalAmountCents,
  }));

  const totalCents = lines.reduce((s, l) => s + l.totalCents, 0);

  return {
    invoiceNumber: `PM-${batch.batchReference ?? batch.id.slice(0, 8)}`,
    recipientType: "plan_manager",
    recipientName: funding?.displayName ?? "Plan manager",
    recipientEmail: null,
    lines,
    totalCents,
  };
}

export async function persistPlanManagerInvoices(
  batchId: string,
  createdById: string
) {
  const batch = await prisma.ndisClaimBatch.findUnique({
    where: { id: batchId },
    include: { lines: true },
  });
  if (!batch) return [];

  const byParticipant = new Map<string, typeof batch.lines>();
  for (const line of batch.lines) {
    const list = byParticipant.get(line.participantId) ?? [];
    list.push(line);
    byParticipant.set(line.participantId, list);
  }

  const invoices = [];
  for (const [participantId, lines] of byParticipant) {
    const funding = await prisma.participantFundingSource.findFirst({
      where: {
        participantId,
        type: "ndis_plan_managed",
        status: "active",
      },
    });

    const totalCents = lines.reduce((s, l) => s + l.totalAmountCents, 0);
    const inv = await prisma.ndisInvoice.create({
      data: {
        providerOrgId: batch.providerOrgId,
        participantId,
        paymentRoute: "plan_managed",
        invoiceNumber: `PM-${batch.batchReference}-${participantId.slice(0, 6)}`,
        status: "issued",
        planManagerName: funding?.displayName ?? null,
        totalCents,
        issuedAt: new Date(),
        createdById,
        lines: {
          create: lines.map((l, i) => ({
            supportItemCode: l.supportItemCode,
            description: l.supportDescription,
            serviceDate: l.serviceStartDate,
            quantity: l.quantity,
            unitPriceCents: l.unitPriceCents,
            totalCents: l.totalAmountCents,
            claimLineId: l.id,
            sortOrder: i,
          })),
        },
      },
      include: { lines: true },
    });

    await prisma.ndisClaimLine.updateMany({
      where: { id: { in: lines.map((l) => l.id) } },
      data: { ndisInvoiceId: inv.id, status: "exported" },
    });
    invoices.push(inv);
  }

  return invoices;
}
