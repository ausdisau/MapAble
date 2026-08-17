-- CreateEnum
CREATE TYPE "RideRunStatus" AS ENUM ('planning', 'open', 'locked', 'in_progress', 'completed', 'cancelled');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "transportTripId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_transportTripId_key" ON "Booking"("transportTripId");

-- AlterTable
ALTER TABLE "transport_trips" ADD COLUMN "rideRunId" TEXT;

-- CreateIndex
CREATE INDEX "transport_trips_rideRunId_idx" ON "transport_trips"("rideRunId");

-- CreateTable
CREATE TABLE "ride_runs" (
    "id" TEXT NOT NULL,
    "providerOrganisationId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3),
    "maxPassengers" INTEGER NOT NULL DEFAULT 4,
    "status" "RideRunStatus" NOT NULL DEFAULT 'planning',
    "requiresHumanReview" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ride_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ride_runs_providerOrganisationId_status_idx" ON "ride_runs"("providerOrganisationId", "status");
CREATE INDEX "ride_runs_scheduledStart_idx" ON "ride_runs"("scheduledStart");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_transportTripId_fkey" FOREIGN KEY ("transportTripId") REFERENCES "transport_trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_trips" ADD CONSTRAINT "transport_trips_rideRunId_fkey" FOREIGN KEY ("rideRunId") REFERENCES "ride_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride_runs" ADD CONSTRAINT "ride_runs_providerOrganisationId_fkey" FOREIGN KEY ("providerOrganisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride_runs" ADD CONSTRAINT "ride_runs_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride_runs" ADD CONSTRAINT "ride_runs_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "transport_drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
