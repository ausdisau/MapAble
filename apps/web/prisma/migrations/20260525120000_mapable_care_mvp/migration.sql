-- MapAble Care MVP — repaired for migrate-from-zero (migration-trust).
-- Historical stub assumed `prisma db push`. Transport scheduling migration
-- `20260527120000_transport_scheduling_routing` FKs to IncidentReport, which was
-- never created by an earlier additive migration on empty DB. Minimal DDL below
-- unblocks that dependency. Broader Care* DDL remains owned by later migrations /
-- schema; see docs/remediation/MIGRATE_FROM_ZERO_REPAIR.md.

-- CreateEnum
CREATE TYPE "IncidentCategory" AS ENUM (
  'late_or_no_show',
  'access_need_not_met',
  'unsafe_transport',
  'unsafe_care',
  'injury_or_health_event',
  'privacy_concern',
  'worker_conduct',
  'driver_conduct',
  'property_damage',
  'complaint',
  'safeguarding_concern',
  'possible_reportable_incident',
  'other'
);

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM (
  'draft',
  'submitted',
  'triage',
  'under_review',
  'awaiting_provider_response',
  'escalated',
  'resolved',
  'closed'
);

-- CreateTable
CREATE TABLE "IncidentReport" (
    "id" TEXT NOT NULL,
    "category" "IncidentCategory" NOT NULL,
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'medium',
    "status" "IncidentStatus" NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "participantId" TEXT,
    "bookingId" TEXT,
    "careShiftId" TEXT,
    "transportBookingId" TEXT,
    "organisationId" TEXT,
    "workerProfileId" TEXT,
    "driverProfileId" TEXT,
    "vehicleId" TEXT,
    "reportedById" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3),
    "immediateRiskPresent" BOOLEAN NOT NULL DEFAULT false,
    "possibleReportableIncident" BOOLEAN NOT NULL DEFAULT false,
    "safeguardingConcern" BOOLEAN NOT NULL DEFAULT false,
    "adminOwnerId" TEXT,
    "adminAcknowledgedAt" TIMESTAMP(3),
    "resolutionSummary" TEXT,
    "externalReportRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "IncidentReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "IncidentReport_status_severity_idx" ON "IncidentReport"("status", "severity");

ALTER TABLE "IncidentReport" ADD CONSTRAINT "IncidentReport_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IncidentReport" ADD CONSTRAINT "IncidentReport_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
