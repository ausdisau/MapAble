-- CareOS Phase 11 — Quality, Accreditation and Compliance Cloud

CREATE TYPE "StandardFrameworkStatus" AS ENUM ('draft', 'published', 'archived');
CREATE TYPE "ComplianceEvidenceSource" AS ENUM ('self_submitted', 'audit', 'third_party', 'access_mark', 'incident_record', 'policy_record', 'training_record', 'system_import');
CREATE TYPE "EvidenceAssessmentStatus" AS ENUM ('pending', 'met', 'partially_met', 'not_met', 'requires_clarification');
CREATE TYPE "QualityAuditPlanStatus" AS ENUM ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE "QualityAuditFindingSeverity" AS ENUM ('minor', 'major', 'critical');
CREATE TYPE "QualityAuditFindingStatus" AS ENUM ('open', 'action_required', 'closed');
CREATE TYPE "CorrectiveActionStatus" AS ENUM ('open', 'in_progress', 'verification_pending', 'closed');
CREATE TYPE "ImprovementActionStatus" AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE "PolicyDocumentStatus" AS ENUM ('draft', 'published', 'archived');
CREATE TYPE "TrainingRequirementStatus" AS ENUM ('active', 'archived');
CREATE TYPE "ProviderAccreditationApplicationStatus" AS ENUM ('draft', 'submitted', 'under_review', 'clarification_requested', 'assessment_in_progress', 'pending_decision', 'approved', 'conditionally_approved', 'rejected', 'suspended', 'expired', 'renewal_due', 'appealed', 'withdrawn');
CREATE TYPE "ProviderAccreditationDecisionOutcome" AS ENUM ('approved', 'conditionally_approved', 'rejected', 'suspended');
CREATE TYPE "ProviderAccreditationClarificationStatus" AS ENUM ('open', 'responded', 'closed');
CREATE TYPE "ProviderAccreditationAppealStatus" AS ENUM ('submitted', 'under_review', 'upheld', 'dismissed');

CREATE TABLE "standard_frameworks" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "description" TEXT,
  "status" "StandardFrameworkStatus" NOT NULL DEFAULT 'draft',
  "publishedAt" TIMESTAMP(3),
  "sourceRef" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "standard_frameworks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "standard_outcomes" (
  "id" TEXT NOT NULL,
  "frameworkId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "standard_outcomes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "standard_indicators" (
  "id" TEXT NOT NULL,
  "outcomeId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "standard_indicators_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "evidence_requirements" (
  "id" TEXT NOT NULL,
  "indicatorId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "evidenceType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "evidence_requirements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "compliance_evidence" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "sourceType" "ComplianceEvidenceSource" NOT NULL,
  "sourceRef" TEXT,
  "storagePath" TEXT,
  "caption" TEXT,
  "submittedById" TEXT NOT NULL,
  "supersededById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "compliance_evidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "evidence_assessments" (
  "id" TEXT NOT NULL,
  "evidenceId" TEXT NOT NULL,
  "assessorId" TEXT NOT NULL,
  "status" "EvidenceAssessmentStatus" NOT NULL DEFAULT 'pending',
  "notes" TEXT,
  "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "evidence_assessments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quality_audit_plans" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "scope" TEXT,
  "scheduledAt" TIMESTAMP(3),
  "status" "QualityAuditPlanStatus" NOT NULL DEFAULT 'draft',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "quality_audit_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quality_audit_findings" (
  "id" TEXT NOT NULL,
  "auditPlanId" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "indicatorId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "severity" "QualityAuditFindingSeverity" NOT NULL DEFAULT 'minor',
  "status" "QualityAuditFindingStatus" NOT NULL DEFAULT 'open',
  "assignedToId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "quality_audit_findings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quality_audit_finding_history" (
  "id" TEXT NOT NULL,
  "findingId" TEXT NOT NULL,
  "actorId" TEXT,
  "fromStatus" "QualityAuditFindingStatus",
  "toStatus" "QualityAuditFindingStatus" NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "quality_audit_finding_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "corrective_actions" (
  "id" TEXT NOT NULL,
  "findingId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "dueDate" TIMESTAMP(3),
  "status" "CorrectiveActionStatus" NOT NULL DEFAULT 'open',
  "assignedToId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "corrective_actions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "corrective_action_history" (
  "id" TEXT NOT NULL,
  "actionId" TEXT NOT NULL,
  "actorId" TEXT,
  "fromStatus" "CorrectiveActionStatus",
  "toStatus" "CorrectiveActionStatus" NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "corrective_action_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "improvement_actions" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "sourceFindingId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "ImprovementActionStatus" NOT NULL DEFAULT 'planned',
  "targetDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "improvement_actions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "improvement_action_history" (
  "id" TEXT NOT NULL,
  "actionId" TEXT NOT NULL,
  "actorId" TEXT,
  "fromStatus" "ImprovementActionStatus",
  "toStatus" "ImprovementActionStatus" NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "improvement_action_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "policy_documents" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "storagePath" TEXT,
  "contentSummary" TEXT,
  "status" "PolicyDocumentStatus" NOT NULL DEFAULT 'draft',
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "policy_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "policy_acknowledgements" (
  "id" TEXT NOT NULL,
  "policyDocumentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "versionAcknowledged" TEXT NOT NULL,
  "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "policy_acknowledgements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "training_requirements" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "renewalDays" INTEGER,
  "requiredRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" "TrainingRequirementStatus" NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "training_requirements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "training_completion_records" (
  "id" TEXT NOT NULL,
  "requirementId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "evidenceRef" TEXT,
  "notes" TEXT,
  CONSTRAINT "training_completion_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "provider_accreditation_applications" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "frameworkId" TEXT NOT NULL,
  "status" "ProviderAccreditationApplicationStatus" NOT NULL DEFAULT 'draft',
  "submittedById" TEXT,
  "submittedAt" TIMESTAMP(3),
  "accessAccreditationAssessmentId" TEXT,
  "expiresAt" TIMESTAMP(3),
  "renewalDueAt" TIMESTAMP(3),
  "suspendedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "provider_accreditation_applications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "provider_accreditation_application_evidence" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "requirementId" TEXT,
  "storagePath" TEXT,
  "caption" TEXT,
  "sourceRef" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_accreditation_application_evidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "provider_accreditation_assessments" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "assessorId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "evidenceIndex" JSONB NOT NULL DEFAULT '[]',
  "notes" TEXT,
  "preparedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_accreditation_assessments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "provider_accreditation_clarifications" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "response" TEXT,
  "status" "ProviderAccreditationClarificationStatus" NOT NULL DEFAULT 'open',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "respondedAt" TIMESTAMP(3),
  CONSTRAINT "provider_accreditation_clarifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "provider_accreditation_decisions" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "deciderId" TEXT NOT NULL,
  "outcome" "ProviderAccreditationDecisionOutcome" NOT NULL,
  "conditions" TEXT,
  "effectiveAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "notes" TEXT,
  "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_accreditation_decisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "provider_accreditation_appeal_records" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "appellantId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "ProviderAccreditationAppealStatus" NOT NULL DEFAULT 'submitted',
  "decidedById" TEXT,
  "decisionNotes" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" TIMESTAMP(3),
  CONSTRAINT "provider_accreditation_appeal_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "provider_accreditation_application_events" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_accreditation_application_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "standard_frameworks_code_version_key" ON "standard_frameworks"("code", "version");
CREATE INDEX "standard_frameworks_status_idx" ON "standard_frameworks"("status");
CREATE UNIQUE INDEX "standard_outcomes_frameworkId_code_key" ON "standard_outcomes"("frameworkId", "code");
CREATE INDEX "standard_outcomes_frameworkId_idx" ON "standard_outcomes"("frameworkId");
CREATE UNIQUE INDEX "standard_indicators_outcomeId_code_key" ON "standard_indicators"("outcomeId", "code");
CREATE INDEX "standard_indicators_outcomeId_idx" ON "standard_indicators"("outcomeId");
CREATE UNIQUE INDEX "evidence_requirements_indicatorId_code_key" ON "evidence_requirements"("indicatorId", "code");
CREATE INDEX "evidence_requirements_indicatorId_idx" ON "evidence_requirements"("indicatorId");
CREATE INDEX "compliance_evidence_organisationId_requirementId_idx" ON "compliance_evidence"("organisationId", "requirementId");
CREATE INDEX "compliance_evidence_submittedById_idx" ON "compliance_evidence"("submittedById");
CREATE INDEX "evidence_assessments_evidenceId_idx" ON "evidence_assessments"("evidenceId");
CREATE INDEX "evidence_assessments_assessorId_idx" ON "evidence_assessments"("assessorId");
CREATE INDEX "quality_audit_plans_organisationId_status_idx" ON "quality_audit_plans"("organisationId", "status");
CREATE INDEX "quality_audit_plans_createdById_idx" ON "quality_audit_plans"("createdById");
CREATE INDEX "quality_audit_findings_auditPlanId_idx" ON "quality_audit_findings"("auditPlanId");
CREATE INDEX "quality_audit_findings_organisationId_status_idx" ON "quality_audit_findings"("organisationId", "status");
CREATE INDEX "quality_audit_finding_history_findingId_createdAt_idx" ON "quality_audit_finding_history"("findingId", "createdAt");
CREATE INDEX "corrective_actions_findingId_idx" ON "corrective_actions"("findingId");
CREATE INDEX "corrective_actions_status_idx" ON "corrective_actions"("status");
CREATE INDEX "corrective_action_history_actionId_createdAt_idx" ON "corrective_action_history"("actionId", "createdAt");
CREATE INDEX "improvement_actions_organisationId_status_idx" ON "improvement_actions"("organisationId", "status");
CREATE INDEX "improvement_action_history_actionId_createdAt_idx" ON "improvement_action_history"("actionId", "createdAt");
CREATE UNIQUE INDEX "policy_documents_organisationId_title_version_key" ON "policy_documents"("organisationId", "title", "version");
CREATE INDEX "policy_documents_organisationId_status_idx" ON "policy_documents"("organisationId", "status");
CREATE UNIQUE INDEX "policy_acknowledgements_policyDocumentId_userId_versionAcknowledged_key" ON "policy_acknowledgements"("policyDocumentId", "userId", "versionAcknowledged");
CREATE INDEX "policy_acknowledgements_userId_idx" ON "policy_acknowledgements"("userId");
CREATE INDEX "training_requirements_organisationId_status_idx" ON "training_requirements"("organisationId", "status");
CREATE INDEX "training_completion_records_requirementId_idx" ON "training_completion_records"("requirementId");
CREATE INDEX "training_completion_records_userId_idx" ON "training_completion_records"("userId");
CREATE INDEX "provider_accreditation_applications_organisationId_status_idx" ON "provider_accreditation_applications"("organisationId", "status");
CREATE INDEX "provider_accreditation_applications_frameworkId_idx" ON "provider_accreditation_applications"("frameworkId");
CREATE INDEX "provider_accreditation_applications_accessAccreditationAssessmentId_idx" ON "provider_accreditation_applications"("accessAccreditationAssessmentId");
CREATE INDEX "provider_accreditation_application_evidence_applicationId_idx" ON "provider_accreditation_application_evidence"("applicationId");
CREATE INDEX "provider_accreditation_assessments_applicationId_idx" ON "provider_accreditation_assessments"("applicationId");
CREATE INDEX "provider_accreditation_assessments_assessorId_idx" ON "provider_accreditation_assessments"("assessorId");
CREATE INDEX "provider_accreditation_clarifications_applicationId_idx" ON "provider_accreditation_clarifications"("applicationId");
CREATE INDEX "provider_accreditation_decisions_applicationId_idx" ON "provider_accreditation_decisions"("applicationId");
CREATE INDEX "provider_accreditation_decisions_deciderId_idx" ON "provider_accreditation_decisions"("deciderId");
CREATE INDEX "provider_accreditation_appeal_records_applicationId_idx" ON "provider_accreditation_appeal_records"("applicationId");
CREATE INDEX "provider_accreditation_application_events_applicationId_createdAt_idx" ON "provider_accreditation_application_events"("applicationId", "createdAt");

ALTER TABLE "standard_outcomes" ADD CONSTRAINT "standard_outcomes_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "standard_frameworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "standard_indicators" ADD CONSTRAINT "standard_indicators_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "standard_outcomes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "evidence_requirements" ADD CONSTRAINT "evidence_requirements_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "standard_indicators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "compliance_evidence" ADD CONSTRAINT "compliance_evidence_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "compliance_evidence" ADD CONSTRAINT "compliance_evidence_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "evidence_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "compliance_evidence" ADD CONSTRAINT "compliance_evidence_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "compliance_evidence" ADD CONSTRAINT "compliance_evidence_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "compliance_evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "evidence_assessments" ADD CONSTRAINT "evidence_assessments_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "compliance_evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "evidence_assessments" ADD CONSTRAINT "evidence_assessments_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quality_audit_plans" ADD CONSTRAINT "quality_audit_plans_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quality_audit_plans" ADD CONSTRAINT "quality_audit_plans_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quality_audit_findings" ADD CONSTRAINT "quality_audit_findings_auditPlanId_fkey" FOREIGN KEY ("auditPlanId") REFERENCES "quality_audit_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quality_audit_findings" ADD CONSTRAINT "quality_audit_findings_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quality_audit_findings" ADD CONSTRAINT "quality_audit_findings_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "standard_indicators"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quality_audit_findings" ADD CONSTRAINT "quality_audit_findings_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quality_audit_finding_history" ADD CONSTRAINT "quality_audit_finding_history_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "quality_audit_findings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "quality_audit_findings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "corrective_action_history" ADD CONSTRAINT "corrective_action_history_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "corrective_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "corrective_action_history" ADD CONSTRAINT "corrective_action_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "improvement_actions" ADD CONSTRAINT "improvement_actions_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "improvement_action_history" ADD CONSTRAINT "improvement_action_history_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "improvement_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "improvement_action_history" ADD CONSTRAINT "improvement_action_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "policy_documents" ADD CONSTRAINT "policy_documents_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "policy_acknowledgements" ADD CONSTRAINT "policy_acknowledgements_policyDocumentId_fkey" FOREIGN KEY ("policyDocumentId") REFERENCES "policy_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "policy_acknowledgements" ADD CONSTRAINT "policy_acknowledgements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "training_requirements" ADD CONSTRAINT "training_requirements_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "training_completion_records" ADD CONSTRAINT "training_completion_records_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "training_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "training_completion_records" ADD CONSTRAINT "training_completion_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_accreditation_applications" ADD CONSTRAINT "provider_accreditation_applications_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_accreditation_applications" ADD CONSTRAINT "provider_accreditation_applications_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "standard_frameworks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "provider_accreditation_applications" ADD CONSTRAINT "provider_accreditation_applications_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "provider_accreditation_applications" ADD CONSTRAINT "provider_accreditation_applications_accessAccreditationAssessmentId_fkey" FOREIGN KEY ("accessAccreditationAssessmentId") REFERENCES "access_accreditation_assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "provider_accreditation_application_evidence" ADD CONSTRAINT "provider_accreditation_application_evidence_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "provider_accreditation_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_accreditation_application_evidence" ADD CONSTRAINT "provider_accreditation_application_evidence_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "evidence_requirements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "provider_accreditation_assessments" ADD CONSTRAINT "provider_accreditation_assessments_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "provider_accreditation_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_accreditation_assessments" ADD CONSTRAINT "provider_accreditation_assessments_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "provider_accreditation_clarifications" ADD CONSTRAINT "provider_accreditation_clarifications_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "provider_accreditation_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_accreditation_clarifications" ADD CONSTRAINT "provider_accreditation_clarifications_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "provider_accreditation_decisions" ADD CONSTRAINT "provider_accreditation_decisions_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "provider_accreditation_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_accreditation_decisions" ADD CONSTRAINT "provider_accreditation_decisions_deciderId_fkey" FOREIGN KEY ("deciderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "provider_accreditation_appeal_records" ADD CONSTRAINT "provider_accreditation_appeal_records_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "provider_accreditation_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_accreditation_appeal_records" ADD CONSTRAINT "provider_accreditation_appeal_records_appellantId_fkey" FOREIGN KEY ("appellantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "provider_accreditation_appeal_records" ADD CONSTRAINT "provider_accreditation_appeal_records_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "provider_accreditation_application_events" ADD CONSTRAINT "provider_accreditation_application_events_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "provider_accreditation_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
