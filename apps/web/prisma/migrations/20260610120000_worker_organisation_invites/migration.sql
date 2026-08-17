-- CreateEnum
CREATE TYPE "WorkerOrganisationInviteStatus" AS ENUM ('pending', 'accepted', 'expired', 'revoked');

-- AlterTable
ALTER TABLE "WorkerProfile" ADD COLUMN "invitedAt" TIMESTAMP(3),
ADD COLUMN "joinedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "WorkerOrganisationInvite" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "invitedByUserId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "WorkerOrganisationInviteStatus" NOT NULL DEFAULT 'pending',
    "displayName" TEXT,
    "workerProfileId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerOrganisationInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkerOrganisationInvite_token_key" ON "WorkerOrganisationInvite"("token");

-- CreateIndex
CREATE INDEX "WorkerOrganisationInvite_organisationId_status_idx" ON "WorkerOrganisationInvite"("organisationId", "status");

-- CreateIndex
CREATE INDEX "WorkerOrganisationInvite_email_status_idx" ON "WorkerOrganisationInvite"("email", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerProfile_userId_organisationId_key" ON "WorkerProfile"("userId", "organisationId");

-- AddForeignKey
ALTER TABLE "WorkerOrganisationInvite" ADD CONSTRAINT "WorkerOrganisationInvite_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerOrganisationInvite" ADD CONSTRAINT "WorkerOrganisationInvite_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerOrganisationInvite" ADD CONSTRAINT "WorkerOrganisationInvite_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
