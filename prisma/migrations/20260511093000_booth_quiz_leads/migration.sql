-- CreateEnum
CREATE TYPE "QuizLeadSource" AS ENUM ('POPUP_BOOTH', 'WEBSITE', 'QUIZ', 'INSTAGRAM', 'WHATSAPP', 'OTHER');

-- CreateEnum
CREATE TYPE "PurchaseIntent" AS ENUM ('BUY_TODAY', 'BUY_LATER', 'DISCOVERY_PACK', 'JUST_EXPLORING', 'GIFTING');

-- CreateTable
CREATE TABLE "QuizLead" (
    "id" TEXT NOT NULL,
    "leadNumber" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "ageRange" TEXT,
    "genderIdentity" TEXT,
    "city" TEXT,
    "eventName" TEXT,
    "source" "QuizLeadSource" NOT NULL DEFAULT 'POPUP_BOOTH',
    "resultScent" TEXT NOT NULL,
    "secondaryScent" TEXT,
    "purchaseIntent" "PurchaseIntent" NOT NULL DEFAULT 'JUST_EXPLORING',
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "answers" JSONB,
    "scores" JSONB,
    "notes" TEXT,
    "convertedCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuizLead_leadNumber_key" ON "QuizLead"("leadNumber");

-- CreateIndex
CREATE INDEX "QuizLead_createdAt_idx" ON "QuizLead"("createdAt");

-- CreateIndex
CREATE INDEX "QuizLead_resultScent_idx" ON "QuizLead"("resultScent");

-- CreateIndex
CREATE INDEX "QuizLead_source_idx" ON "QuizLead"("source");

-- CreateIndex
CREATE INDEX "QuizLead_purchaseIntent_idx" ON "QuizLead"("purchaseIntent");

-- CreateIndex
CREATE INDEX "QuizLead_convertedCustomerId_idx" ON "QuizLead"("convertedCustomerId");

-- AddForeignKey
ALTER TABLE "QuizLead" ADD CONSTRAINT "QuizLead_convertedCustomerId_fkey" FOREIGN KEY ("convertedCustomerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
