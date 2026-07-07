/**
 * TARA POS — Voucher Module (final: uses lib/prisma.ts requirePrisma())
 * ---------------------------------------------------------------------
 * Prisma schema model required (add to prisma/schema.prisma):
 *
 *   model Voucher {
 *     code            String    @id
 *     campaign        String
 *     discountType    String    @default("fixed")
 *     value           Decimal
 *     minSpend        Decimal   @default(0)
 *     expiresAt       DateTime
 *     claimedAt       DateTime?          // winner DMed to activate
 *     winnerName      String?
 *     winnerContact   String?            // WhatsApp / IG handle
 *     redeemedAt      DateTime?          // null = still valid
 *     redeemedChannel String?            // "sunfest" | "scent-trail" | "online"
 *     orderId         String?
 *     createdAt       DateTime  @default(now())
 *
 *     @@index([campaign])
 *   }
 *
 * Then:  pnpm prisma migrate dev --name add_vouchers
 */

import { requirePrisma } from "@/lib/prisma";

const CAMPAIGN = "SUNFEST-2026";
const EXPIRES_AT = new Date("2026-08-15T23:59:59+08:00"); // <-- SunFest date + 30 days

/* ---------------- 1. BATCH IMPORT (the 50 SunFest codes) --------------- */
export async function importSunfestBatch(codes /* string[] */) {
  const prisma = requirePrisma();
  const { count } = await prisma.voucher.createMany({
    data: codes.map((code) => ({
      code,
      campaign: CAMPAIGN,
      value: 10,
      minSpend: 50,
      expiresAt: EXPIRES_AT,
    })),
    skipDuplicates: true, // safe to re-run
  });
  return count;
}

/* ---------------- 2. GENERATE FUTURE BATCHES in-app -------------------- */
const SAFE = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L
function randomCode(prefix = "TARA") {
  let s = "";
  const buf = crypto.getRandomValues(new Uint8Array(4));
  for (const b of buf) s += SAFE[b % SAFE.length];
  return `${prefix}-${s}`;
}

export async function generateBatch({ count, campaign, value, minSpend, expiresAt }) {
  const prisma = requirePrisma();
  const codes = new Set();
  while (codes.size < count) codes.add(randomCode());
  await prisma.voucher.createMany({
    data: [...codes].map((code) => ({
      code, campaign, value, minSpend, expiresAt: new Date(expiresAt),
    })),
    skipDuplicates: true,
  });
  return [...codes];
}

/* ---------------- 3. VALIDATE (checkout preview, read-only) ------------ */
export async function validateVoucher(rawCode, cartTotal) {
  const prisma = requirePrisma();
  const code = rawCode.trim().toUpperCase();
  const v = await prisma.voucher.findUnique({ where: { code } });

  if (!v)                        return { ok: false, reason: "Code not found" };
  if (v.redeemedAt)              return { ok: false, reason: `Already redeemed on ${v.redeemedAt.toLocaleDateString("en-MY")}` };
  if (v.expiresAt < new Date())  return { ok: false, reason: "Voucher expired" };
  const min = Number(v.minSpend);
  if (cartTotal < min)           return { ok: false, reason: `Minimum spend RM${min} (cart is RM${cartTotal})` };

  const discount = Math.min(Number(v.value), cartTotal);
  return { ok: true, code: v.code, discount, newTotal: cartTotal - discount };
}

/* ---------------- 4. REDEEM (atomic — call on payment confirmed) ------- */
export async function redeemVoucher(rawCode, { orderId, channel, cartTotal }) {
  const prisma = requirePrisma();
  const check = await validateVoucher(rawCode, cartTotal);
  if (!check.ok) return check;

  // updateMany + redeemedAt:null guard = atomic; two devices scanning the
  // same code simultaneously can never both succeed.
  const { count } = await prisma.voucher.updateMany({
    where: { code: check.code, redeemedAt: null },
    data: { redeemedAt: new Date(), redeemedChannel: channel, orderId },
  });

  if (count === 0) return { ok: false, reason: "Code was just redeemed on another device" };
  return { ok: true, discount: check.discount, newTotal: check.newTotal };
}

/* ---------------- 5. CLAIM (winner DMed @tara_scents.my) --------------- */
export async function markClaimed(rawCode, { winnerName, winnerContact }) {
  const prisma = requirePrisma();
  return prisma.voucher.update({
    where: { code: rawCode.trim().toUpperCase() },
    data: { claimedAt: new Date(), winnerName, winnerContact },
  });
}

/* ---------------- 6. LOOKUP + STATS (admin view) ----------------------- */
export async function listVouchers(campaign = CAMPAIGN) {
  const prisma = requirePrisma();
  return prisma.voucher.findMany({ where: { campaign }, orderBy: { code: "asc" } });
}

export async function campaignStats(campaign = CAMPAIGN) {
  const all = await listVouchers(campaign);
  const redeemed = all.filter((v) => v.redeemedAt);
  return {
    total: all.length,
    redeemed: redeemed.length,
    redemptionRate: all.length ? `${((redeemed.length / all.length) * 100).toFixed(1)}%` : "–",
    byChannel: redeemed.reduce((m, v) => ((m[v.redeemedChannel] = (m[v.redeemedChannel] || 0) + 1), m), {}),
  };
}
