-- CreateEnum
CREATE TYPE "EngagementSubmissionType" AS ENUM ('service_feedback', 'general_feedback', 'complaint', 'survey_response', 'co_design');

-- CreateEnum
CREATE TYPE "EngagementSubmissionStatus" AS ENUM ('received', 'acknowledged', 'in_review', 'action_planned', 'improved', 'closed', 'escalated');

-- CreateEnum
CREATE TYPE "EngagementImprovementActionStatus" AS ENUM ('planned', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "EngagementSurveyStatus" AS ENUM ('draft', 'active', 'closed');

-- AlterEnum
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'engagement_read_delegate';
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'engagement_submit_delegate';

-- CreateTable
CREATE TABLE "engagement_submissions" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "delegateScope" TEXT,
    "type" "EngagementSubmissionType" NOT NULL,
    "status" "EngagementSubmissionStatus" NOT NULL DEFAULT 'received',
    "title" TEXT,
    "body" TEXT NOT NULL,
    "rating" INTEGER,
    "contextType" TEXT,
    "contextId" TEXT,
    "organisationId" TEXT,
    "complaintId" TEXT,
    "involvesSafety" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgementDueAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "escalatedExternal" BOOLEAN NOT NULL DEFAULT false,
    "advocateInvolved" BOOLEAN NOT NULL DEFAULT false,
    "commissionReferenceId" TEXT,
    "commissionLodgedAt" TIMESTAMP(3),
    "proceduralFairnessNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engagement_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_submission_events" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "engagement_submission_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_improvement_actions" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT,
    "participantId" TEXT,
    "organisationId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" "EngagementImprovementActionStatus" NOT NULL DEFAULT 'planned',
    "ciReferenceCode" TEXT,
    "sourceComplaintId" TEXT,
    "responsibleUserId" TEXT,
    "targetDate" TIMESTAMP(3),
    "effectivenessReview" TEXT,
    "completedAt" TIMESTAMP(3),
    "visibleToParticipant" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engagement_improvement_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_nps_responses" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "contextType" TEXT,
    "contextId" TEXT,
    "organisationId" TEXT,
    "submissionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "engagement_nps_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_surveys" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "EngagementSurveyStatus" NOT NULL DEFAULT 'draft',
    "surveyType" TEXT NOT NULL DEFAULT 'general',
    "questions" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engagement_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_survey_responses" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "respondentId" TEXT NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "engagement_survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_training_modules" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "policyUrl" TEXT,
    "quizQuestions" JSONB NOT NULL DEFAULT '[]',
    "passingScore" INTEGER NOT NULL DEFAULT 80,
    "expiryMonths" INTEGER NOT NULL DEFAULT 12,
    "isPlatformDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_training_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_training_completions" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "worker_training_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "engagement_submissions_participantId_status_idx" ON "engagement_submissions"("participantId", "status");

-- CreateIndex
CREATE INDEX "engagement_submissions_organisationId_status_idx" ON "engagement_submissions"("organisationId", "status");

-- CreateIndex
CREATE INDEX "engagement_submissions_type_createdAt_idx" ON "engagement_submissions"("type", "createdAt");

-- CreateIndex
CREATE INDEX "engagement_submission_events_submissionId_createdAt_idx" ON "engagement_submission_events"("submissionId", "createdAt");

-- CreateIndex
CREATE INDEX "engagement_improvement_actions_organisationId_status_idx" ON "engagement_improvement_actions"("organisationId", "status");

-- CreateIndex
CREATE INDEX "engagement_improvement_actions_submissionId_idx" ON "engagement_improvement_actions"("submissionId");

-- CreateIndex
CREATE INDEX "engagement_improvement_actions_sourceComplaintId_idx" ON "engagement_improvement_actions"("sourceComplaintId");

-- CreateIndex
CREATE INDEX "engagement_nps_responses_organisationId_createdAt_idx" ON "engagement_nps_responses"("organisationId", "createdAt");

-- CreateIndex
CREATE INDEX "engagement_nps_responses_participantId_idx" ON "engagement_nps_responses"("participantId");

-- CreateIndex
CREATE INDEX "engagement_survey_responses_surveyId_idx" ON "engagement_survey_responses"("surveyId");

-- CreateIndex
CREATE INDEX "engagement_survey_responses_respondentId_idx" ON "engagement_survey_responses"("respondentId");

-- CreateIndex
CREATE INDEX "worker_training_modules_organisationId_idx" ON "worker_training_modules"("organisationId");

-- CreateIndex
CREATE INDEX "worker_training_completions_userId_idx" ON "worker_training_completions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "worker_training_completions_moduleId_userId_key" ON "worker_training_completions"("moduleId", "userId");

-- AddForeignKey
ALTER TABLE "engagement_submissions" ADD CONSTRAINT "engagement_submissions_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_submissions" ADD CONSTRAINT "engagement_submissions_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_submissions" ADD CONSTRAINT "engagement_submissions_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_submission_events" ADD CONSTRAINT "engagement_submission_events_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "engagement_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_submission_events" ADD CONSTRAINT "engagement_submission_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_improvement_actions" ADD CONSTRAINT "engagement_improvement_actions_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "engagement_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_improvement_actions" ADD CONSTRAINT "engagement_improvement_actions_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_improvement_actions" ADD CONSTRAINT "engagement_improvement_actions_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_nps_responses" ADD CONSTRAINT "engagement_nps_responses_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_nps_responses" ADD CONSTRAINT "engagement_nps_responses_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_survey_responses" ADD CONSTRAINT "engagement_survey_responses_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "engagement_surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_survey_responses" ADD CONSTRAINT "engagement_survey_responses_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_training_modules" ADD CONSTRAINT "worker_training_modules_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_training_completions" ADD CONSTRAINT "worker_training_completions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "worker_training_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_training_completions" ADD CONSTRAINT "worker_training_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
