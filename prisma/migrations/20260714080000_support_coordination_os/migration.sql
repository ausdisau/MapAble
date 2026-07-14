-- CreateEnum
CREATE TYPE "CoordinationOperationalPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "CoordinationCaseStatus" AS ENUM ('open', 'active', 'on_hold', 'closed');

-- CreateEnum
CREATE TYPE "CoordinationTaskStatus" AS ENUM ('open', 'done', 'cancelled');

-- CreateEnum
CREATE TYPE "CoordinationNoteVisibility" AS ENUM ('participant_visible', 'internal');

-- CreateEnum
CREATE TYPE "ProviderEnquiryStatus" AS ENUM ('draft', 'sent', 'responded', 'withdrawn', 'expired');

-- CreateEnum
CREATE TYPE "EvidenceRequestPurpose" AS ENUM ('plan_review', 'change_of_circumstances', 'home_living', 'assistive_technology', 'service_continuity', 'participant_outcomes');

-- CreateEnum
CREATE TYPE "EvidenceRequestStatus" AS ENUM ('draft', 'requested', 'partially_fulfilled', 'fulfilled', 'cancelled');

-- CreateEnum
CREATE TYPE "CoordinationMilestoneStatus" AS ENUM ('pending', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "coordination_cases" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "organisationId" TEXT,
    "coordinatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "CoordinationCaseStatus" NOT NULL DEFAULT 'open',
    "operationalPriority" "CoordinationOperationalPriority" NOT NULL DEFAULT 'medium',
    "linkedCaseId" TEXT,
    "linkedMissionId" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coordination_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordination_tasks" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "CoordinationTaskStatus" NOT NULL DEFAULT 'open',
    "waitingOn" TEXT,
    "dueAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coordination_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordination_case_assignments" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),

    CONSTRAINT "coordination_case_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordination_case_notes" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "visibility" "CoordinationNoteVisibility" NOT NULL DEFAULT 'internal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coordination_case_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_contacts" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "preferred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participant_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_enquiries" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "organisationId" TEXT,
    "providerName" TEXT NOT NULL,
    "disclosurePreview" TEXT NOT NULL,
    "status" "ProviderEnquiryStatus" NOT NULL DEFAULT 'draft',
    "responseDeadline" TIMESTAMP(3),
    "responseJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" TIMESTAMP(3),

    CONSTRAINT "provider_enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_requests" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "purpose" "EvidenceRequestPurpose" NOT NULL,
    "status" "EvidenceRequestStatus" NOT NULL DEFAULT 'draft',
    "dueAt" TIMESTAMP(3),
    "provenanceJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordination_milestones" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "CoordinationMilestoneStatus" NOT NULL DEFAULT 'pending',
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "coordination_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordination_supervision_records" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coordination_supervision_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_packs" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "packType" TEXT NOT NULL,
    "claimsJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_packs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coordination_cases_participantId_idx" ON "coordination_cases"("participantId");

-- CreateIndex
CREATE INDEX "coordination_cases_coordinatorId_idx" ON "coordination_cases"("coordinatorId");

-- CreateIndex
CREATE INDEX "coordination_cases_organisationId_idx" ON "coordination_cases"("organisationId");

-- CreateIndex
CREATE INDEX "coordination_cases_status_idx" ON "coordination_cases"("status");

-- CreateIndex
CREATE INDEX "coordination_cases_operationalPriority_idx" ON "coordination_cases"("operationalPriority");

-- CreateIndex
CREATE INDEX "coordination_tasks_caseId_idx" ON "coordination_tasks"("caseId");

-- CreateIndex
CREATE INDEX "coordination_tasks_assigneeId_idx" ON "coordination_tasks"("assigneeId");

-- CreateIndex
CREATE INDEX "coordination_tasks_status_idx" ON "coordination_tasks"("status");

-- CreateIndex
CREATE INDEX "coordination_case_assignments_caseId_idx" ON "coordination_case_assignments"("caseId");

-- CreateIndex
CREATE INDEX "coordination_case_assignments_assigneeId_idx" ON "coordination_case_assignments"("assigneeId");

-- CreateIndex
CREATE INDEX "coordination_case_notes_caseId_idx" ON "coordination_case_notes"("caseId");

-- CreateIndex
CREATE INDEX "coordination_case_notes_authorId_idx" ON "coordination_case_notes"("authorId");

-- CreateIndex
CREATE INDEX "participant_contacts_participantId_idx" ON "participant_contacts"("participantId");

-- CreateIndex
CREATE INDEX "provider_enquiries_caseId_idx" ON "provider_enquiries"("caseId");

-- CreateIndex
CREATE INDEX "provider_enquiries_participantId_idx" ON "provider_enquiries"("participantId");

-- CreateIndex
CREATE INDEX "provider_enquiries_status_idx" ON "provider_enquiries"("status");

-- CreateIndex
CREATE INDEX "evidence_requests_caseId_idx" ON "evidence_requests"("caseId");

-- CreateIndex
CREATE INDEX "evidence_requests_participantId_idx" ON "evidence_requests"("participantId");

-- CreateIndex
CREATE INDEX "evidence_requests_status_idx" ON "evidence_requests"("status");

-- CreateIndex
CREATE INDEX "coordination_milestones_caseId_idx" ON "coordination_milestones"("caseId");

-- CreateIndex
CREATE INDEX "coordination_supervision_records_caseId_idx" ON "coordination_supervision_records"("caseId");

-- CreateIndex
CREATE INDEX "coordination_supervision_records_supervisorId_idx" ON "coordination_supervision_records"("supervisorId");

-- CreateIndex
CREATE INDEX "evidence_packs_caseId_idx" ON "evidence_packs"("caseId");

-- AddForeignKey
ALTER TABLE "coordination_cases" ADD CONSTRAINT "coordination_cases_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_cases" ADD CONSTRAINT "coordination_cases_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_cases" ADD CONSTRAINT "coordination_cases_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_cases" ADD CONSTRAINT "coordination_cases_linkedCaseId_fkey" FOREIGN KEY ("linkedCaseId") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_cases" ADD CONSTRAINT "coordination_cases_linkedMissionId_fkey" FOREIGN KEY ("linkedMissionId") REFERENCES "careos_missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_tasks" ADD CONSTRAINT "coordination_tasks_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "coordination_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_tasks" ADD CONSTRAINT "coordination_tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_tasks" ADD CONSTRAINT "coordination_tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_case_assignments" ADD CONSTRAINT "coordination_case_assignments_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "coordination_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_case_assignments" ADD CONSTRAINT "coordination_case_assignments_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_case_notes" ADD CONSTRAINT "coordination_case_notes_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "coordination_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_case_notes" ADD CONSTRAINT "coordination_case_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_contacts" ADD CONSTRAINT "participant_contacts_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_enquiries" ADD CONSTRAINT "provider_enquiries_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "coordination_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_enquiries" ADD CONSTRAINT "provider_enquiries_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_enquiries" ADD CONSTRAINT "provider_enquiries_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_requests" ADD CONSTRAINT "evidence_requests_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "coordination_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_requests" ADD CONSTRAINT "evidence_requests_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_milestones" ADD CONSTRAINT "coordination_milestones_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "coordination_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_supervision_records" ADD CONSTRAINT "coordination_supervision_records_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "coordination_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_supervision_records" ADD CONSTRAINT "coordination_supervision_records_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_packs" ADD CONSTRAINT "evidence_packs_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "coordination_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
