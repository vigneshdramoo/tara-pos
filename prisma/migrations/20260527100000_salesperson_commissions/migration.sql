-- Track which staff account captured each sale and persist calculated commission.
ALTER TABLE "public"."Order"
ADD COLUMN "commissionCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "salespersonId" TEXT;

ALTER TABLE "public"."OrderItem"
ADD COLUMN "commissionRateBps" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "commissionCents" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Order_salespersonId_idx" ON "public"."Order"("salespersonId");

ALTER TABLE "public"."Order"
ADD CONSTRAINT "Order_salespersonId_fkey"
FOREIGN KEY ("salespersonId") REFERENCES "public"."StaffUser"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Align the POS catalog with the current pop-up incentive scheme.
UPDATE "public"."Product"
SET "priceCents" = 16900
WHERE "sizeMl" = 50 AND "priceCents" = 15900;

UPDATE "public"."Product"
SET
  "sizeMl" = 8,
  "name" = REPLACE("name", '10mL', '8mL'),
  "sku" = REPLACE("sku", '-10-', '-8-')
WHERE "sizeMl" = 10 AND "priceCents" = 4500;

UPDATE "public"."OrderItem" AS oi
SET
  "commissionRateBps" = CASE
    WHEN p."sizeMl" = 50 THEN 1500
    WHEN p."sizeMl" > 0 AND p."sizeMl" <= 10 THEN 1000
    ELSE 0
  END,
  "commissionCents" = CASE
    WHEN p."sizeMl" = 50 THEN ROUND(oi."totalPriceCents" * 1500.0 / 10000.0)::INTEGER
    WHEN p."sizeMl" > 0 AND p."sizeMl" <= 10 THEN ROUND(oi."totalPriceCents" * 1000.0 / 10000.0)::INTEGER
    ELSE 0
  END
FROM "public"."Product" AS p
WHERE oi."productId" = p."id";

UPDATE "public"."Order" AS o
SET "commissionCents" = item_totals."commissionCents"
FROM (
  SELECT "orderId", COALESCE(SUM("commissionCents"), 0)::INTEGER AS "commissionCents"
  FROM "public"."OrderItem"
  GROUP BY "orderId"
) AS item_totals
WHERE o."id" = item_totals."orderId";
