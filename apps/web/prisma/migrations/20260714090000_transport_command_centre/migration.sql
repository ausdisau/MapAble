-- CreateEnum
CREATE TYPE "TransportTripDirection" AS ENUM ('standalone', 'outbound', 'return');
CREATE TYPE "ReturnTripAssuranceStatus" AS ENUM ('not_required', 'pending', 'assured', 'at_risk', 'missing');
CREATE TYPE "AccessibilityEvidenceKind" AS ENUM ('ramp_measurement', 'lift_capacity', 'door_width', 'floor_height', 'restraint_system', 'boarding_angle', 'wheelchair_space', 'other');
CREATE TYPE "MobilityDeviceType" AS ENUM ('manual_wheelchair', 'power_wheelchair', 'mobility_scooter', 'walker', 'other');
CREATE TYPE "RestraintType" AS ENUM ('wheelchair_tie_down', 'occupant_belt', 'scooter_lock', 'other');
CREATE TYPE "VehicleInspectionOutcome" AS ENUM ('pass', 'conditional', 'fail');
CREATE TYPE "TransportContinuityTrigger" AS ENUM ('driver_cancel', 'vehicle_failure', 'late_pickup', 'route_disruption', 'lift_outage', 'appointment_change', 'missing_return_trip');
CREATE TYPE "TransportContinuityRecoveryStatus" AS ENUM ('options_presented', 'awaiting_confirmation', 'confirmed', 'declined', 'expired', 'escalated');
CREATE TYPE "TransportDisruptionKind" AS ENUM ('route_disruption', 'lift_outage', 'service_alert', 'traffic_hazard', 'appointment_change', 'missing_return_trip');
CREATE TYPE "TransportDisruptionStatus" AS ENUM ('open', 'acknowledged', 'recovery_in_progress', 'resolved');

-- AlterTable
ALTER TABLE "transport_trips"
  ADD COLUMN "tripDirection" "TransportTripDirection" NOT NULL DEFAULT 'standalone',
  ADD COLUMN "outboundTripId" TEXT,
  ADD COLUMN "returnTripId" TEXT,
  ADD COLUMN "returnAssuranceStatus" "ReturnTripAssuranceStatus" NOT NULL DEFAULT 'not_required';

CREATE UNIQUE INDEX "transport_trips_outboundTripId_key" ON "transport_trips"("outboundTripId");
CREATE INDEX "transport_trips_returnTripId_idx" ON "transport_trips"("returnTripId");
CREATE INDEX "transport_trips_returnAssuranceStatus_idx" ON "transport_trips"("returnAssuranceStatus");

ALTER TABLE "transport_trips" ADD CONSTRAINT "transport_trips_outboundTripId_fkey"
  FOREIGN KEY ("outboundTripId") REFERENCES "transport_trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "vehicle_accessibility_evidence" (
  "id" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "kind" "AccessibilityEvidenceKind" NOT NULL,
  "source" TEXT NOT NULL,
  "measuredValue" TEXT,
  "unit" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "evidenceUrl" TEXT,
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vehicle_accessibility_evidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mobility_device_compatibilities" (
  "id" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "deviceType" "MobilityDeviceType" NOT NULL,
  "compatible" BOOLEAN NOT NULL DEFAULT false,
  "evidenceSource" TEXT NOT NULL,
  "maxWeightKg" DOUBLE PRECISION,
  "maxWidthMm" INTEGER,
  "maxLengthMm" INTEGER,
  "verifiedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "mobility_device_compatibilities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "restraint_capabilities" (
  "id" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "restraintType" "RestraintType" NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "evidenceSource" TEXT NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "restraint_capabilities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vehicle_inspections" (
  "id" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "inspectedAt" TIMESTAMP(3) NOT NULL,
  "outcome" "VehicleInspectionOutcome" NOT NULL,
  "inspectorName" TEXT,
  "evidenceSource" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "findings" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vehicle_inspections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_return_trip_assurances" (
  "id" TEXT NOT NULL,
  "outboundTripId" TEXT NOT NULL,
  "returnTripId" TEXT,
  "status" "ReturnTripAssuranceStatus" NOT NULL DEFAULT 'pending',
  "assuredByUserId" TEXT,
  "assuredAt" TIMESTAMP(3),
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "transport_return_trip_assurances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_continuity_recovery_requests" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "trigger" "TransportContinuityTrigger" NOT NULL,
  "status" "TransportContinuityRecoveryStatus" NOT NULL DEFAULT 'options_presented',
  "requiresConfirmation" BOOLEAN NOT NULL DEFAULT true,
  "confirmedByUserId" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "transport_continuity_recovery_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_continuity_recovery_options" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "optionKey" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "vehicleId" TEXT,
  "driverId" TEXT,
  "providerOrganisationId" TEXT,
  "isLiveData" BOOLEAN NOT NULL DEFAULT false,
  "nonLiveAlternative" BOOLEAN NOT NULL DEFAULT true,
  "evidenceSummary" TEXT,
  "metadata" JSONB,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "transport_continuity_recovery_options_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_disruption_events" (
  "id" TEXT NOT NULL,
  "tripId" TEXT,
  "participantId" TEXT,
  "kind" "TransportDisruptionKind" NOT NULL,
  "status" "TransportDisruptionStatus" NOT NULL DEFAULT 'open',
  "source" TEXT NOT NULL,
  "sourceFreshnessAt" TIMESTAMP(3),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "metadata" JSONB,
  "acknowledgedAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "transport_disruption_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicle_accessibility_evidence_vehicleId_kind_idx" ON "vehicle_accessibility_evidence"("vehicleId", "kind");
CREATE INDEX "vehicle_accessibility_evidence_expiresAt_idx" ON "vehicle_accessibility_evidence"("expiresAt");
CREATE UNIQUE INDEX "mobility_device_compatibilities_vehicleId_deviceType_key" ON "mobility_device_compatibilities"("vehicleId", "deviceType");
CREATE INDEX "mobility_device_compatibilities_vehicleId_compatible_idx" ON "mobility_device_compatibilities"("vehicleId", "compatible");
CREATE INDEX "mobility_device_compatibilities_expiresAt_idx" ON "mobility_device_compatibilities"("expiresAt");
CREATE INDEX "restraint_capabilities_vehicleId_restraintType_idx" ON "restraint_capabilities"("vehicleId", "restraintType");
CREATE INDEX "restraint_capabilities_expiresAt_idx" ON "restraint_capabilities"("expiresAt");
CREATE INDEX "vehicle_inspections_vehicleId_inspectedAt_idx" ON "vehicle_inspections"("vehicleId", "inspectedAt");
CREATE INDEX "vehicle_inspections_expiresAt_idx" ON "vehicle_inspections"("expiresAt");
CREATE INDEX "transport_return_trip_assurances_outboundTripId_status_idx" ON "transport_return_trip_assurances"("outboundTripId", "status");
CREATE INDEX "transport_return_trip_assurances_returnTripId_idx" ON "transport_return_trip_assurances"("returnTripId");
CREATE INDEX "transport_continuity_recovery_requests_tripId_status_idx" ON "transport_continuity_recovery_requests"("tripId", "status");
CREATE INDEX "transport_continuity_recovery_requests_participantId_status_idx" ON "transport_continuity_recovery_requests"("participantId", "status");
CREATE INDEX "transport_continuity_recovery_options_requestId_sortOrder_idx" ON "transport_continuity_recovery_options"("requestId", "sortOrder");
CREATE INDEX "transport_disruption_events_tripId_status_idx" ON "transport_disruption_events"("tripId", "status");
CREATE INDEX "transport_disruption_events_participantId_status_idx" ON "transport_disruption_events"("participantId", "status");
CREATE INDEX "transport_disruption_events_kind_status_idx" ON "transport_disruption_events"("kind", "status");

-- AddForeignKey
ALTER TABLE "vehicle_accessibility_evidence" ADD CONSTRAINT "vehicle_accessibility_evidence_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mobility_device_compatibilities" ADD CONSTRAINT "mobility_device_compatibilities_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "restraint_capabilities" ADD CONSTRAINT "restraint_capabilities_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_return_trip_assurances" ADD CONSTRAINT "transport_return_trip_assurances_outboundTripId_fkey"
  FOREIGN KEY ("outboundTripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_continuity_recovery_requests" ADD CONSTRAINT "transport_continuity_recovery_requests_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_continuity_recovery_options" ADD CONSTRAINT "transport_continuity_recovery_options_requestId_fkey"
  FOREIGN KEY ("requestId") REFERENCES "transport_continuity_recovery_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_disruption_events" ADD CONSTRAINT "transport_disruption_events_tripId_fkey"
  FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
