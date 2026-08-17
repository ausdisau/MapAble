import { prisma } from "@/lib/prisma";

export async function createPilotExport(partnerId: string) {
  const partner = await prisma.planManagerPilotPartner.findUnique({
    where: { id: partnerId },
  });
  if (!partner?.active) throw new Error("PARTNER_INACTIVE");

  const invoices = await prisma.invoice.findMany({
    where: { status: { in: ["draft", "approved_for_invoicing", "paid"] } },
    take: 100,
    select: {
      id: true,
      status: true,
      participantId: true,
      createdAt: true,
    },
  });

  const exportRecord = await prisma.planManagerPilotExport.create({
    data: {
      partnerId,
      status: "generated",
      fileName: `pilot-export-${Date.now()}.${partner.exportFormat}`,
    },
  });

  return { export: exportRecord, rowCount: invoices.length, rows: invoices };
}
