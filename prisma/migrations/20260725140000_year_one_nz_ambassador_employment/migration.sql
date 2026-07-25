-- Year-One: NZ jurisdiction, Ambassador role, DES/IEA API scopes

ALTER TYPE "MapAbleUserRole" ADD VALUE IF NOT EXISTS 'ambassador';

ALTER TABLE "ParticipantProfile" ADD COLUMN IF NOT EXISTS "jurisdiction" TEXT NOT NULL DEFAULT 'AU';

ALTER TYPE "ApiScope" ADD VALUE IF NOT EXISTS 'employment_activity_read';
ALTER TYPE "ApiScope" ADD VALUE IF NOT EXISTS 'employment_outcomes_write';
