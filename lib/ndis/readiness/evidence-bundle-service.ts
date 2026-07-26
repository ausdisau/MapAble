import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase5Config } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";

export async function buildEvidenceBundleFromInvoice(
  invoiceId: string,
  actorUserId: string
) {
  if (!phase5Config.ndiaReadinessEnabled) {
    throw new Error("NDIA_READINESS_DISABLED");
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lines: true,
      booking: true,
    },
  });
  if (!invoice) throw new Error("NOT_FOUND");

  const timesheets = await prisma.timesheet.findMany({
    where: { participantId: invoice.participantId, status: "approved" },
    take: 5,
  });

  const suggestions = await prisma.ndisLineItemSuggestion.findMany({
    where: { sourceType: "invoice", sourceId: invoiceId },
  });

  const attestations = await prisma.attestation.findMany({
    where: { participantId: invoice.participantId },
    take: 20,
    select: { id: true, type: true, claim: true, createdAt: true },
  });

  const references = {
    invoiceId,
    lineCount: invoice.lines.length,
    bookingId: invoice.bookingId,
    timesheetIds: timesheets.map((t) => t.id),
    suggestionIds: suggestions.map((s) => s.id),
    attestationIds: attestations.map((a) => a.id),
    disclaimer:
      "Evidence bundle for review only — not submitted to NDIA or PACE.",
  };

  const bundle = await prisma.ndiaClaimEvidenceBundle.create({
    data: {
      invoiceId,
      referencesJson: references,
      status: "draft",
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "ndia.bundle_created",
    entityType: "NdiaClaimEvidenceBundle",
    entityId: bundle.id,
    participantId: invoice.participantId,
  });

  return bundle;
}

export async function runNdiaDryRun(bundleId: string, actorUserId: string) {
  if (phase5Config.ndiaRealSubmissionEnabled) {
    throw new Error("REAL_SUBMISSION_DISABLED_IN_PHASE_5");
  }

  const bundle = await prisma.ndiaClaimEvidenceBundle.findUnique({
    where: { id: bundleId },
  });
  if (!bundle) throw new Error("NOT_FOUND");

  const refs = bundle.referencesJson as Record<string, unknown>;
  const findings: string[] = [];
  if (!refs.timesheetIds || (refs.timesheetIds as string[]).length === 0) {
    findings.push("No approved timesheet references linked");
  }
  if (!refs.suggestionIds || (refs.suggestionIds as string[]).length === 0) {
    findings.push("No NDIS line item suggestions on file — human review recommended");
  }

  const dryRun = await prisma.ndiaSubmissionDryRun.create({
    data: {
      bundleId,
      result: findings.length ? "review_required" : "passed_placeholder",
      findingsJson: findings,
    },
  });

  await prisma.ndiaIntegrationAudit.create({
    data: {
      bundleId,
      action: "dry_run",
      actorId: actorUserId,
    },
  });

  return {
    dryRun,
    notSubmitted: true,
    message: "Not submitted to NDIA — dry run validation only.",
  };
}

export async function exportEvidenceBundle(bundleId: string, actorUserId: string) {
  const bundle = await prisma.ndiaClaimEvidenceBundle.findUnique({
    where: { id: bundleId },
  });
  if (!bundle) throw new Error("NOT_FOUND");

  await prisma.ndiaIntegrationAudit.create({
    data: { bundleId, action: "export", actorId: actorUserId },
  });

  await createAuditEvent({
    actorUserId,
    action: "ndia.bundle_exported",
    entityType: "NdiaClaimEvidenceBundle",
    entityId: bundleId,
  });

  return {
    bundleId,
    exportFormat: "json",
    payload: bundle.referencesJson,
    disclaimer: "Manual export only — not submitted to NDIA.",
  };
}
