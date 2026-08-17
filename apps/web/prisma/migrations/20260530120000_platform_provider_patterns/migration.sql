-- Platform provider patterns MVP

-- CreateEnum
CREATE TYPE "OnboardingRole" AS ENUM ('participant', 'worker', 'provider');
CREATE TYPE "ConsentShareMode" AS ENUM ('once', 'always_for_service', 'deny');
CREATE TYPE "ConsentRecipientType" AS ENUM ('organisation', 'worker', 'plan_manager', 'support_coordinator', 'platform');
CREATE TYPE "BillingAdminApprovalStatus" AS ENUM ('draft', 'pending_approval', 'approved', 'disputed');
CREATE TYPE "BookingGraphEntityType" AS ENUM ('care_shift', 'transport_booking', 'booking_segment', 'calendar_event');
CREATE TYPE "BookingGraphDependencyType" AS ENUM ('must_finish_before', 'requires_buffer', 'same_worker_exclusive');
CREATE TYPE "TrustSafetyQueueSource" AS ENUM ('incident', 'complaint', 'disputed_service_log', 'repeated_cancellation', 'worker_boundary');
CREATE TYPE "TrustSafetyQueueStatus" AS ENUM ('open', 'acknowledged', 'investigating', 'escalated', 'resolved', 'closed');
CREATE TYPE "AgentRunType" AS ENUM ('intake', 'care_plan', 'transport', 'matching', 'billing', 'guardrail', 'safeguarding_triage', 'feedback', 'category_classifier');
CREATE TYPE "AgentRunStatus" AS ENUM ('started', 'completed', 'failed', 'reviewed', 'blocked');
CREATE TYPE "AgentRiskTier" AS ENUM ('low', 'medium', 'high', 'critical');

-- AlterTable
ALTER TABLE "ConsentRecord" ADD COLUMN "shareMode" "ConsentShareMode",
ADD COLUMN "recipientType" "ConsentRecipientType",
ADD COLUMN "dataScope" JSONB,
ADD COLUMN "sourceAction" TEXT;

ALTER TABLE "TransportBooking" ADD COLUMN "careShiftId" TEXT;
CREATE INDEX "TransportBooking_careShiftId_idx" ON "TransportBooking"("careShiftId");

ALTER TABLE "care_requests" ADD COLUMN "intakeMetadata" JSONB;

ALTER TABLE "BillingInvoice" ADD COLUMN "adminApprovalStatus" "BillingAdminApprovalStatus" NOT NULL DEFAULT 'draft',
ADD COLUMN "disputedAt" TIMESTAMP(3),
ADD COLUMN "disputeReason" TEXT,
ADD COLUMN "anomalyFlags" JSONB;
CREATE INDEX "BillingInvoice_adminApprovalStatus_idx" ON "BillingInvoice"("adminApprovalStatus");

ALTER TABLE "MatchDecision" ADD COLUMN "participantConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "participantConfirmedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "onboarding_profiles" (
    "id" TEXT NOT NULL,
    "role" "OnboardingRole" NOT NULL,
    "userId" TEXT,
    "organisationId" TEXT,
    "workerProfileId" TEXT,
    "profileCompletenessScore" INTEGER NOT NULL DEFAULT 0,
    "readyToMatch" BOOLEAN NOT NULL DEFAULT false,
    "checklistJson" JSONB NOT NULL DEFAULT '[]',
    "lastEvaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_journey_sessions" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "graphJson" JSONB NOT NULL DEFAULT '{}',
    "pendingConfirmationGate" TEXT,
    "careRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_journey_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "booking_graph_nodes" (
    "id" TEXT NOT NULL,
    "entityType" "BookingGraphEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "label" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_graph_nodes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "booking_graph_edges" (
    "id" TEXT NOT NULL,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,
    "dependencyType" "BookingGraphDependencyType" NOT NULL,
    "bufferMinutes" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_graph_edges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trust_safety_queue_items" (
    "id" TEXT NOT NULL,
    "source" "TrustSafetyQueueSource" NOT NULL,
    "status" "TrustSafetyQueueStatus" NOT NULL DEFAULT 'open',
    "escalationLevel" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "participantId" TEXT,
    "organisationId" TEXT,
    "incidentId" TEXT,
    "complaintId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "trust_safety_queue_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "complaints" (
    "id" TEXT NOT NULL,
    "participantId" TEXT,
    "organisationId" TEXT,
    "reportedById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TrustSafetyQueueStatus" NOT NULL DEFAULT 'open',
    "escalationLevel" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'participant',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_runs" (
    "id" TEXT NOT NULL,
    "agentType" "AgentRunType" NOT NULL,
    "status" "AgentRunStatus" NOT NULL DEFAULT 'started',
    "riskTier" "AgentRiskTier" NOT NULL DEFAULT 'low',
    "humanReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "participantConfirmationRequired" BOOLEAN NOT NULL DEFAULT false,
    "inputSummary" JSONB,
    "outputSummary" JSONB,
    "toolsCalled" JSONB NOT NULL DEFAULT '[]',
    "guardrailsTriggered" JSONB NOT NULL DEFAULT '[]',
    "participantId" TEXT,
    "careRequestId" TEXT,
    "matchRunId" TEXT,
    "aiMatchRunId" TEXT,
    "billingInvoiceId" TEXT,
    "auditEventId" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reliability_snapshots" (
    "id" TEXT NOT NULL,
    "workerProfileId" TEXT,
    "organisationId" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lateRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cancellationRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "incidentCount" INTEGER NOT NULL DEFAULT 0,
    "complaintCount" INTEGER NOT NULL DEFAULT 0,
    "responseTimeP50Ms" INTEGER,
    "advisorySummary" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reliability_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoice_line_evidence" (
    "id" TEXT NOT NULL,
    "lineItemId" TEXT NOT NULL,
    "careServiceLogId" TEXT,
    "careShiftId" TEXT,
    "participantSafeDescription" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_line_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_profiles_workerProfileId_key" ON "onboarding_profiles"("workerProfileId");
CREATE UNIQUE INDEX "onboarding_profiles_userId_role_key" ON "onboarding_profiles"("userId", "role");
CREATE UNIQUE INDEX "onboarding_profiles_organisationId_role_key" ON "onboarding_profiles"("organisationId", "role");
CREATE INDEX "onboarding_profiles_organisationId_role_idx" ON "onboarding_profiles"("organisationId", "role");

CREATE UNIQUE INDEX "support_journey_sessions_participantId_sessionId_key" ON "support_journey_sessions"("participantId", "sessionId");
CREATE INDEX "support_journey_sessions_participantId_idx" ON "support_journey_sessions"("participantId");

CREATE UNIQUE INDEX "booking_graph_nodes_entityType_entityId_key" ON "booking_graph_nodes"("entityType", "entityId");
CREATE INDEX "booking_graph_edges_fromNodeId_idx" ON "booking_graph_edges"("fromNodeId");
CREATE INDEX "booking_graph_edges_toNodeId_idx" ON "booking_graph_edges"("toNodeId");

CREATE INDEX "trust_safety_queue_items_status_source_idx" ON "trust_safety_queue_items"("status", "source");
CREATE INDEX "trust_safety_queue_items_participantId_idx" ON "trust_safety_queue_items"("participantId");
CREATE INDEX "complaints_status_idx" ON "complaints"("status");

CREATE INDEX "agent_runs_agentType_status_idx" ON "agent_runs"("agentType", "status");
CREATE INDEX "agent_runs_participantId_idx" ON "agent_runs"("participantId");

CREATE INDEX "reliability_snapshots_workerProfileId_periodEnd_idx" ON "reliability_snapshots"("workerProfileId", "periodEnd");
CREATE INDEX "reliability_snapshots_organisationId_periodEnd_idx" ON "reliability_snapshots"("organisationId", "periodEnd");

CREATE INDEX "invoice_line_evidence_lineItemId_idx" ON "invoice_line_evidence"("lineItemId");

-- AddForeignKey
ALTER TABLE "onboarding_profiles" ADD CONSTRAINT "onboarding_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "onboarding_profiles" ADD CONSTRAINT "onboarding_profiles_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "onboarding_profiles" ADD CONSTRAINT "onboarding_profiles_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "support_journey_sessions" ADD CONSTRAINT "support_journey_sessions_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "booking_graph_edges" ADD CONSTRAINT "booking_graph_edges_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "booking_graph_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_graph_edges" ADD CONSTRAINT "booking_graph_edges_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "booking_graph_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "complaints" ADD CONSTRAINT "complaints_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "invoice_line_evidence" ADD CONSTRAINT "invoice_line_evidence_lineItemId_fkey" FOREIGN KEY ("lineItemId") REFERENCES "BillingInvoiceLineItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
