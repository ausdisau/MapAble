-- CreateEnum
CREATE TYPE "RehabilitationPlanStatus" AS ENUM ('draft', 'active', 'paused', 'archived');
CREATE TYPE "RehabilitationGoalStatus" AS ENUM ('active', 'achieved', 'paused', 'archived');
CREATE TYPE "PlanReviewStatus" AS ENUM ('pending', 'approved', 'changes_requested', 'rejected');
CREATE TYPE "RehabilitationActivityStatus" AS ENUM ('scheduled', 'completed', 'missed', 'cancelled');
CREATE TYPE "TelehealthSessionRecordStatus" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show');

-- CreateTable
CREATE TABLE "rehabilitation_plans" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "clinicianAuthorId" TEXT NOT NULL,
  "status" "RehabilitationPlanStatus" NOT NULL DEFAULT 'draft',
  "title" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "rehabilitation_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rehabilitation_plan_versions" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "instructionsJson" JSONB NOT NULL DEFAULT '{}',
  "changeSummary" TEXT NOT NULL,
  "authoredById" TEXT NOT NULL,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rehabilitation_plan_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rehabilitation_goals" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" "RehabilitationGoalStatus" NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rehabilitation_goals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "clinical_authors" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "profession" TEXT NOT NULL,
  "registrationRef" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "clinical_authors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_acknowledgements" (
  "id" TEXT NOT NULL,
  "planVersionId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "plan_acknowledgements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_reviews" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "status" "PlanReviewStatus" NOT NULL DEFAULT 'pending',
  "notes" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "plan_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rehabilitation_activities" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3),
  "instructionsAccessible" TEXT NOT NULL,
  "equipmentJson" JSONB NOT NULL DEFAULT '[]',
  "status" "RehabilitationActivityStatus" NOT NULL DEFAULT 'scheduled',
  "completionNote" TEXT,
  "participantFeedback" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "rehabilitation_activities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "telehealth_session_records" (
  "id" TEXT NOT NULL,
  "planId" TEXT,
  "participantId" TEXT NOT NULL,
  "clinicianId" TEXT,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "joinUrl" TEXT,
  "status" "TelehealthSessionRecordStatus" NOT NULL DEFAULT 'scheduled',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "telehealth_session_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "health_device_imports" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "sourceLabel" TEXT NOT NULL,
  "payloadJson" JSONB NOT NULL DEFAULT '{}',
  "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "health_device_imports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rehabilitation_plan_versions_planId_version_key" ON "rehabilitation_plan_versions"("planId", "version");
CREATE INDEX "rehabilitation_plans_participantId_idx" ON "rehabilitation_plans"("participantId");
CREATE INDEX "rehabilitation_plans_clinicianAuthorId_idx" ON "rehabilitation_plans"("clinicianAuthorId");
CREATE INDEX "rehabilitation_plans_status_idx" ON "rehabilitation_plans"("status");
CREATE INDEX "rehabilitation_plan_versions_planId_idx" ON "rehabilitation_plan_versions"("planId");
CREATE INDEX "rehabilitation_plan_versions_authoredById_idx" ON "rehabilitation_plan_versions"("authoredById");
CREATE INDEX "rehabilitation_goals_planId_idx" ON "rehabilitation_goals"("planId");
CREATE INDEX "rehabilitation_goals_participantId_idx" ON "rehabilitation_goals"("participantId");
CREATE INDEX "rehabilitation_goals_status_idx" ON "rehabilitation_goals"("status");
CREATE UNIQUE INDEX "clinical_authors_userId_key" ON "clinical_authors"("userId");
CREATE UNIQUE INDEX "plan_acknowledgements_planVersionId_participantId_key" ON "plan_acknowledgements"("planVersionId", "participantId");
CREATE INDEX "plan_acknowledgements_participantId_idx" ON "plan_acknowledgements"("participantId");
CREATE INDEX "plan_reviews_planId_idx" ON "plan_reviews"("planId");
CREATE INDEX "plan_reviews_reviewerId_idx" ON "plan_reviews"("reviewerId");
CREATE INDEX "plan_reviews_status_idx" ON "plan_reviews"("status");
CREATE INDEX "rehabilitation_activities_planId_idx" ON "rehabilitation_activities"("planId");
CREATE INDEX "rehabilitation_activities_status_idx" ON "rehabilitation_activities"("status");
CREATE INDEX "rehabilitation_activities_scheduledAt_idx" ON "rehabilitation_activities"("scheduledAt");
CREATE INDEX "telehealth_session_records_planId_idx" ON "telehealth_session_records"("planId");
CREATE INDEX "telehealth_session_records_participantId_idx" ON "telehealth_session_records"("participantId");
CREATE INDEX "telehealth_session_records_clinicianId_idx" ON "telehealth_session_records"("clinicianId");
CREATE INDEX "telehealth_session_records_status_idx" ON "telehealth_session_records"("status");
CREATE INDEX "health_device_imports_participantId_idx" ON "health_device_imports"("participantId");
CREATE INDEX "health_device_imports_sourceLabel_idx" ON "health_device_imports"("sourceLabel");

-- AddForeignKey
ALTER TABLE "rehabilitation_plans" ADD CONSTRAINT "rehabilitation_plans_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rehabilitation_plans" ADD CONSTRAINT "rehabilitation_plans_clinicianAuthorId_fkey"
  FOREIGN KEY ("clinicianAuthorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "rehabilitation_plan_versions" ADD CONSTRAINT "rehabilitation_plan_versions_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "rehabilitation_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rehabilitation_plan_versions" ADD CONSTRAINT "rehabilitation_plan_versions_authoredById_fkey"
  FOREIGN KEY ("authoredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "rehabilitation_goals" ADD CONSTRAINT "rehabilitation_goals_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "rehabilitation_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rehabilitation_goals" ADD CONSTRAINT "rehabilitation_goals_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "clinical_authors" ADD CONSTRAINT "clinical_authors_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "plan_acknowledgements" ADD CONSTRAINT "plan_acknowledgements_planVersionId_fkey"
  FOREIGN KEY ("planVersionId") REFERENCES "rehabilitation_plan_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_acknowledgements" ADD CONSTRAINT "plan_acknowledgements_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "plan_reviews" ADD CONSTRAINT "plan_reviews_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "rehabilitation_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_reviews" ADD CONSTRAINT "plan_reviews_reviewerId_fkey"
  FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "rehabilitation_activities" ADD CONSTRAINT "rehabilitation_activities_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "rehabilitation_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "telehealth_session_records" ADD CONSTRAINT "telehealth_session_records_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "rehabilitation_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "telehealth_session_records" ADD CONSTRAINT "telehealth_session_records_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "telehealth_session_records" ADD CONSTRAINT "telehealth_session_records_clinicianId_fkey"
  FOREIGN KEY ("clinicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "health_device_imports" ADD CONSTRAINT "health_device_imports_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
