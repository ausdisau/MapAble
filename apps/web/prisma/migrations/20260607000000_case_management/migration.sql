-- MapAble — AI-Enabled Case Management
-- Repaired for migrate-from-zero: historical stub assumed `prisma db push`.
-- `20260714080000_support_coordination_os` FKs coordination_cases.linkedCaseId
-- to cases(id), which was never created on empty DB (P3018/42P01).
-- See docs/remediation/MIGRATE_FROM_ZERO_REPAIR.md.

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('open', 'monitoring', 'on_hold', 'closed');

-- CreateEnum
CREATE TYPE "CasePriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "CaseCategory" AS ENUM (
  'intake',
  'goal_planning',
  'service_coordination',
  'funding_review',
  'safeguarding',
  'housing',
  'health',
  'employment',
  'education',
  'legal',
  'other'
);

-- CreateEnum
CREATE TYPE "CaseRiskLevel" AS ENUM ('low', 'moderate', 'elevated', 'high', 'critical');

-- CreateEnum
CREATE TYPE "CaseTaskStatus" AS ENUM ('pending', 'in_progress', 'blocked', 'done', 'cancelled');

-- CreateEnum
CREATE TYPE "CaseLinkType" AS ENUM (
  'booking',
  'incident',
  'support_ticket',
  'document',
  'funding_source',
  'service_agreement',
  'external',
  'note'
);

-- CreateEnum
CREATE TYPE "CaseAIInsightKind" AS ENUM (
  'summary',
  'risk_assessment',
  'next_action',
  'search_result'
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" "CaseStatus" NOT NULL DEFAULT 'open',
    "priority" "CasePriority" NOT NULL DEFAULT 'medium',
    "category" "CaseCategory" NOT NULL DEFAULT 'other',
    "riskLevel" "CaseRiskLevel" NOT NULL DEFAULT 'low',
    "participantId" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "closedById" TEXT,
    "organisationId" TEXT,
    "goalsJson" JSONB,
    "tagsJson" JSONB,
    "aiOptOut" BOOLEAN NOT NULL DEFAULT false,
    "lastAiRunAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_notes" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_tasks" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "status" "CaseTaskStatus" NOT NULL DEFAULT 'pending',
    "priority" "CasePriority" NOT NULL DEFAULT 'medium',
    "assigneeId" TEXT,
    "createdById" TEXT NOT NULL,
    "completedById" TEXT,
    "aiSuggested" BOOLEAN NOT NULL DEFAULT false,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_links" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "linkType" "CaseLinkType" NOT NULL,
    "targetId" TEXT,
    "label" TEXT NOT NULL,
    "url" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_ai_insights" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "kind" "CaseAIInsightKind" NOT NULL,
    "engine" TEXT NOT NULL DEFAULT 'rules-v1',
    "summary" TEXT NOT NULL,
    "detailJson" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "requiresReview" BOOLEAN NOT NULL DEFAULT true,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "requestedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_ai_insights_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cases_reference_key" ON "cases"("reference");
CREATE INDEX "cases_participantId_idx" ON "cases"("participantId");
CREATE INDEX "cases_assignedToId_idx" ON "cases"("assignedToId");
CREATE INDEX "cases_status_idx" ON "cases"("status");
CREATE INDEX "case_notes_caseId_idx" ON "case_notes"("caseId");
CREATE INDEX "case_tasks_caseId_idx" ON "case_tasks"("caseId");
CREATE INDEX "case_tasks_assigneeId_idx" ON "case_tasks"("assigneeId");
CREATE INDEX "case_links_caseId_idx" ON "case_links"("caseId");
CREATE INDEX "case_ai_insights_caseId_idx" ON "case_ai_insights"("caseId");
CREATE INDEX "case_ai_insights_kind_idx" ON "case_ai_insights"("kind");

ALTER TABLE "cases" ADD CONSTRAINT "cases_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cases" ADD CONSTRAINT "cases_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cases" ADD CONSTRAINT "cases_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cases" ADD CONSTRAINT "cases_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "case_notes" ADD CONSTRAINT "case_notes_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "case_notes" ADD CONSTRAINT "case_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "case_tasks" ADD CONSTRAINT "case_tasks_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "case_tasks" ADD CONSTRAINT "case_tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "case_tasks" ADD CONSTRAINT "case_tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "case_tasks" ADD CONSTRAINT "case_tasks_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "case_links" ADD CONSTRAINT "case_links_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "case_links" ADD CONSTRAINT "case_links_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "case_ai_insights" ADD CONSTRAINT "case_ai_insights_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "case_ai_insights" ADD CONSTRAINT "case_ai_insights_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
