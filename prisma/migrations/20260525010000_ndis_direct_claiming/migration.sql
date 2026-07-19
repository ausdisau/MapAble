-- CreateEnum
CREATE TYPE "NdisPaymentRoute" AS ENUM ('self_managed', 'plan_managed', 'ndia_managed');

-- CreateEnum
CREATE TYPE "NdisClaimLineStatus" AS ENUM ('draft', 'validated', 'validation_failed', 'included_in_batch', 'exported', 'submitted', 'pending', 'paid', 'rejected', 'corrected', 'resubmitted', 'voided');

-- CreateEnum
CREATE TYPE "NdisClaimBatchStatus" AS ENUM ('draft', 'validated', 'approved', 'exported', 'submitted_in_portal', 'partially_paid', 'paid', 'rejected', 'closed');

-- CreateEnum
CREATE TYPE "NdisClaimType" AS ENUM ('standard', 'cancellation', 'non_face_to_face', 'irregular_sil', 'other');

-- CreateEnum
CREATE TYPE "NdisInvoiceStatus" AS ENUM ('draft', 'issued', 'sent', 'paid', 'voided');

-- CreateEnum
CREATE TYPE "ParticipantProviderRelationshipStatus" AS ENUM ('unknown', 'active', 'inactive', 'pending_verification');

-- CreateTable
CREATE TABLE "ParticipantProviderRelationship" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "providerOrgId" TEXT NOT NULL,
    "status" "ParticipantProviderRelationshipStatus" NOT NULL DEFAULT 'unknown',
    "myProviderVerifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParticipantProviderRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NdisPricingCatalogueItem" (
    "id" TEXT NOT NULL,
    "supportItemCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unitType" TEXT,
    "priceLimitCents" INTEGER,
    "ndisSupportItemId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NdisPricingCatalogueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NdisClaimBatch" (
    "id" TEXT NOT NULL,
    "providerOrgId" TEXT NOT NULL,
    "paymentRoute" "NdisPaymentRoute" NOT NULL,
    "status" "NdisClaimBatchStatus" NOT NULL DEFAULT 'draft',
    "batchReference" TEXT,
    "exportFileName" TEXT,
    "exportChecksum" TEXT,
    "exportedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NdisClaimBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NdisClaimLine" (
    "id" TEXT NOT NULL,
    "batchId" TEXT,
    "participantId" TEXT NOT NULL,
    "providerOrgId" TEXT NOT NULL,
    "bookingId" TEXT,
    "invoiceId" TEXT,
    "ndisInvoiceId" TEXT,
    "ndisParticipantNumber" TEXT,
    "participantName" TEXT NOT NULL,
    "supportItemCode" TEXT NOT NULL,
    "supportDescription" TEXT NOT NULL,
    "serviceStartDate" TIMESTAMP(3) NOT NULL,
    "serviceEndDate" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "totalAmountCents" INTEGER NOT NULL,
    "paymentRoute" "NdisPaymentRoute" NOT NULL,
    "claimType" "NdisClaimType" NOT NULL DEFAULT 'standard',
    "cancellationReason" TEXT,
    "status" "NdisClaimLineStatus" NOT NULL DEFAULT 'draft',
    "rejectionCode" TEXT,
    "rejectionMessage" TEXT,
    "evidenceJson" JSONB,
    "validationJson" JSONB,
    "correctedFromLineId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NdisClaimLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NdisInvoice" (
    "id" TEXT NOT NULL,
    "providerOrgId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "paymentRoute" "NdisPaymentRoute" NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" "NdisInvoiceStatus" NOT NULL DEFAULT 'draft',
    "planManagerName" TEXT,
    "planManagerEmail" TEXT,
    "issuedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NdisInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NdisInvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "claimLineId" TEXT,
    "supportItemCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NdisInvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimAuditEvent" (
    "id" TEXT NOT NULL,
    "claimLineId" TEXT,
    "batchId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorUserId" TEXT,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantProviderRelationship_participantId_providerOrgId_key" ON "ParticipantProviderRelationship"("participantId", "providerOrgId");

-- CreateIndex
CREATE INDEX "ParticipantProviderRelationship_providerOrgId_status_idx" ON "ParticipantProviderRelationship"("providerOrgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "NdisPricingCatalogueItem_supportItemCode_key" ON "NdisPricingCatalogueItem"("supportItemCode");

-- CreateIndex
CREATE INDEX "NdisPricingCatalogueItem_active_idx" ON "NdisPricingCatalogueItem"("active");

-- CreateIndex
CREATE INDEX "NdisClaimBatch_providerOrgId_status_idx" ON "NdisClaimBatch"("providerOrgId", "status");

-- CreateIndex
CREATE INDEX "NdisClaimBatch_paymentRoute_status_idx" ON "NdisClaimBatch"("paymentRoute", "status");

-- CreateIndex
CREATE INDEX "NdisClaimLine_providerOrgId_status_idx" ON "NdisClaimLine"("providerOrgId", "status");

-- CreateIndex
CREATE INDEX "NdisClaimLine_participantId_providerOrgId_supportItemCode_s_idx" ON "NdisClaimLine"("participantId", "providerOrgId", "supportItemCode", "serviceStartDate");

-- CreateIndex
CREATE INDEX "NdisClaimLine_bookingId_idx" ON "NdisClaimLine"("bookingId");

-- CreateIndex
CREATE INDEX "NdisClaimLine_batchId_idx" ON "NdisClaimLine"("batchId");

-- CreateIndex
CREATE INDEX "NdisInvoice_providerOrgId_status_idx" ON "NdisInvoice"("providerOrgId", "status");

-- CreateIndex
CREATE INDEX "NdisInvoice_participantId_idx" ON "NdisInvoice"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "NdisInvoiceLine_claimLineId_key" ON "NdisInvoiceLine"("claimLineId");

-- CreateIndex
CREATE INDEX "NdisInvoiceLine_invoiceId_idx" ON "NdisInvoiceLine"("invoiceId");

-- CreateIndex
CREATE INDEX "ClaimAuditEvent_claimLineId_createdAt_idx" ON "ClaimAuditEvent"("claimLineId", "createdAt");

-- CreateIndex
CREATE INDEX "ClaimAuditEvent_batchId_createdAt_idx" ON "ClaimAuditEvent"("batchId", "createdAt");

-- CreateIndex
CREATE INDEX "ClaimAuditEvent_entityType_entityId_idx" ON "ClaimAuditEvent"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "ParticipantProviderRelationship" ADD CONSTRAINT "ParticipantProviderRelationship_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantProviderRelationship" ADD CONSTRAINT "ParticipantProviderRelationship_providerOrgId_fkey" FOREIGN KEY ("providerOrgId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdisClaimBatch" ADD CONSTRAINT "NdisClaimBatch_providerOrgId_fkey" FOREIGN KEY ("providerOrgId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdisClaimLine" ADD CONSTRAINT "NdisClaimLine_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "NdisClaimBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdisClaimLine" ADD CONSTRAINT "NdisClaimLine_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdisClaimLine" ADD CONSTRAINT "NdisClaimLine_providerOrgId_fkey" FOREIGN KEY ("providerOrgId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdisClaimLine" ADD CONSTRAINT "NdisClaimLine_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdisClaimLine" ADD CONSTRAINT "NdisClaimLine_ndisInvoiceId_fkey" FOREIGN KEY ("ndisInvoiceId") REFERENCES "NdisInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdisInvoice" ADD CONSTRAINT "NdisInvoice_providerOrgId_fkey" FOREIGN KEY ("providerOrgId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdisInvoice" ADD CONSTRAINT "NdisInvoice_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdisInvoiceLine" ADD CONSTRAINT "NdisInvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "NdisInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimAuditEvent" ADD CONSTRAINT "ClaimAuditEvent_claimLineId_fkey" FOREIGN KEY ("claimLineId") REFERENCES "NdisClaimLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
