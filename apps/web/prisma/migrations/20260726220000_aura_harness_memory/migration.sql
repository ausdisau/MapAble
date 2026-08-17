-- CreateEnum
CREATE TYPE "AuraHarnessMemoryDecision" AS ENUM ('APPROVED', 'MITIGATED', 'DENIED', 'HITL_APPROVED', 'HITL_REJECTED');

-- CreateTable
CREATE TABLE "aura_harness_memory" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "normalizedGamma" DOUBLE PRECISION NOT NULL,
    "concentrationCoeff" DOUBLE PRECISION NOT NULL,
    "decision" "AuraHarnessMemoryDecision" NOT NULL,
    "mitigationJson" JSONB,
    "dimensionScores" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aura_harness_memory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aura_harness_memory_fingerprint_key" ON "aura_harness_memory"("fingerprint");

-- CreateIndex
CREATE INDEX "aura_harness_memory_toolName_idx" ON "aura_harness_memory"("toolName");

-- CreateIndex
CREATE INDEX "aura_harness_memory_expiresAt_idx" ON "aura_harness_memory"("expiresAt");
