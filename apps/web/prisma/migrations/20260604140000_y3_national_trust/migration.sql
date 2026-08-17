-- Y3 national trust: trust passport, continuity snapshots, participation goals, assessor network extensions

CREATE TYPE "WorkerTrustCredentialStatus" AS ENUM ('pending', 'verified', 'expired', 'revoked');

CREATE TABLE "worker_trust_credentials" (
    "id" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL,
    "issuerDid" TEXT NOT NULL,
    "status" "WorkerTrustCredentialStatus" NOT NULL DEFAULT 'pending',
    "presentedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "claimsJson" JSONB NOT NULL DEFAULT '{}',
    "verificationMethod" TEXT NOT NULL DEFAULT 'mock',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_trust_credentials_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "worker_trust_credentials_workerProfileId_status_idx" ON "worker_trust_credentials"("workerProfileId", "status");

ALTER TABLE "worker_trust_credentials" ADD CONSTRAINT "worker_trust_credentials_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "continuity_metric_snapshots" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "periodLabel" TEXT NOT NULL,
    "metricsJson" JSONB NOT NULL,
    "suppressed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "continuity_metric_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "continuity_metric_snapshots_organisationId_periodLabel_idx" ON "continuity_metric_snapshots"("organisationId", "periodLabel");

CREATE TYPE "ParticipationGoalStatus" AS ENUM ('active', 'completed', 'cancelled');

CREATE TABLE "participation_goals" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "organisationId" TEXT,
    "title" TEXT NOT NULL,
    "status" "ParticipationGoalStatus" NOT NULL DEFAULT 'active',
    "targetDate" TIMESTAMP(3),
    "notes" TEXT,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participation_goals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "participation_goals_participantId_status_idx" ON "participation_goals"("participantId", "status");

ALTER TABLE "AssessorNetworkMember" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "AssessorNetworkMember" ADD COLUMN IF NOT EXISTS "capacity" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "AssessorNetworkMember" ADD COLUMN IF NOT EXISTS "credentialVerifiedAt" TIMESTAMP(3);
ALTER TABLE "AssessorNetworkMember" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "AssessorNetworkMember" ALTER COLUMN "status" SET DEFAULT 'pending';
