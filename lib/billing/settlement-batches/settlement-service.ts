import { prisma } from "@/lib/prisma";

export async function createSettlementBatch(periodStart: Date, periodEnd: Date) {
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["paid", "approved_for_invoicing"] },
      createdAt: { gte: periodStart, lte: periodEnd },
    },
    take: 200,
    select: { id: true, totalCents: true },
  });

  const totalCents = invoices.reduce((s, i) => s + (i.totalCents ?? 0), 0);

  return prisma.settlementBatch.create({
    data: {
      periodStart,
      periodEnd,
      totalCents,
      itemCount: invoices.length,
      status: "draft",
      lines: {
        create: invoices.map((inv) => ({
          invoiceId: inv.id,
          amountCents: inv.totalCents ?? 0,
          status: "pending",
        })),
      },
    },
    include: { lines: true },
  });
}

export async function getSettlementBatchesDashboard() {
  const batches = await prisma.settlementBatch.findMany({
    include: { lines: true },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
  return { batches };
}
