-- AlterEnum
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'transport_trip_access';

-- CreateEnum
CREATE TYPE "TransportTripStatus" AS ENUM ('requested', 'provider_review', 'accepted', 'dispatch_pending', 'driver_vehicle_assigned', 'driver_accepted', 'pre_start_check_required', 'en_route_to_pickup', 'arrived_at_pickup', 'participant_boarded', 'en_route_to_dropoff', 'arrived_at_dropoff', 'handover_completed', 'trip_completed', 'evidence_submitted', 'participant_review', 'closed', 'cancelled', 'declined', 'driver_no_show', 'participant_no_show', 'handover_failed', 'unsafe_to_continue', 'disputed', 'service_recovery_required');
CREATE TYPE "TransportRoutingProvider" AS ENUM ('mock', 'osrm', 'graphhopper', 'openrouteservice', 'disabled');
CREATE TYPE "TransportOptimisationJobStatus" AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE "TransportVerificationKind" AS ENUM ('licence', 'screening', 'training', 'registration', 'insurance', 'inspection', 'access_equipment');
CREATE TYPE "TransportVerificationStatus" AS ENUM ('not_provided', 'pending_review', 'verified', 'expired', 'rejected');
CREATE TYPE "TransportStopType" AS ENUM ('pickup', 'dropoff', 'waypoint');
CREATE TYPE "TransportDataAccessType" AS ENUM ('read_list', 'read_detail', 'location_stream');
CREATE TYPE "TransportSafetyEventSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateTable
CREATE TABLE "data_access_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorRole" "MapAbleUserRole",
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "accessType" "TransportDataAccessType" NOT NULL,
    "participantId" TEXT,
    "organisationId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "data_access_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_trip_requests" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "providerOrganisationId" TEXT,
    "pickupAddress" TEXT NOT NULL,
    "pickupSuburb" TEXT,
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "dropoffAddress" TEXT NOT NULL,
    "dropoffSuburb" TEXT,
    "dropoffLat" DOUBLE PRECISION,
    "dropoffLng" DOUBLE PRECISION,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3),
    "accessNotes" TEXT,
    "mobilityRequirements" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transport_trip_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_trips" (
    "id" TEXT NOT NULL,
    "tripRequestId" TEXT,
    "participantId" TEXT NOT NULL,
    "providerOrganisationId" TEXT,
    "legacyTransportBookingId" TEXT,
    "status" "TransportTripStatus" NOT NULL DEFAULT 'requested',
    "pickupAddress" TEXT NOT NULL,
    "pickupSuburb" TEXT,
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "dropoffAddress" TEXT NOT NULL,
    "dropoffSuburb" TEXT,
    "dropoffLat" DOUBLE PRECISION,
    "dropoffLng" DOUBLE PRECISION,
    "accessNotes" TEXT,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3),
    "mobilityRequirements" JSONB NOT NULL DEFAULT '{}',
    "disputeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transport_trips_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_trip_stops" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "stopType" "TransportStopType" NOT NULL,
    "label" TEXT,
    "address" TEXT NOT NULL,
    "suburb" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "windowStart" TIMESTAMP(3),
    "windowEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_trip_stops_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_trip_events" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "fromStatus" "TransportTripStatus",
    "toStatus" "TransportTripStatus",
    "eventType" TEXT NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_trip_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_recurring_schedules" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "providerOrganisationId" TEXT,
    "rruleJson" JSONB NOT NULL,
    "templatePickupAddress" TEXT NOT NULL,
    "templateDropoffAddress" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transport_recurring_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_drivers" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "driverProfileId" TEXT,
    "displayName" TEXT NOT NULL,
    "userId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transport_drivers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_vehicles" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "displayName" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transport_vehicles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_vehicle_features" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "wheelchairAccessible" BOOLEAN NOT NULL DEFAULT false,
    "rampAvailable" BOOLEAN NOT NULL DEFAULT false,
    "liftAvailable" BOOLEAN NOT NULL DEFAULT false,
    "hoistAvailable" BOOLEAN NOT NULL DEFAULT false,
    "assistanceAnimalFriendly" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    CONSTRAINT "transport_vehicle_features_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_driver_verifications" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "kind" "TransportVerificationKind" NOT NULL,
    "status" "TransportVerificationStatus" NOT NULL DEFAULT 'pending_review',
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transport_driver_verifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_vehicle_verifications" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "kind" "TransportVerificationKind" NOT NULL,
    "status" "TransportVerificationStatus" NOT NULL DEFAULT 'pending_review',
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transport_vehicle_verifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_driver_availability" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "transport_driver_availability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_vehicle_availability" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "transport_vehicle_availability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_dispatch_assignments" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "driverId" TEXT,
    "vehicleId" TEXT,
    "assignedByUserId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassignedAt" TIMESTAMP(3),
    CONSTRAINT "transport_dispatch_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_schedule_conflicts" (
    "id" TEXT NOT NULL,
    "tripId" TEXT,
    "driverId" TEXT,
    "vehicleId" TEXT,
    "conflictType" TEXT NOT NULL,
    "details" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_schedule_conflicts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_route_estimates" (
    "id" TEXT NOT NULL,
    "tripId" TEXT,
    "provider" "TransportRoutingProvider" NOT NULL,
    "distanceMetres" INTEGER NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "advisoryOnly" BOOLEAN NOT NULL DEFAULT true,
    "cacheKey" TEXT,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_route_estimates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_route_segments" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "fromLat" DOUBLE PRECISION NOT NULL,
    "fromLng" DOUBLE PRECISION NOT NULL,
    "toLat" DOUBLE PRECISION NOT NULL,
    "toLng" DOUBLE PRECISION NOT NULL,
    "distanceMetres" INTEGER,
    "durationSeconds" INTEGER,
    CONSTRAINT "transport_route_segments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_route_optimisation_jobs" (
    "id" TEXT NOT NULL,
    "tripId" TEXT,
    "organisationId" TEXT,
    "provider" "TransportRoutingProvider" NOT NULL,
    "status" "TransportOptimisationJobStatus" NOT NULL DEFAULT 'pending',
    "requiresHumanReview" BOOLEAN NOT NULL DEFAULT true,
    "inputPayload" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transport_route_optimisation_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_route_optimisation_results" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "suggestionPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_route_optimisation_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_live_locations" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "driverId" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_live_locations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_eta_events" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "etaMinutes" INTEGER,
    "distanceMetres" INTEGER,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_eta_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_pickup_points" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "suburb" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "notes" TEXT,
    CONSTRAINT "transport_pickup_points_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_dropoff_points" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "suburb" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "notes" TEXT,
    CONSTRAINT "transport_dropoff_points_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_safety_checks" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "notes" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_safety_checks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_trip_evidence" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "notes" TEXT,
    "metadata" JSONB,
    "submittedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_trip_evidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_handover_records" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_handover_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_safety_events" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "severity" "TransportSafetyEventSeverity" NOT NULL DEFAULT 'medium',
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reportedByUserId" TEXT,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_safety_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transport_incident_links" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "safetyEventId" TEXT,
    "incidentReportId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_incident_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transport_trips_tripRequestId_key" ON "transport_trips"("tripRequestId");
CREATE INDEX "data_access_logs_resourceType_resourceId_idx" ON "data_access_logs"("resourceType", "resourceId");
CREATE INDEX "data_access_logs_actorUserId_createdAt_idx" ON "data_access_logs"("actorUserId", "createdAt");
CREATE INDEX "transport_trip_requests_participantId_status_idx" ON "transport_trip_requests"("participantId", "status");
CREATE INDEX "transport_trips_participantId_status_idx" ON "transport_trips"("participantId", "status");
CREATE INDEX "transport_trips_providerOrganisationId_status_idx" ON "transport_trips"("providerOrganisationId", "status");
CREATE INDEX "transport_trips_scheduledStart_idx" ON "transport_trips"("scheduledStart");
CREATE UNIQUE INDEX "transport_trip_stops_tripId_sequence_key" ON "transport_trip_stops"("tripId", "sequence");
CREATE INDEX "transport_trip_events_tripId_createdAt_idx" ON "transport_trip_events"("tripId", "createdAt");
CREATE INDEX "transport_recurring_schedules_participantId_idx" ON "transport_recurring_schedules"("participantId");
CREATE INDEX "transport_drivers_organisationId_idx" ON "transport_drivers"("organisationId");
CREATE INDEX "transport_vehicles_organisationId_idx" ON "transport_vehicles"("organisationId");
CREATE INDEX "transport_driver_verifications_driverId_kind_idx" ON "transport_driver_verifications"("driverId", "kind");
CREATE INDEX "transport_vehicle_verifications_vehicleId_kind_idx" ON "transport_vehicle_verifications"("vehicleId", "kind");
CREATE INDEX "transport_driver_availability_driverId_startAt_endAt_idx" ON "transport_driver_availability"("driverId", "startAt", "endAt");
CREATE INDEX "transport_vehicle_availability_vehicleId_startAt_endAt_idx" ON "transport_vehicle_availability"("vehicleId", "startAt", "endAt");
CREATE INDEX "transport_dispatch_assignments_tripId_active_idx" ON "transport_dispatch_assignments"("tripId", "active");
CREATE INDEX "transport_dispatch_assignments_driverId_idx" ON "transport_dispatch_assignments"("driverId");
CREATE INDEX "transport_route_estimates_tripId_createdAt_idx" ON "transport_route_estimates"("tripId", "createdAt");
CREATE INDEX "transport_live_locations_tripId_recordedAt_idx" ON "transport_live_locations"("tripId", "recordedAt");

-- AddForeignKey
ALTER TABLE "data_access_logs" ADD CONSTRAINT "data_access_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transport_trip_requests" ADD CONSTRAINT "transport_trip_requests_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transport_trip_requests" ADD CONSTRAINT "transport_trip_requests_providerOrganisationId_fkey" FOREIGN KEY ("providerOrganisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transport_trips" ADD CONSTRAINT "transport_trips_tripRequestId_fkey" FOREIGN KEY ("tripRequestId") REFERENCES "transport_trip_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transport_trips" ADD CONSTRAINT "transport_trips_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transport_trips" ADD CONSTRAINT "transport_trips_providerOrganisationId_fkey" FOREIGN KEY ("providerOrganisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transport_trip_stops" ADD CONSTRAINT "transport_trip_stops_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_trip_events" ADD CONSTRAINT "transport_trip_events_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_trip_events" ADD CONSTRAINT "transport_trip_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transport_drivers" ADD CONSTRAINT "transport_drivers_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_drivers" ADD CONSTRAINT "transport_drivers_driverProfileId_fkey" FOREIGN KEY ("driverProfileId") REFERENCES "DriverProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transport_vehicles" ADD CONSTRAINT "transport_vehicles_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_vehicles" ADD CONSTRAINT "transport_vehicles_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transport_vehicle_features" ADD CONSTRAINT "transport_vehicle_features_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_driver_verifications" ADD CONSTRAINT "transport_driver_verifications_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "transport_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_vehicle_verifications" ADD CONSTRAINT "transport_vehicle_verifications_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_driver_availability" ADD CONSTRAINT "transport_driver_availability_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "transport_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_vehicle_availability" ADD CONSTRAINT "transport_vehicle_availability_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_dispatch_assignments" ADD CONSTRAINT "transport_dispatch_assignments_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_dispatch_assignments" ADD CONSTRAINT "transport_dispatch_assignments_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "transport_drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transport_dispatch_assignments" ADD CONSTRAINT "transport_dispatch_assignments_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transport_schedule_conflicts" ADD CONSTRAINT "transport_schedule_conflicts_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transport_schedule_conflicts" ADD CONSTRAINT "transport_schedule_conflicts_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "transport_drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transport_schedule_conflicts" ADD CONSTRAINT "transport_schedule_conflicts_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transport_route_estimates" ADD CONSTRAINT "transport_route_estimates_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transport_route_segments" ADD CONSTRAINT "transport_route_segments_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "transport_route_estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_route_optimisation_jobs" ADD CONSTRAINT "transport_route_optimisation_jobs_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transport_route_optimisation_results" ADD CONSTRAINT "transport_route_optimisation_results_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "transport_route_optimisation_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_live_locations" ADD CONSTRAINT "transport_live_locations_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_eta_events" ADD CONSTRAINT "transport_eta_events_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_pickup_points" ADD CONSTRAINT "transport_pickup_points_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_dropoff_points" ADD CONSTRAINT "transport_dropoff_points_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_safety_checks" ADD CONSTRAINT "transport_safety_checks_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_trip_evidence" ADD CONSTRAINT "transport_trip_evidence_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_handover_records" ADD CONSTRAINT "transport_handover_records_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_safety_events" ADD CONSTRAINT "transport_safety_events_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_incident_links" ADD CONSTRAINT "transport_incident_links_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transport_incident_links" ADD CONSTRAINT "transport_incident_links_safetyEventId_fkey" FOREIGN KEY ("safetyEventId") REFERENCES "transport_safety_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transport_incident_links" ADD CONSTRAINT "transport_incident_links_incidentReportId_fkey" FOREIGN KEY ("incidentReportId") REFERENCES "IncidentReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
