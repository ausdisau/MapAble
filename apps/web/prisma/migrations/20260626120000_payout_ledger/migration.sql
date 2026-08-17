-- MapAble Stripe Connect payout ledger

-- CreateEnum
CREATE TYPE "BillingPayoutStatus" AS ENUM ('none', 'paid_pending_service', 'service_completed', 'payout_pending', 'partially_paid_out', 'paid_out');
CREATE TYPE "BillingPayerType" AS ENUM ('participant', 'plan_manager', 'provider_org', 'employer', 'private', 'other');
CREATE TYPE "BillingInvoiceLineType" AS ENUM ('worker_service', 'provider_service', 'transport', 'platform_fee', 'cancellation_fee', 'reimbursement', 'adjustment', 'refund', 'other');
CREATE TYPE "PayoutRecipientType" AS ENUM ('support_worker', 'provider_org', 'transport_operator', 'mapable_platform', 'other');
CREATE TYPE "StripeAccountApiVersion" AS ENUM ('accounts_v1', 'accounts_v2', 'unknown');
CREATE TYPE "StripeDashboardType" AS ENUM ('express', 'full', 'none', 'unknown');
CREATE TYPE "StripeOnboardingStatus" AS ENUM ('not_started', 'pending', 'restricted', 'enabled', 'rejected', 'disabled');
CREATE TYPE "PayoutSchedule" AS ENUM ('automatic', 'manual', 'unknown');
CREATE TYPE "PayoutRecipientVerificationStatus" AS ENUM ('unverified', 'pending', 'verified', 'action_required', 'rejected');
CREATE TYPE "PayoutBatchStatus" AS ENUM ('draft', 'review_required', 'approved', 'processing', 'completed', 'partially_failed', 'failed', 'canceled');
CREATE TYPE "PayoutTransferStatus" AS ENUM ('pending', 'created', 'failed', 'reversed');
CREATE TYPE "PayoutBlockReason" AS ENUM ('dispute', 'refund', 'complaint', 'safeguarding', 'recipient_restricted', 'insufficient_funds', 'admin_hold', 'other');
CREATE TYPE "PayoutBlockSeverity" AS ENUM ('info', 'warning', 'critical');
CREATE TYPE "PayoutBlockStatus" AS ENUM ('active', 'resolved', 'canceled');
CREATE TYPE "AccountingExportStatus" AS ENUM ('pending', 'exported', 'failed', 'skipped');
CREATE TYPE "AccountingExternalSystem" AS ENUM ('xero', 'csv', 'other');

-- AlterEnum (IF NOT EXISTS: empty-DB bootstrap may already include these labels)
ALTER TYPE "BillingAccountRole" ADD VALUE IF NOT EXISTS 'support_worker';
ALTER TYPE "BillingAccountRole" ADD VALUE IF NOT EXISTS 'transport_operator';
ALTER TYPE "BillingPaymentMethod" ADD VALUE IF NOT EXISTS 'external_received';
ALTER TYPE "BillingPaymentSplitStatus" ADD VALUE IF NOT EXISTS 'pending_service';
ALTER TYPE "BillingPaymentSplitStatus" ADD VALUE IF NOT EXISTS 'ready';
ALTER TYPE "BillingPaymentSplitStatus" ADD VALUE IF NOT EXISTS 'blocked';
ALTER TYPE "BillingPaymentSplitStatus" ADD VALUE IF NOT EXISTS 'transfer_created';
ALTER TYPE "BillingPaymentSplitStatus" ADD VALUE IF NOT EXISTS 'canceled';

-- AlterTable BillingInvoice
ALTER TABLE "BillingInvoice" ADD COLUMN "transferGroup" TEXT,
ADD COLUMN "payerType" "BillingPayerType",
ADD COLUMN "fundingSourceType" "BillingFundingSourceType",
ADD COLUMN "invoiceNumber" TEXT,
ADD COLUMN "payoutStatus" "BillingPayoutStatus" NOT NULL DEFAULT 'none',
ADD COLUMN "xeroInvoiceId" TEXT;

CREATE INDEX "BillingInvoice_transferGroup_idx" ON "BillingInvoice"("transferGroup");
CREATE INDEX "BillingInvoice_invoiceNumber_idx" ON "BillingInvoice"("invoiceNumber");

-- AlterTable BillingInvoiceLineItem
ALTER TABLE "BillingInvoiceLineItem" ADD COLUMN "lineType" "BillingInvoiceLineType",
ADD COLUMN "recipientId" TEXT,
ADD COLUMN "serviceCategory" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "BillingInvoiceLineItem_recipientId_idx" ON "BillingInvoiceLineItem"("recipientId");

-- AlterTable BillingPayment
ALTER TABLE "BillingPayment" ADD COLUMN "transferGroup" TEXT,
ADD COLUMN "netDistributableCents" INTEGER,
ADD COLUMN "externalPaymentMarkedAt" TIMESTAMP(3),
ADD COLUMN "payoutStatus" "BillingPayoutStatus" NOT NULL DEFAULT 'none';

CREATE INDEX "BillingPayment_transferGroup_idx" ON "BillingPayment"("transferGroup");
CREATE INDEX "BillingPayment_stripePaymentIntentId_idx" ON "BillingPayment"("stripePaymentIntentId");

-- AlterTable BillingPaymentSplit
ALTER TABLE "BillingPaymentSplit" ADD COLUMN "payoutRecipientId" TEXT,
ADD COLUMN "grossShareCents" INTEGER,
ADD COLUMN "platformFeeCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "adjustmentsCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "reserveCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "netTransferCents" INTEGER,
ADD COLUMN "blockReason" TEXT,
ADD COLUMN "idempotencyKey" TEXT;

ALTER TABLE "BillingPaymentSplit" ALTER COLUMN "status" SET DEFAULT 'pending_service';

CREATE UNIQUE INDEX "BillingPaymentSplit_idempotencyKey_key" ON "BillingPaymentSplit"("idempotencyKey");
CREATE INDEX "BillingPaymentSplit_recipientId_idx" ON "BillingPaymentSplit"("recipientId");
CREATE INDEX "BillingPaymentSplit_payoutRecipientId_idx" ON "BillingPaymentSplit"("payoutRecipientId");
CREATE INDEX "BillingPaymentSplit_transferId_idx" ON "BillingPaymentSplit"("transferId");
CREATE INDEX "BillingPaymentSplit_status_idx" ON "BillingPaymentSplit"("status");

-- CreateTable PayoutRecipient
CREATE TABLE "PayoutRecipient" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "providerOrgId" TEXT,
    "workerId" TEXT,
    "recipientType" "PayoutRecipientType" NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "stripeAccountId" TEXT,
    "stripeAccountApiVersion" "StripeAccountApiVersion" NOT NULL DEFAULT 'unknown',
    "stripeDashboardType" "StripeDashboardType" NOT NULL DEFAULT 'unknown',
    "stripeOnboardingStatus" "StripeOnboardingStatus" NOT NULL DEFAULT 'not_started',
    "chargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "transfersEnabled" BOOLEAN NOT NULL DEFAULT false,
    "requirementsDue" JSONB NOT NULL DEFAULT '[]',
    "defaultCurrency" TEXT NOT NULL DEFAULT 'AUD',
    "country" TEXT NOT NULL DEFAULT 'AU',
    "payoutSchedule" "PayoutSchedule" NOT NULL DEFAULT 'unknown',
    "verificationStatus" "PayoutRecipientVerificationStatus" NOT NULL DEFAULT 'unverified',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutRecipient_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PayoutRecipient_stripeAccountId_key" ON "PayoutRecipient"("stripeAccountId");
CREATE INDEX "PayoutRecipient_userId_idx" ON "PayoutRecipient"("userId");
CREATE INDEX "PayoutRecipient_providerOrgId_idx" ON "PayoutRecipient"("providerOrgId");
CREATE INDEX "PayoutRecipient_workerId_idx" ON "PayoutRecipient"("workerId");
CREATE INDEX "PayoutRecipient_stripeAccountId_idx" ON "PayoutRecipient"("stripeAccountId");
CREATE INDEX "PayoutRecipient_recipientType_idx" ON "PayoutRecipient"("recipientType");

-- CreateTable PayoutBatch
CREATE TABLE "PayoutBatch" (
    "id" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "status" "PayoutBatchStatus" NOT NULL DEFAULT 'draft',
    "totalGrossCents" INTEGER NOT NULL DEFAULT 0,
    "totalNetTransferCents" INTEGER NOT NULL DEFAULT 0,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutBatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PayoutBatch_batchNumber_key" ON "PayoutBatch"("batchNumber");
CREATE INDEX "PayoutBatch_status_idx" ON "PayoutBatch"("status");
CREATE INDEX "PayoutBatch_createdAt_idx" ON "PayoutBatch"("createdAt");

-- CreateTable PayoutTransfer
CREATE TABLE "PayoutTransfer" (
    "id" TEXT NOT NULL,
    "payoutSplitId" TEXT NOT NULL,
    "payoutBatchId" TEXT,
    "recipientId" TEXT NOT NULL,
    "stripeTransferId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "status" "PayoutTransferStatus" NOT NULL DEFAULT 'pending',
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "transferGroup" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutTransfer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PayoutTransfer_stripeTransferId_key" ON "PayoutTransfer"("stripeTransferId");
CREATE UNIQUE INDEX "PayoutTransfer_idempotencyKey_key" ON "PayoutTransfer"("idempotencyKey");
CREATE INDEX "PayoutTransfer_payoutSplitId_idx" ON "PayoutTransfer"("payoutSplitId");
CREATE INDEX "PayoutTransfer_payoutBatchId_idx" ON "PayoutTransfer"("payoutBatchId");
CREATE INDEX "PayoutTransfer_recipientId_idx" ON "PayoutTransfer"("recipientId");
CREATE INDEX "PayoutTransfer_transferGroup_idx" ON "PayoutTransfer"("transferGroup");
CREATE INDEX "PayoutTransfer_status_idx" ON "PayoutTransfer"("status");

-- CreateTable PayoutBlock
CREATE TABLE "PayoutBlock" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "payoutSplitId" TEXT,
    "reason" "PayoutBlockReason" NOT NULL,
    "severity" "PayoutBlockSeverity" NOT NULL DEFAULT 'warning',
    "status" "PayoutBlockStatus" NOT NULL DEFAULT 'active',
    "createdBy" TEXT,
    "resolvedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "PayoutBlock_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PayoutBlock_paymentId_status_idx" ON "PayoutBlock"("paymentId", "status");
CREATE INDEX "PayoutBlock_payoutSplitId_idx" ON "PayoutBlock"("payoutSplitId");
CREATE INDEX "PayoutBlock_invoiceId_idx" ON "PayoutBlock"("invoiceId");

-- CreateTable AccountingExport
CREATE TABLE "AccountingExport" (
    "id" TEXT NOT NULL,
    "externalSystem" "AccountingExternalSystem" NOT NULL,
    "externalId" TEXT,
    "status" "AccountingExportStatus" NOT NULL DEFAULT 'pending',
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "exportedAt" TIMESTAMP(3),
    "failureMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingExport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AccountingExport_entityType_entityId_idx" ON "AccountingExport"("entityType", "entityId");
CREATE INDEX "AccountingExport_status_idx" ON "AccountingExport"("status");

-- CreateTable AccountingExportLine
CREATE TABLE "AccountingExportLine" (
    "id" TEXT NOT NULL,
    "exportId" TEXT NOT NULL,
    "lineData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountingExportLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AccountingExportLine_exportId_idx" ON "AccountingExportLine"("exportId");

-- AddForeignKey
ALTER TABLE "BillingPaymentSplit" ADD CONSTRAINT "BillingPaymentSplit_payoutRecipientId_fkey" FOREIGN KEY ("payoutRecipientId") REFERENCES "PayoutRecipient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PayoutRecipient" ADD CONSTRAINT "PayoutRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PayoutRecipient" ADD CONSTRAINT "PayoutRecipient_providerOrgId_fkey" FOREIGN KEY ("providerOrgId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PayoutRecipient" ADD CONSTRAINT "PayoutRecipient_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PayoutTransfer" ADD CONSTRAINT "PayoutTransfer_payoutSplitId_fkey" FOREIGN KEY ("payoutSplitId") REFERENCES "BillingPaymentSplit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PayoutTransfer" ADD CONSTRAINT "PayoutTransfer_payoutBatchId_fkey" FOREIGN KEY ("payoutBatchId") REFERENCES "PayoutBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PayoutTransfer" ADD CONSTRAINT "PayoutTransfer_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "PayoutRecipient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PayoutBlock" ADD CONSTRAINT "PayoutBlock_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "BillingPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PayoutBlock" ADD CONSTRAINT "PayoutBlock_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "BillingInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PayoutBlock" ADD CONSTRAINT "PayoutBlock_payoutSplitId_fkey" FOREIGN KEY ("payoutSplitId") REFERENCES "BillingPaymentSplit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AccountingExportLine" ADD CONSTRAINT "AccountingExportLine_exportId_fkey" FOREIGN KEY ("exportId") REFERENCES "AccountingExport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
