import { createHash } from "crypto";

import { maskNdisNumber } from "@/lib/crypto/ndis";
import type { BulkPaymentRequestExport } from "@/lib/ndis/claiming/types";
import { prisma } from "@/lib/prisma";

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatMoney(cents: number): string {
  return (cents / 100).toFixed(2);
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function buildBulkPaymentRequestExport(
  batchId: string
): Promise<BulkPaymentRequestExport | null> {
  const batch = await prisma.ndisClaimBatch.findUnique({
    where: { id: batchId },
    include: {
      providerOrg: true,
      lines: {
        where: { paymentRoute: "ndia_managed" },
        orderBy: { serviceStartDate: "asc" },
      },
    },
  });

  if (!batch || batch.paymentRoute !== "ndia_managed") return null;
  if (!batch.providerOrg.ndisRegistrationNumber) {
    throw new Error("PROVIDER_REGISTRATION_REQUIRED");
  }

  const rows = batch.lines.map((line) => {
    const participantNumber = line.ndisParticipantNumber
      ? maskNdisNumber(line.ndisParticipantNumber)
      : "";
    return {
      participantNumber,
      participantName: line.participantName,
      supportItemCode: line.supportItemCode,
      supportDescription: line.supportDescription,
      serviceStartDate: formatDate(line.serviceStartDate),
      serviceEndDate: formatDate(line.serviceEndDate),
      quantity: String(line.quantity),
      unitPrice: formatMoney(line.unitPriceCents),
      totalAmount: formatMoney(line.totalAmountCents),
      claimReference: line.id,
    };
  });

  const header = [
    "ParticipantNumber",
    "ParticipantName",
    "SupportItemNumber",
    "SupportItemDescription",
    "ServiceStartDate",
    "ServiceEndDate",
    "Quantity",
    "UnitPrice",
    "TotalAmount",
    "ClaimReference",
  ];

  const csvLines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.participantNumber,
        r.participantName,
        r.supportItemCode,
        r.supportDescription,
        r.serviceStartDate,
        r.serviceEndDate,
        r.quantity,
        r.unitPrice,
        r.totalAmount,
        r.claimReference,
      ]
        .map(escapeCsv)
        .join(",")
    ),
  ];

  const csv = csvLines.join("\n");
  const exportedAt = new Date().toISOString();

  return {
    format: "ndia_bulk_payment_request_csv",
    providerRegistrationNumber: batch.providerOrg.ndisRegistrationNumber,
    batchReference: batch.batchReference ?? batch.id,
    exportedAt,
    lineCount: rows.length,
    rows,
    csv,
  };
}

export function checksumExport(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}
