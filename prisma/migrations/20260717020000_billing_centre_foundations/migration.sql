-- CreateEnum
CREATE TYPE "BillingServiceRecordStatus" AS ENUM ('open', 'evidence_pending', 'locked', 'charged', 'invoiced', 'cancelled');

-- CreateEnum
CREATE TYPE "BillingServiceRecordSourceType" AS ENUM ('care_shift', 'timesheet', 'transport_trip', 'employment_session', 'foods_order', 'marketplace_transaction', 'subscription_period', 'cancellation', 'travel_cost', 'non_labour_cost', 'other');

-- CreateEnum
CREATE TYPE "BillingEvidenceStatus" AS ENUM ('missing', 'submitted', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "PricingPolicyStatus" AS ENUM ('draft', 'verified', 'active', 'superseded', 'retired');

-- CreateEnum
CREATE TYPE "BillingApprovalType" AS ENUM ('participant', 'provider', 'mapable_finance');

-- CreateEnum
CREATE TYPE "BillingApprovalDecision" AS ENUM ('pending', 'approved', 'rejected', 'changes_requested');

-- CreateEnum
CREATE TYPE "BillingDisputeStatus" AS ENUM ('open', 'awaiting_evidence', 'under_review', 'resolved_credit', 'resolved_upheld', 'resolved_partial', 'withdrawn', 'escalated');

-- CreateEnum
CREATE TYPE "BillingCreditNoteStatus" AS ENUM ('draft', 'issued', 'applied', 'void');

-- CreateEnum
CREATE TYPE "BillingCentreClaimGateway" AS ENUM ('mock', 'csv_export', 'plan_manager', 'official_disabled');

-- CreateEnum
CREATE TYPE "BillingCentrePayoutState" AS ENUM ('calculated', 'review_required', 'approved', 'scheduled', 'processing', 'paid', 'failed', 'held', 'cancelled');

-- CreateEnum
CREATE TYPE "BillingReconciliationMatchStatus" AS ENUM ('suggested', 'confirmed', 'rejected', 'unmatched');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BillingFundingSourceType" ADD VALUE 'ndis_agency_managed';
ALTER TYPE "BillingFundingSourceType" ADD VALUE 'private_pay';
ALTER TYPE "BillingFundingSourceType" ADD VALUE 'employer_funded';
ALTER TYPE "BillingFundingSourceType" ADD VALUE 'insurance';
ALTER TYPE "BillingFundingSourceType" ADD VALUE 'home_care_package';
ALTER TYPE "BillingFundingSourceType" ADD VALUE 'grant_funded';
ALTER TYPE "BillingFundingSourceType" ADD VALUE 'mixed';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BillingServiceType" ADD VALUE 'foods';
ALTER TYPE "BillingServiceType" ADD VALUE 'moves';
ALTER TYPE "BillingServiceType" ADD VALUE 'academy';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BillingInvoiceStatus" ADD VALUE 'evidence_required';
ALTER TYPE "BillingInvoiceStatus" ADD VALUE 'policy_review_required';
ALTER TYPE "BillingInvoiceStatus" ADD VALUE 'participant_review';
ALTER TYPE "BillingInvoiceStatus" ADD VALUE 'provider_review';
ALTER TYPE "BillingInvoiceStatus" ADD VALUE 'approved';
ALTER TYPE "BillingInvoiceStatus" ADD VALUE 'ready_to_issue';
ALTER TYPE "BillingInvoiceStatus" ADD VALUE 'sent';
ALTER TYPE "BillingInvoiceStatus" ADD VALUE 'partially_paid';
ALTER TYPE "BillingInvoiceStatus" ADD VALUE 'overdue';
ALTER TYPE "BillingInvoiceStatus" ADD VALUE 'disputed';
ALTER TYPE "BillingInvoiceStatus" ADD VALUE 'on_hold';
ALTER TYPE "BillingInvoiceStatus" ADD VALUE 'credited';
ALTER TYPE "BillingInvoiceStatus" ADD VALUE 'void';
ALTER TYPE "BillingInvoiceStatus" ADD VALUE 'written_off';

-- AlterTable
ALTER TABLE "BillingInvoice" ADD COLUMN     "amountPaidCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "coPaymentCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "creditCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discountCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "draftVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "issuedAt" TIMESTAMP(3),
ADD COLUMN     "notesForBilling" TEXT,
ADD COLUMN     "participantDisplayRef" TEXT,
ADD COLUMN     "planManagerRef" TEXT,
ADD COLUMN     "policyVersionId" TEXT,
ADD COLUMN     "purchaseOrderRef" TEXT,
ADD COLUMN     "servicePeriodEnd" TIMESTAMP(3),
ADD COLUMN     "servicePeriodStart" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "BillingInvoiceLineItem" ADD COLUMN     "coPaymentCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "evidenceStatus" "BillingEvidenceStatus" NOT NULL DEFAULT 'missing',
ADD COLUMN     "fundedCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gstCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "locationCategory" TEXT,
ADD COLUMN     "policyVersionId" TEXT,
ADD COLUMN     "privateCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "serviceDate" TIMESTAMP(3),
ADD COLUMN     "serviceRecordId" TEXT,
ADD COLUMN     "travelClassification" TEXT,
ADD COLUMN     "unit" TEXT,
ADD COLUMN     "validationStatus" TEXT;

-- CreateTable
CREATE TABLE "PricingPolicy" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "name" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL DEFAULT 'AU',
    "sourceUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingPolicyVersion" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "status" "PricingPolicyStatus" NOT NULL DEFAULT 'draft',
    "verificationDate" TIMESTAMP(3),
    "verifiedByUserId" TEXT,
    "sourceUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingPolicyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRule" (
    "id" TEXT NOT NULL,
    "policyVersionId" TEXT NOT NULL,
    "supportCategory" TEXT,
    "supportItemNumber" TEXT NOT NULL,
    "supportItemName" TEXT NOT NULL,
    "registrationGroup" TEXT,
    "unit" TEXT NOT NULL,
    "weekdayOrTimeBand" TEXT,
    "remoteLoading" TEXT,
    "providerType" TEXT,
    "priceCapCents" INTEGER NOT NULL,
    "gstTreatment" TEXT NOT NULL DEFAULT 'input_taxed',
    "cancellationRules" JSONB,
    "travelRules" JSONB,
    "nonLabourRules" JSONB,
    "requiredEvidence" JSONB,
    "status" "PricingPolicyStatus" NOT NULL DEFAULT 'verified',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingServiceRecord" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "participantId" TEXT NOT NULL,
    "sourceType" "BillingServiceRecordSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "serviceType" "BillingServiceType" NOT NULL,
    "status" "BillingServiceRecordStatus" NOT NULL DEFAULT 'open',
    "serviceStart" TIMESTAMP(3) NOT NULL,
    "serviceEnd" TIMESTAMP(3),
    "quantity" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'hour',
    "supportItemCode" TEXT,
    "workerOrProviderId" TEXT,
    "fundingSourceType" "BillingFundingSourceType",
    "estimatedCents" INTEGER NOT NULL DEFAULT 0,
    "lockedAt" TIMESTAMP(3),
    "lockedByUserId" TEXT,
    "invoiceId" TEXT,
    "chargeSnapshot" JSONB,
    "anomalyFlags" JSONB,
    "notesForBilling" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingServiceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingServiceEvidence" (
    "id" TEXT NOT NULL,
    "serviceRecordId" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "status" "BillingEvidenceStatus" NOT NULL DEFAULT 'submitted',
    "referenceId" TEXT,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingServiceEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingInvoiceTransition" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT,
    "priorState" "BillingInvoiceStatus" NOT NULL,
    "newState" "BillingInvoiceStatus" NOT NULL,
    "reason" TEXT,
    "evidenceIds" JSONB,
    "ipAddress" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingInvoiceTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingInvoiceApproval" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "approvalType" "BillingApprovalType" NOT NULL,
    "decision" "BillingApprovalDecision" NOT NULL DEFAULT 'pending',
    "actorId" TEXT,
    "actorRole" TEXT,
    "reason" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingInvoiceApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingInvoiceDelivery" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT,
    "status" TEXT NOT NULL,
    "externalId" TEXT,
    "payload" JSONB,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingInvoiceDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingCreditNote" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "creditNoteNumber" TEXT,
    "status" "BillingCreditNoteStatus" NOT NULL DEFAULT 'draft',
    "amountCents" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "lineItemIds" JSONB,
    "issuedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingCreditNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingDispute" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" "BillingDisputeStatus" NOT NULL DEFAULT 'open',
    "scope" TEXT NOT NULL DEFAULT 'invoice',
    "lineItemIds" JSONB,
    "summary" TEXT NOT NULL,
    "preferredContact" TEXT,
    "outcomeReason" TEXT,
    "amountOnHoldCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "BillingDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingDisputeMessage" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingDisputeMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingClaimBatch" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "gateway" "BillingCentreClaimGateway" NOT NULL DEFAULT 'mock',
    "status" TEXT NOT NULL DEFAULT 'NOT_READY',
    "externalReference" TEXT,
    "simulated" BOOLEAN NOT NULL DEFAULT true,
    "validationJson" JSONB,
    "exportChecksum" TEXT,
    "createdById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingClaimBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingClaimItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "ndisClaimLineId" TEXT,
    "supportItemCode" TEXT,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_READY',
    "rejectionCode" TEXT,
    "rejectionMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingClaimItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingCentreProviderPayout" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "status" "BillingCentrePayoutState" NOT NULL DEFAULT 'calculated',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "grossCents" INTEGER NOT NULL DEFAULT 0,
    "commissionCents" INTEGER NOT NULL DEFAULT 0,
    "adjustmentsCents" INTEGER NOT NULL DEFAULT 0,
    "withheldCents" INTEGER NOT NULL DEFAULT 0,
    "netPayableCents" INTEGER NOT NULL DEFAULT 0,
    "remittanceJson" JSONB,
    "destinationRef" TEXT,
    "approvedById" TEXT,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingCentreProviderPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingReconciliationSession" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "notes" TEXT,
    "createdById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingReconciliationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingReconciliationMatch" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "externalPaymentRef" TEXT,
    "amountCents" INTEGER NOT NULL,
    "confidenceBps" INTEGER NOT NULL DEFAULT 0,
    "reasons" JSONB,
    "status" "BillingReconciliationMatchStatus" NOT NULL DEFAULT 'suggested',
    "notes" TEXT,
    "confirmedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingReconciliationMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingIntegrationConnection" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "externalTenantId" TEXT,
    "configJson" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingIntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingInvoiceNumberSequence" (
    "id" TEXT NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT 'MAP',
    "year" INTEGER NOT NULL,
    "lastValue" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingInvoiceNumberSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingSafeguardAlert" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'review_required',
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingSafeguardAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PricingPolicy_organisationId_idx" ON "PricingPolicy"("organisationId");

-- CreateIndex
CREATE INDEX "PricingPolicy_jurisdiction_idx" ON "PricingPolicy"("jurisdiction");

-- CreateIndex
CREATE INDEX "PricingPolicyVersion_status_effectiveFrom_idx" ON "PricingPolicyVersion"("status", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "PricingPolicyVersion_policyId_version_key" ON "PricingPolicyVersion"("policyId", "version");

-- CreateIndex
CREATE INDEX "PricingRule_policyVersionId_idx" ON "PricingRule"("policyVersionId");

-- CreateIndex
CREATE INDEX "PricingRule_supportItemNumber_idx" ON "PricingRule"("supportItemNumber");

-- CreateIndex
CREATE INDEX "PricingRule_supportItemNumber_weekdayOrTimeBand_idx" ON "PricingRule"("supportItemNumber", "weekdayOrTimeBand");

-- CreateIndex
CREATE INDEX "BillingServiceRecord_participantId_status_idx" ON "BillingServiceRecord"("participantId", "status");

-- CreateIndex
CREATE INDEX "BillingServiceRecord_organisationId_status_idx" ON "BillingServiceRecord"("organisationId", "status");

-- CreateIndex
CREATE INDEX "BillingServiceRecord_invoiceId_idx" ON "BillingServiceRecord"("invoiceId");

-- CreateIndex
CREATE INDEX "BillingServiceRecord_status_serviceStart_idx" ON "BillingServiceRecord"("status", "serviceStart");

-- CreateIndex
CREATE UNIQUE INDEX "BillingServiceRecord_sourceType_sourceId_key" ON "BillingServiceRecord"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "BillingServiceEvidence_serviceRecordId_idx" ON "BillingServiceEvidence"("serviceRecordId");

-- CreateIndex
CREATE INDEX "BillingInvoiceTransition_invoiceId_createdAt_idx" ON "BillingInvoiceTransition"("invoiceId", "createdAt");

-- CreateIndex
CREATE INDEX "BillingInvoiceApproval_invoiceId_idx" ON "BillingInvoiceApproval"("invoiceId");

-- CreateIndex
CREATE INDEX "BillingInvoiceApproval_decision_idx" ON "BillingInvoiceApproval"("decision");

-- CreateIndex
CREATE INDEX "BillingInvoiceDelivery_invoiceId_idx" ON "BillingInvoiceDelivery"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingCreditNote_creditNoteNumber_key" ON "BillingCreditNote"("creditNoteNumber");

-- CreateIndex
CREATE INDEX "BillingCreditNote_invoiceId_idx" ON "BillingCreditNote"("invoiceId");

-- CreateIndex
CREATE INDEX "BillingCreditNote_status_idx" ON "BillingCreditNote"("status");

-- CreateIndex
CREATE INDEX "BillingDispute_invoiceId_idx" ON "BillingDispute"("invoiceId");

-- CreateIndex
CREATE INDEX "BillingDispute_participantId_status_idx" ON "BillingDispute"("participantId", "status");

-- CreateIndex
CREATE INDEX "BillingDisputeMessage_disputeId_createdAt_idx" ON "BillingDisputeMessage"("disputeId", "createdAt");

-- CreateIndex
CREATE INDEX "BillingClaimBatch_organisationId_status_idx" ON "BillingClaimBatch"("organisationId", "status");

-- CreateIndex
CREATE INDEX "BillingClaimBatch_externalReference_idx" ON "BillingClaimBatch"("externalReference");

-- CreateIndex
CREATE INDEX "BillingClaimItem_batchId_idx" ON "BillingClaimItem"("batchId");

-- CreateIndex
CREATE INDEX "BillingClaimItem_invoiceId_idx" ON "BillingClaimItem"("invoiceId");

-- CreateIndex
CREATE INDEX "BillingCentreProviderPayout_organisationId_status_idx" ON "BillingCentreProviderPayout"("organisationId", "status");

-- CreateIndex
CREATE INDEX "BillingCentreProviderPayout_periodEnd_idx" ON "BillingCentreProviderPayout"("periodEnd");

-- CreateIndex
CREATE INDEX "BillingReconciliationSession_organisationId_status_idx" ON "BillingReconciliationSession"("organisationId", "status");

-- CreateIndex
CREATE INDEX "BillingReconciliationMatch_sessionId_idx" ON "BillingReconciliationMatch"("sessionId");

-- CreateIndex
CREATE INDEX "BillingReconciliationMatch_invoiceId_idx" ON "BillingReconciliationMatch"("invoiceId");

-- CreateIndex
CREATE INDEX "BillingReconciliationMatch_status_idx" ON "BillingReconciliationMatch"("status");

-- CreateIndex
CREATE INDEX "BillingIntegrationConnection_organisationId_provider_idx" ON "BillingIntegrationConnection"("organisationId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "BillingIntegrationConnection_organisationId_provider_key" ON "BillingIntegrationConnection"("organisationId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "BillingInvoiceNumberSequence_prefix_year_key" ON "BillingInvoiceNumberSequence"("prefix", "year");

-- CreateIndex
CREATE INDEX "BillingSafeguardAlert_entityType_entityId_idx" ON "BillingSafeguardAlert"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "BillingSafeguardAlert_ruleCode_createdAt_idx" ON "BillingSafeguardAlert"("ruleCode", "createdAt");

-- CreateIndex
CREATE INDEX "BillingSafeguardAlert_resolvedAt_idx" ON "BillingSafeguardAlert"("resolvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BillingInvoice_invoiceNumber_key" ON "BillingInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "BillingInvoice_status_dueAt_idx" ON "BillingInvoice"("status", "dueAt");

-- CreateIndex
CREATE INDEX "BillingInvoice_providerId_status_idx" ON "BillingInvoice"("providerId", "status");

-- CreateIndex
CREATE INDEX "BillingInvoiceLineItem_serviceRecordId_idx" ON "BillingInvoiceLineItem"("serviceRecordId");

-- CreateIndex
CREATE INDEX "BillingInvoiceLineItem_policyVersionId_idx" ON "BillingInvoiceLineItem"("policyVersionId");

-- AddForeignKey
ALTER TABLE "BillingInvoiceLineItem" ADD CONSTRAINT "BillingInvoiceLineItem_serviceRecordId_fkey" FOREIGN KEY ("serviceRecordId") REFERENCES "BillingServiceRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingPolicy" ADD CONSTRAINT "PricingPolicy_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingPolicyVersion" ADD CONSTRAINT "PricingPolicyVersion_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "PricingPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "PricingPolicyVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingServiceRecord" ADD CONSTRAINT "BillingServiceRecord_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingServiceRecord" ADD CONSTRAINT "BillingServiceRecord_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingServiceRecord" ADD CONSTRAINT "BillingServiceRecord_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "BillingInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingServiceEvidence" ADD CONSTRAINT "BillingServiceEvidence_serviceRecordId_fkey" FOREIGN KEY ("serviceRecordId") REFERENCES "BillingServiceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingInvoiceTransition" ADD CONSTRAINT "BillingInvoiceTransition_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "BillingInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingInvoiceApproval" ADD CONSTRAINT "BillingInvoiceApproval_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "BillingInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingInvoiceDelivery" ADD CONSTRAINT "BillingInvoiceDelivery_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "BillingInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCreditNote" ADD CONSTRAINT "BillingCreditNote_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "BillingInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingDispute" ADD CONSTRAINT "BillingDispute_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "BillingInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingDispute" ADD CONSTRAINT "BillingDispute_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingDisputeMessage" ADD CONSTRAINT "BillingDisputeMessage_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "BillingDispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingDisputeMessage" ADD CONSTRAINT "BillingDisputeMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingClaimBatch" ADD CONSTRAINT "BillingClaimBatch_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingClaimItem" ADD CONSTRAINT "BillingClaimItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "BillingClaimBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingClaimItem" ADD CONSTRAINT "BillingClaimItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "BillingInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCentreProviderPayout" ADD CONSTRAINT "BillingCentreProviderPayout_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingReconciliationSession" ADD CONSTRAINT "BillingReconciliationSession_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingReconciliationMatch" ADD CONSTRAINT "BillingReconciliationMatch_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "BillingReconciliationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingReconciliationMatch" ADD CONSTRAINT "BillingReconciliationMatch_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "BillingInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingIntegrationConnection" ADD CONSTRAINT "BillingIntegrationConnection_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

