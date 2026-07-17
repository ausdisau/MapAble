-- AI matching truth: separate rule scores from optional model commentary; never fabricate AI scores.
ALTER TABLE "AiMatchCandidate" ADD COLUMN IF NOT EXISTS "ruleScore" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "AiMatchCandidate" ADD COLUMN IF NOT EXISTS "modelCommentaryScore" DOUBLE PRECISION;
ALTER TABLE "AiMatchCandidate" ADD COLUMN IF NOT EXISTS "modelRunId" TEXT;
ALTER TABLE "AiMatchCandidate" ADD COLUMN IF NOT EXISTS "modelVersionLabel" TEXT;
ALTER TABLE "AiMatchCandidate" ADD COLUMN IF NOT EXISTS "hardRequirementsMet" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AiMatchCandidate" ADD COLUMN IF NOT EXISTS "unknownFieldsJson" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "AiMatchCandidate" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

-- Backfill ruleScore from legacy aiScore (previously a remixed rule score, not a model score).
UPDATE "AiMatchCandidate" SET "ruleScore" = "aiScore" WHERE "ruleScore" = 0;

CREATE INDEX IF NOT EXISTS "AiMatchCandidate_matchCandidateId_idx" ON "AiMatchCandidate"("matchCandidateId");
CREATE INDEX IF NOT EXISTS "AiMatchCandidate_expiresAt_idx" ON "AiMatchCandidate"("expiresAt");

-- Optional FK to MatchCandidate when present (ignore if already constrained).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AiMatchCandidate_matchCandidateId_fkey'
  ) THEN
    ALTER TABLE "AiMatchCandidate"
      ADD CONSTRAINT "AiMatchCandidate_matchCandidateId_fkey"
      FOREIGN KEY ("matchCandidateId") REFERENCES "MatchCandidate"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
