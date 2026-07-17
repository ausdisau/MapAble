-- CreateEnum
CREATE TYPE "CareRecurringScheduleStatus" AS ENUM ('draft', 'active', 'paused', 'ended');

-- CreateEnum
CREATE TYPE "CareScheduleExceptionType" AS ENUM ('skip', 'reschedule');

-- CreateTable
CREATE TABLE "care_recurring_schedules" (
    "id" TEXT NOT NULL,
    "careBookingId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "byWeekday" INTEGER[],
    "startTimeLocal" TEXT NOT NULL,
    "endTimeLocal" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Australia/Sydney',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "status" "CareRecurringScheduleStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_recurring_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_recurring_schedule_exceptions" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "occurrenceDate" DATE NOT NULL,
    "type" "CareScheduleExceptionType" NOT NULL,
    "newStartAt" TIMESTAMP(3),
    "newEndAt" TIMESTAMP(3),
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "care_recurring_schedule_exceptions_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "CareShift" ADD COLUMN "recurringScheduleId" TEXT;
ALTER TABLE "CareShift" ADD COLUMN "occurrenceDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "care_recurring_schedules_careBookingId_status_idx" ON "care_recurring_schedules"("careBookingId", "status");
CREATE INDEX "care_recurring_schedules_participantId_idx" ON "care_recurring_schedules"("participantId");
CREATE UNIQUE INDEX "care_recurring_schedule_exceptions_scheduleId_occurrenceDate_key" ON "care_recurring_schedule_exceptions"("scheduleId", "occurrenceDate");
CREATE INDEX "CareShift_recurringScheduleId_occurrenceDate_idx" ON "CareShift"("recurringScheduleId", "occurrenceDate");

-- AddForeignKey
ALTER TABLE "care_recurring_schedules" ADD CONSTRAINT "care_recurring_schedules_careBookingId_fkey" FOREIGN KEY ("careBookingId") REFERENCES "care_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "care_recurring_schedule_exceptions" ADD CONSTRAINT "care_recurring_schedule_exceptions_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "care_recurring_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareShift" ADD CONSTRAINT "CareShift_recurringScheduleId_fkey" FOREIGN KEY ("recurringScheduleId") REFERENCES "care_recurring_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
