ALTER TABLE "StaffPayout"
ADD COLUMN "manualClockedHours" INTEGER,
ADD COLUMN "manualAdjustedAt" TIMESTAMP(3),
ADD COLUMN "manualAdjustedById" TEXT,
ADD COLUMN "manualAdjustmentNotes" TEXT;

CREATE INDEX "StaffPayout_manualAdjustedById_idx" ON "StaffPayout"("manualAdjustedById");
