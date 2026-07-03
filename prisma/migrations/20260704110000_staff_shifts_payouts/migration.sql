CREATE TYPE "public"."PayoutPreference" AS ENUM ('DAILY', 'EVERY_TWO_DAYS');

CREATE TYPE "public"."PayoutStatus" AS ENUM ('PENDING', 'COMPLETED');

ALTER TABLE "public"."StaffUser"
ADD COLUMN "payoutPreference" "public"."PayoutPreference" NOT NULL DEFAULT 'DAILY';

CREATE TABLE "public"."StaffShift" (
  "id" TEXT NOT NULL,
  "staffUserId" TEXT NOT NULL,
  "dateKey" TEXT NOT NULL,
  "clockInAt" TIMESTAMP(3) NOT NULL,
  "clockOutAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "StaffShift_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."StaffPayout" (
  "id" TEXT NOT NULL,
  "staffUserId" TEXT NOT NULL,
  "dateKey" TEXT NOT NULL,
  "status" "public"."PayoutStatus" NOT NULL DEFAULT 'PENDING',
  "payoutPreference" "public"."PayoutPreference" NOT NULL DEFAULT 'DAILY',
  "clockedHours" INTEGER NOT NULL DEFAULT 0,
  "basePayCents" INTEGER NOT NULL DEFAULT 0,
  "directCommissionCents" INTEGER NOT NULL DEFAULT 0,
  "targetBonusCents" INTEGER NOT NULL DEFAULT 0,
  "seniorOverrideCents" INTEGER NOT NULL DEFAULT 0,
  "totalPayoutCents" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3),
  "completedById" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "StaffPayout_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StaffShift_staffUserId_dateKey_idx" ON "public"."StaffShift"("staffUserId", "dateKey");
CREATE INDEX "StaffShift_dateKey_idx" ON "public"."StaffShift"("dateKey");
CREATE INDEX "StaffShift_clockInAt_idx" ON "public"."StaffShift"("clockInAt");

CREATE UNIQUE INDEX "StaffPayout_staffUserId_dateKey_key" ON "public"."StaffPayout"("staffUserId", "dateKey");
CREATE INDEX "StaffPayout_dateKey_idx" ON "public"."StaffPayout"("dateKey");
CREATE INDEX "StaffPayout_status_dateKey_idx" ON "public"."StaffPayout"("status", "dateKey");
CREATE INDEX "StaffPayout_completedById_idx" ON "public"."StaffPayout"("completedById");

ALTER TABLE "public"."StaffShift"
ADD CONSTRAINT "StaffShift_staffUserId_fkey"
FOREIGN KEY ("staffUserId") REFERENCES "public"."StaffUser"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."StaffPayout"
ADD CONSTRAINT "StaffPayout_staffUserId_fkey"
FOREIGN KEY ("staffUserId") REFERENCES "public"."StaffUser"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."StaffPayout"
ADD CONSTRAINT "StaffPayout_completedById_fkey"
FOREIGN KEY ("completedById") REFERENCES "public"."StaffUser"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
