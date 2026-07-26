import type { FundingSourceType } from "@prisma/client";

import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import {
  buildClaimFromBillingInvoice,
  buildClaimFromLegacyInvoice,
} from "@/lib/ndia-provider-claiming/build-claim";
import {
  isNdiaProviderClaimingEnabled,
  isNdiaProviderLiveSubmitAllowed,
  ndiaProviderClaimingConfig,
} from "@/lib/ndia-provider-claiming/config";
import { submitProviderClaimToNdia } from "@/lib/ndia-provider-claiming/ndia-api-client";
import type { NdiaProviderClaimPayload } from "@/lib/ndia-provider-claiming/types";
import {
  hasBlockingFindings,
  mapBillingFundingType,
  validateClaimPayload,
  validateFundingForProviderClaim,
} from "@/lib/ndia-provider-claiming/validate";
import { prisma } from "@/lib/prisma";

async function assertOrgAccess(user: CurrentUser, organisationId: string) {
  if (isAdminRole(user.primaryRole)) return;
  const orgIds = await getUserOrganisationIds(user.id);
  if (!orgIds.includes(organisationId)) {
    throw new Error("FORBIDDEN");
  }
}

async function writeClaimAudit(
  claimId: string,
  action: string,
  actorId: string,
  after?: unknown
) {
  await prisma.ndiaProviderClaimAudit.create({
    data: {
      claimId,
      action,
      actorId,
      after: after ? (after as object) : undefined,
    },
  });
}

export async function createProviderClaimDraft(params: {
  user: CurrentUser;
  organisationId: string;
  legacyInvoiceId?: string;
  billingInvoiceId?: string;
}) {
  if (!isNdiaProviderClaimingEnabled()) {
    throw new Error("NDIA_PROVIDER_CLAIMING_DISABLED");
  }

  await assertOrgAccess(params.user, params.organisationId);

  const built = params.legacyInvoiceId
    ? await buildClaimFromLegacyInvoice(
        params.legacyInvoiceId,
        params.organisationId
      )
    : params.billingInvoiceId
      ? await buildClaimFromBillingInvoice(
          params.billingInvoiceId,
          params.organisationId
        )
      : null;

  if (!built?.ok) {
    return { ok: false as const, error: built?.error ?? "Invalid input" };
  }

  const fundingType =
    built.fundingType === "ndis_plan_managed" ||
    built.fundingType === "ndis_self_managed"
      ? (built.fundingType as FundingSourceType)
      : built.fundingType
        ? mapBillingFundingType(
            built.fundingType as import("@prisma/client").BillingFundingSourceType
          )
        : undefined;

  const fundingFindings = validateFundingForProviderClaim(fundingType);
  const payloadFindings = await validateClaimPayload(
    built.payload,
    params.organisationId
  );
  const findings = [...fundingFindings, ...payloadFindings];

  const claim = await prisma.ndiaProviderClaim.create({
    data: {
      organisationId: params.organisationId,
      legacyInvoiceId: params.legacyInvoiceId,
      billingInvoiceId: params.billingInvoiceId,
      participantId: built.participantId,
      createdById: params.user.id,
      ndisRegistrationNumber: built.payload.provider.ndisRegistrationNumber,
      status: hasBlockingFindings(findings) ? "draft" : "validated",
      claimPayloadJson: built.payload as object,
      validationFindingsJson: findings as object[],
    },
  });

  await writeClaimAudit(claim.id, "draft_created", params.user.id, {
    status: claim.status,
    findingCount: findings.length,
  });

  await createAuditEvent({
    actorUserId: params.user.id,
    action: "ndia.provider_claim.draft",
    entityType: "NdiaProviderClaim",
    entityId: claim.id,
    participantId: built.participantId,
  });

  return {
    ok: true as const,
    claim,
    payload: built.payload,
    findings,
    liveSubmitAvailable: isNdiaProviderLiveSubmitAllowed(),
    adapterMode: ndiaProviderClaimingConfig.adapterMode,
  };
}

export async function validateProviderClaim(claimId: string, user: CurrentUser) {
  const claim = await prisma.ndiaProviderClaim.findUnique({
    where: { id: claimId },
  });
  if (!claim) throw new Error("NOT_FOUND");
  await assertOrgAccess(user, claim.organisationId);

  const payload = claim.claimPayloadJson as NdiaProviderClaimPayload;
  const findings = await validateClaimPayload(payload, claim.organisationId);
  const status = hasBlockingFindings(findings) ? "draft" : "validated";

  const updated = await prisma.ndiaProviderClaim.update({
    where: { id: claimId },
    data: { validationFindingsJson: findings, status },
  });

  await writeClaimAudit(claimId, "validated", user.id, { status, findings });

  return { claim: updated, findings, canSubmit: !hasBlockingFindings(findings) };
}

export async function dryRunProviderClaim(claimId: string, user: CurrentUser) {
  const { claim, findings, canSubmit } = await validateProviderClaim(
    claimId,
    user
  );
  if (!canSubmit) {
    return {
      claim,
      dryRun: { passed: false, findings },
      message: "Fix validation errors before dry run.",
    };
  }

  const updated = await prisma.ndiaProviderClaim.update({
    where: { id: claimId },
    data: { status: "dry_run_passed" },
  });

  await writeClaimAudit(claimId, "dry_run_passed", user.id);

  return {
    claim: updated,
    dryRun: { passed: true, findings },
    notSubmitted: true,
    message:
      "Dry run passed. Live NDIA submit requires NDIA_REAL_SUBMISSION_ENABLED and partner API credentials.",
  };
}

export async function submitProviderClaim(claimId: string, user: CurrentUser) {
  if (!isNdiaProviderClaimingEnabled()) {
    throw new Error("NDIA_PROVIDER_CLAIMING_DISABLED");
  }

  const claim = await prisma.ndiaProviderClaim.findUnique({
    where: { id: claimId },
  });
  if (!claim) throw new Error("NOT_FOUND");
  await assertOrgAccess(user, claim.organisationId);

  if (ndiaProviderClaimingConfig.requireHumanApproval) {
    const approval = await prisma.ndiaPilotApprovalRecord.findFirst({
      where: { approved: true },
      orderBy: { approvedAt: "desc" },
    });
    if (!isNdiaProviderLiveSubmitAllowed() && !approval) {
      throw new Error("GOVERNANCE_APPROVAL_REQUIRED");
    }
  }

  const { canSubmit } = await validateProviderClaim(claimId, user);
  if (!canSubmit) {
    throw new Error("CLAIM_VALIDATION_FAILED");
  }

  const payload = claim.claimPayloadJson as NdiaProviderClaimPayload;
  const result = await submitProviderClaimToNdia(payload);

  const updated = await prisma.ndiaProviderClaim.update({
    where: { id: claimId },
    data: {
      status: "submitted",
      externalClaimId: result.externalClaimId,
      externalStatus: result.externalStatus,
      submittedAt: new Date(),
    },
  });

  if (claim.legacyInvoiceId) {
    await prisma.invoice.update({
      where: { id: claim.legacyInvoiceId },
      data: { status: "xero_sync_pending" },
    });
  }
  if (claim.billingInvoiceId) {
    await prisma.billingInvoice.update({
      where: { id: claim.billingInvoiceId },
      data: { status: "pending_payment", planManagerExportStatus: "ndia_submitted" },
    });
  }

  await writeClaimAudit(claimId, "submitted", user.id, result);
  await createAuditEvent({
    actorUserId: user.id,
    action: "ndia.provider_claim.submitted",
    entityType: "NdiaProviderClaim",
    entityId: claimId,
    participantId: claim.participantId,
  });

  return {
    claim: updated,
    submitResult: result,
    disclaimer: isNdiaProviderLiveSubmitAllowed()
      ? "Submitted to NDIA partner API."
      : "Recorded as mock submission — not sent to NDIA.",
  };
}

export async function listProviderClaims(
  user: CurrentUser,
  organisationId: string
) {
  await assertOrgAccess(user, organisationId);
  return prisma.ndiaProviderClaim.findMany({
    where: { organisationId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
