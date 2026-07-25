-- CreateTable
CREATE TABLE "ICanV6IntakeSubmission" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted_draft',
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ICanV6IntakeSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ICanV6IntakeSubmission_participantId_createdAt_idx" ON "ICanV6IntakeSubmission"("participantId", "createdAt");

-- AddForeignKey
ALTER TABLE "ICanV6IntakeSubmission" ADD CONSTRAINT "ICanV6IntakeSubmission_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
