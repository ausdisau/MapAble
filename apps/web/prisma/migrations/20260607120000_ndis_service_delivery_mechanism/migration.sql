-- CreateEnum
CREATE TYPE "NdisServiceDeliveryMechanism" AS ENUM (
  'face_to_face',
  'non_face_to_face',
  'telehealth',
  'phone',
  'group',
  'centre_based',
  'remote_monitoring',
  'transport'
);

-- CreateEnum
CREATE TYPE "NdisDeliveryAuthorizationType" AS ENUM (
  'service_agreement',
  'ndia_service_booking',
  'plan_manager_approval',
  'participant_self_managed'
);

-- CreateEnum
CREATE TYPE "NdisDeliveryAuthorizationStatus" AS ENUM (
  'draft',
  'active',
  'suspended',
  'expired',
  'revoked'
);

-- CreateTable
CREATE TABLE "NdisServiceDeliveryAuthorization" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "providerOrgId" TEXT NOT NULL,
    "paymentRoute" "NdisPaymentRoute" NOT NULL,
    "deliveryMechanism" "NdisServiceDeliveryMechanism" NOT NULL,
    "authorizationType" "NdisDeliveryAuthorizationType" NOT NULL,
    "status" "NdisDeliveryAuthorizationStatus" NOT NULL DEFAULT 'draft',
    "supportItemCode" TEXT,
    "supportCategoryCode" TEXT,
    "serviceAgreementId" TEXT,
    "careBookingId" TEXT,
    "ndiaBookingReference" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "notes" TEXT,
    "metadataJson" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NdisServiceDeliveryAuthorization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NdisServiceDeliveryEvent" (
    "id" TEXT NOT NULL,
    "authorizationId" TEXT,
    "participantId" TEXT NOT NULL,
    "providerOrgId" TEXT NOT NULL,
    "deliveryMechanism" "NdisServiceDeliveryMechanism" NOT NULL,
    "paymentRoute" "NdisPaymentRoute" NOT NULL,
    "careShiftId" TEXT,
    "careServiceLogId" TEXT,
    "claimLineId" TEXT,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "quantityMinutes" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'recorded',
    "evidenceJson" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NdisServiceDeliveryEvent_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "care_service_logs" ADD COLUMN "deliveryMechanism" "NdisServiceDeliveryMechanism",
ADD COLUMN "deliveryAuthorizationId" TEXT;

-- AlterTable
ALTER TABLE "NdisClaimLine" ADD COLUMN "deliveryMechanism" "NdisServiceDeliveryMechanism",
ADD COLUMN "deliveryAuthorizationId" TEXT;

-- CreateIndex
CREATE INDEX "NdisServiceDeliveryAuthorization_participantId_providerOrgId__idx" ON "NdisServiceDeliveryAuthorization"("participantId", "providerOrgId", "status");

-- CreateIndex
CREATE INDEX "NdisServiceDeliveryAuthorization_providerOrgId_status_idx" ON "NdisServiceDeliveryAuthorization"("providerOrgId", "status");

-- CreateIndex
CREATE INDEX "NdisServiceDeliveryAuthorization_careBookingId_idx" ON "NdisServiceDeliveryAuthorization"("careBookingId");

-- CreateIndex
CREATE INDEX "NdisServiceDeliveryAuthorization_serviceAgreementId_idx" ON "NdisServiceDeliveryAuthorization"("serviceAgreementId");

-- CreateIndex
CREATE INDEX "NdisServiceDeliveryEvent_participantId_serviceDate_idx" ON "NdisServiceDeliveryEvent"("participantId", "serviceDate");

-- CreateIndex
CREATE INDEX "NdisServiceDeliveryEvent_providerOrgId_serviceDate_idx" ON "NdisServiceDeliveryEvent"("providerOrgId", "serviceDate");

-- CreateIndex
CREATE INDEX "NdisServiceDeliveryEvent_careShiftId_idx" ON "NdisServiceDeliveryEvent"("careShiftId");

-- CreateIndex
CREATE INDEX "NdisServiceDeliveryEvent_authorizationId_idx" ON "NdisServiceDeliveryEvent"("authorizationId");

-- CreateIndex
CREATE INDEX "NdisServiceDeliveryEvent_careServiceLogId_idx" ON "NdisServiceDeliveryEvent"("careServiceLogId");

-- CreateIndex
CREATE INDEX "NdisServiceDeliveryEvent_claimLineId_idx" ON "NdisServiceDeliveryEvent"("claimLineId");

-- CreateIndex
CREATE INDEX "care_service_logs_deliveryAuthorizationId_idx" ON "care_service_logs"("deliveryAuthorizationId");

-- CreateIndex
CREATE INDEX "NdisClaimLine_deliveryAuthorizationId_idx" ON "NdisClaimLine"("deliveryAuthorizationId");

-- AddForeignKey
ALTER TABLE "NdisServiceDeliveryAuthorization" ADD CONSTRAINT "NdisServiceDeliveryAuthorization_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdisServiceDeliveryAuthorization" ADD CONSTRAINT "NdisServiceDeliveryAuthorization_providerOrgId_fkey" FOREIGN KEY ("providerOrgId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdisServiceDeliveryAuthorization" ADD CONSTRAINT "NdisServiceDeliveryAuthorization_serviceAgreementId_fkey" FOREIGN KEY ("serviceAgreementId") REFERENCES "ServiceAgreement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdisServiceDeliveryAuthorization" ADD CONSTRAINT "NdisServiceDeliveryAuthorization_careBookingId_fkey" FOREIGN KEY ("careBookingId") REFERENCES "care_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdisServiceDeliveryEvent" ADD CONSTRAINT "NdisServiceDeliveryEvent_authorizationId_fkey" FOREIGN KEY ("authorizationId") REFERENCES "NdisServiceDeliveryAuthorization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdisServiceDeliveryEvent" ADD CONSTRAINT "NdisServiceDeliveryEvent_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdisServiceDeliveryEvent" ADD CONSTRAINT "NdisServiceDeliveryEvent_providerOrgId_fkey" FOREIGN KEY ("providerOrgId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdisServiceDeliveryEvent" ADD CONSTRAINT "NdisServiceDeliveryEvent_careServiceLogId_fkey" FOREIGN KEY ("careServiceLogId") REFERENCES "care_service_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdisServiceDeliveryEvent" ADD CONSTRAINT "NdisServiceDeliveryEvent_claimLineId_fkey" FOREIGN KEY ("claimLineId") REFERENCES "NdisClaimLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_service_logs" ADD CONSTRAINT "care_service_logs_deliveryAuthorizationId_fkey" FOREIGN KEY ("deliveryAuthorizationId") REFERENCES "NdisServiceDeliveryAuthorization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NdisClaimLine" ADD CONSTRAINT "NdisClaimLine_deliveryAuthorizationId_fkey" FOREIGN KEY ("deliveryAuthorizationId") REFERENCES "NdisServiceDeliveryAuthorization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
