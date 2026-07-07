-- CreateTable
CREATE TABLE "public"."Voucher" (
    "code" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "discountType" TEXT NOT NULL DEFAULT 'fixed',
    "value" DECIMAL(65,30) NOT NULL,
    "minSpend" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "winnerName" TEXT,
    "winnerContact" TEXT,
    "redeemedAt" TIMESTAMP(3),
    "redeemedChannel" TEXT,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE INDEX "Voucher_campaign_idx" ON "public"."Voucher"("campaign");
