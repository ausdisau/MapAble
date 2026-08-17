import type { NdisPriceImportStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase5Config } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";

export type PriceRow = {
  code: string;
  name: string;
  priceCapCents?: number;
  unitType?: string;
  category?: string;
};

export function validatePriceRows(rows: PriceRow[]) {
  const errors: { row: number; message: string }[] = [];
  const seen = new Set<string>();
  rows.forEach((row, i) => {
    if (!row.code?.trim()) errors.push({ row: i + 1, message: "Missing code" });
    if (seen.has(row.code)) errors.push({ row: i + 1, message: "Duplicate code" });
    seen.add(row.code);
    if (row.priceCapCents != null && row.priceCapCents < 0) {
      errors.push({ row: i + 1, message: "Negative price" });
    }
  });
  return errors;
}

export async function createImportJob(
  rows: PriceRow[],
  createdById: string,
  fileName?: string
) {
  if (!phase5Config.ndisPricingImportEnabled) {
    throw new Error("PRICING_IMPORT_DISABLED");
  }

  const validationErrors = validatePriceRows(rows);
  const job = await prisma.ndisPriceImportJob.create({
    data: {
      status: validationErrors.length ? "failed" : "parsed",
      fileName,
      rowCount: rows.length,
      createdById,
    },
  });

  for (let i = 0; i < rows.length; i++) {
    const rowErrors = validationErrors.filter((e) => e.row === i + 1);
    await prisma.ndisPriceImportRow.create({
      data: {
        jobId: job.id,
        rowNumber: i + 1,
        rawJson: rows[i],
        valid: rowErrors.length === 0,
        errors: rowErrors.map((e) => e.message).join("; ") || null,
      },
    });
  }

  await createAuditEvent({
    actorUserId: createdById,
    action: "ndis_pricing.import_uploaded",
    entityType: "NdisPriceImportJob",
    entityId: job.id,
  });

  return { job, validationErrors };
}

export async function validateImportJob(jobId: string, actorUserId: string) {
  const invalid = await prisma.ndisPriceImportRow.count({
    where: { jobId, valid: false },
  });
  const status: NdisPriceImportStatus =
    invalid > 0 ? "review_required" : "validated";
  const job = await prisma.ndisPriceImportJob.update({
    where: { id: jobId },
    data: { status },
  });
  await createAuditEvent({
    actorUserId,
    action: "ndis_pricing.import_validated",
    entityType: "NdisPriceImportJob",
    entityId: jobId,
  });
  return job;
}

export async function applyImportJob(jobId: string, actorUserId: string) {
  const job = await prisma.ndisPriceImportJob.findUnique({
    where: { id: jobId },
    include: { rows: { where: { valid: true } } },
  });
  if (!job || job.status !== "validated" && job.status !== "approved") {
    throw new Error("INVALID_JOB_STATE");
  }

  const catalogue = await prisma.ndisPriceCatalogue.create({
    data: { name: `Import ${job.fileName ?? jobId}`, sourceLabel: "manual_csv" },
  });
  const version = await prisma.ndisPriceCatalogueVersion.create({
    data: {
      catalogueId: catalogue.id,
      version: `v-${Date.now()}`,
      appliedAt: new Date(),
    },
  });

  for (const row of job.rows) {
    const raw = row.rawJson as PriceRow;
    const item = await prisma.ndisSupportItem.upsert({
      where: { code: raw.code },
      create: {
        code: raw.code,
        name: raw.name,
        categoryLabel: raw.category,
        unitType: raw.unitType ?? "hour",
        priceCapCents: raw.priceCapCents,
        active: true,
        effectiveFrom: new Date(),
      },
      update: {
        name: raw.name,
        priceCapCents: raw.priceCapCents,
        active: true,
      },
    });

    if (raw.priceCapCents != null) {
      await prisma.ndisSupportItemPrice.create({
        data: {
          versionId: version.id,
          supportItemId: item.id,
          priceCapCents: raw.priceCapCents,
          unitType: raw.unitType ?? "hour",
          effectiveFrom: new Date(),
        },
      });
      await prisma.ndisPriceChange.create({
        data: {
          changeType: "updated_price",
          supportItemCode: raw.code,
          message: `Price updated to ${raw.priceCapCents} cents — requires human review on invoices.`,
          appliedAt: new Date(),
        },
      });
    }
  }

  await prisma.ndisPriceImportJob.update({
    where: { id: jobId },
    data: { status: "applied", versionId: version.id },
  });

  await createAuditEvent({
    actorUserId,
    action: "ndis_pricing.import_applied",
    entityType: "NdisPriceImportJob",
    entityId: jobId,
  });

  return { catalogue, version };
}

export async function checkInvoiceLinePriceWarning(
  supportItemCode: string | null | undefined,
  unitAmountCents: number
) {
  if (!supportItemCode) return null;
  const price = await prisma.ndisSupportItemPrice.findFirst({
    where: { supportItem: { code: supportItemCode } },
    orderBy: { effectiveFrom: "desc" },
  });
  if (!price) return null;
  if (unitAmountCents > price.priceCapCents) {
    return {
      warningType: "price_exceeds_catalogue_cap",
      message: `Line amount exceeds configured catalogue cap for ${supportItemCode} — requires human review.`,
    };
  }
  return null;
}
