import type { NdisInvoiceDraft } from "@/lib/ndis/claiming/types";
import { prisma } from "@/lib/prisma";

export async function buildSelfManagedInvoiceDraft(
  batchId: string
): Promise<NdisInvoiceDraft | null> {
  const batch = await prisma.ndisClaimBatch.findUnique({
    where: { id: batchId },
    include: {
      lines: { where: { paymentRoute: "self_managed" } },
    },
  });
  if (!batch || batch.paymentRoute !== "self_managed" || batch.lines.length === 0) {
    return null;
  }

  const participantId = batch.lines[0]!.participantId;
  const participant = await prisma.user.findUnique({
    where: { id: participantId },
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
    invoiceNumber: `SM-${batch.batchReference ?? batch.id.slice(0, 8)}`,
    recipientType: "participant",
    recipientName: participant?.name ?? batch.lines[0]!.participantName,
    lines,
    totalCents,
  };
}

export async function persistSelfManagedInvoices(batchId: string, createdById: string) {
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
    await buildSelfManagedInvoiceDraft(batchId);
    const totalCents = lines.reduce((s, l) => s + l.totalAmountCents, 0);
    const inv = await prisma.ndisInvoice.create({
      data: {
        providerOrgId: batch.providerOrgId,
        participantId,
        paymentRoute: "self_managed",
        invoiceNumber: `SM-${batch.batchReference}-${participantId.slice(0, 6)}`,
        status: "issued",
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
