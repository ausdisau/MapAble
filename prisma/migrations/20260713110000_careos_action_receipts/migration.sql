CREATE TABLE "careos_action_receipts" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'claimed',
    "resultEntityType" TEXT,
    "resultEntityId" TEXT,
    "errorCode" TEXT,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "careos_action_receipts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "careos_action_receipts_tokenId_key" UNIQUE ("tokenId"),
    CONSTRAINT "careos_action_receipts_status_check" CHECK ("status" IN ('claimed', 'completed', 'failed')),
    CONSTRAINT "careos_action_receipts_actionType_check" CHECK ("actionType" IN ('submit_care_request', 'submit_transport_request'))
);

CREATE INDEX "careos_action_receipts_participantId_claimedAt_idx"
ON "careos_action_receipts"("participantId", "claimedAt");

CREATE INDEX "careos_action_receipts_requestId_idx"
ON "careos_action_receipts"("requestId");

ALTER TABLE "careos_action_receipts"
ADD CONSTRAINT "careos_action_receipts_participantId_fkey"
FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
