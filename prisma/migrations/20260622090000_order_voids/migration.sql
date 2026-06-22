CREATE TYPE "public"."OrderStatus" AS ENUM ('COMPLETED', 'VOIDED');

CREATE TYPE "public"."OrderVoidInventoryAction" AS ENUM ('RESTOCKED', 'KEPT_AS_TESTER');

ALTER TABLE "public"."Order"
ADD COLUMN "status" "public"."OrderStatus" NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN "voidedAt" TIMESTAMP(3),
ADD COLUMN "voidReason" TEXT,
ADD COLUMN "voidedByName" TEXT,
ADD COLUMN "voidInventoryAction" "public"."OrderVoidInventoryAction";

CREATE INDEX "Order_status_createdAt_idx" ON "public"."Order"("status", "createdAt");
