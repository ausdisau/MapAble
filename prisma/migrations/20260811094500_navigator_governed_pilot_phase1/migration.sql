-- AlterTable
ALTER TABLE "act_handoffs" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "act_handoffs" ADD COLUMN IF NOT EXISTS "participantId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "act_handoffs_tenantId_status_idx" ON "act_handoffs"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "act_handoffs_participantId_status_idx" ON "act_handoffs"("participantId", "status");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "act_handoffs" ADD CONSTRAINT "act_handoffs_participantId_fkey"
    FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "GovernedActionEnvelopeStatus" AS ENUM (
    'proposed',
    'approved',
    'rejected',
    'expired',
    'executed_draft',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "governed_action_envelopes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "initiatingUserId" TEXT NOT NULL,
    "capabilityKey" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "evidenceRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "modelVersion" TEXT,
    "promptVersion" TEXT,
    "toolVersion" TEXT,
    "consentReceiptId" TEXT NOT NULL,
    "requiredApproverRole" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "status" "GovernedActionEnvelopeStatus" NOT NULL DEFAULT 'proposed',
    "approvalReason" TEXT,
    "rejectionReason" TEXT,
    "executionResult" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "auditEventIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "governed_action_envelopes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "governed_action_envelopes_id_nonce_key"
  ON "governed_action_envelopes"("id", "nonce");
CREATE INDEX IF NOT EXISTS "governed_action_envelopes_tenantId_participantId_status_idx"
  ON "governed_action_envelopes"("tenantId", "participantId", "status");
CREATE INDEX IF NOT EXISTS "governed_action_envelopes_expiresAt_idx"
  ON "governed_action_envelopes"("expiresAt");
CREATE INDEX IF NOT EXISTS "governed_action_envelopes_capabilityKey_idx"
  ON "governed_action_envelopes"("capabilityKey");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "governed_action_envelopes" ADD CONSTRAINT "governed_action_envelopes_participantId_fkey"
    FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "governed_action_envelopes" ADD CONSTRAINT "governed_action_envelopes_initiatingUserId_fkey"
    FOREIGN KEY ("initiatingUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
