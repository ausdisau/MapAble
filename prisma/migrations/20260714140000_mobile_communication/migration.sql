-- CreateEnum
CREATE TYPE "CommunicationPassportStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "AacMethodType" AS ENUM ('text_to_speech', 'picture_board', 'sign_language_interpreter', 'written', 'gesture', 'device', 'other');

-- CreateTable
CREATE TABLE "communication_passports" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'My communication passport',
    "status" "CommunicationPassportStatus" NOT NULL DEFAULT 'draft',
    "aboutMe" TEXT,
    "howICommunicate" TEXT,
    "pleaseDo" TEXT,
    "pleaseDont" TEXT,
    "capacityNotes" TEXT,
    "shareScope" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_passports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferred_questions" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "responseHint" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preferred_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_phrases" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_phrases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aac_method_preferences" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "method" "AacMethodType" NOT NULL,
    "label" TEXT,
    "preferred" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aac_method_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_communication_cards" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "medicalNotes" TEXT,
    "communicationNeeds" TEXT,
    "accessInstructions" TEXT,
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_communication_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "communication_passports_participantId_idx" ON "communication_passports"("participantId");

-- CreateIndex
CREATE INDEX "preferred_questions_passportId_idx" ON "preferred_questions"("passportId");

-- CreateIndex
CREATE INDEX "saved_phrases_passportId_idx" ON "saved_phrases"("passportId");

-- CreateIndex
CREATE INDEX "aac_method_preferences_passportId_idx" ON "aac_method_preferences"("passportId");

-- CreateIndex
CREATE UNIQUE INDEX "emergency_communication_cards_passportId_key" ON "emergency_communication_cards"("passportId");

-- AddForeignKey
ALTER TABLE "communication_passports" ADD CONSTRAINT "communication_passports_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferred_questions" ADD CONSTRAINT "preferred_questions_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "communication_passports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_phrases" ADD CONSTRAINT "saved_phrases_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "communication_passports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aac_method_preferences" ADD CONSTRAINT "aac_method_preferences_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "communication_passports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_communication_cards" ADD CONSTRAINT "emergency_communication_cards_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "communication_passports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
