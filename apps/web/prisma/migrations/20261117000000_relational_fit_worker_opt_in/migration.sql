-- Relational Fit v1: worker-owned, optional, declared work practices only.
-- NO personality, psychometric scores, participant records or AI in this table.
-- IMPORTANT: reviewed, preview-only migration. Never run automatically on production.
CREATE TABLE "relational_fit_worker_profiles" (
    "workerProfileId" TEXT NOT NULL,
    "communicationModes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "routineStyle" TEXT NOT NULL DEFAULT 'not_stated',
    "interactionStyle" TEXT NOT NULL DEFAULT 'not_stated',
    "initiativeStyle" TEXT NOT NULL DEFAULT 'not_stated',
    "continuityStyle" TEXT NOT NULL DEFAULT 'not_stated',
    "consentVersion" TEXT NOT NULL DEFAULT 'v1',
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "relational_fit_worker_profiles_pkey" PRIMARY KEY ("workerProfileId")
);
CREATE INDEX "relational_fit_worker_profiles_consentedAt_idx"
    ON "relational_fit_worker_profiles" ("consentedAt");
ALTER TABLE "relational_fit_worker_profiles"
    ADD CONSTRAINT "relational_fit_worker_profiles_workerProfileId_fkey"
    FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
