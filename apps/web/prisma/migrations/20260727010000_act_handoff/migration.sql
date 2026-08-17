-- CreateEnum
CREATE TYPE "ActHandoffStatus" AS ENUM ('pending', 'approved', 'denied', 'expired');

-- CreateTable
CREATE TABLE "act_handoffs" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "gamma" DOUBLE PRECISION NOT NULL,
    "cConc" DOUBLE PRECISION NOT NULL,
    "riskTier" TEXT NOT NULL,
    "status" "ActHandoffStatus" NOT NULL DEFAULT 'pending',
    "reason" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "assigneeUserId" TEXT,
    "resolveNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "act_handoffs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "act_handoffs_status_createdAt_idx" ON "act_handoffs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "act_handoffs_fingerprint_status_idx" ON "act_handoffs"("fingerprint", "status");

-- CreateIndex
CREATE INDEX "act_handoffs_requesterUserId_idx" ON "act_handoffs"("requesterUserId");

-- AddForeignKey
ALTER TABLE "act_handoffs" ADD CONSTRAINT "act_handoffs_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "act_handoffs" ADD CONSTRAINT "act_handoffs_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
