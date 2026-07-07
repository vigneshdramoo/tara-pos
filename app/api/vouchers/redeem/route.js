import { redeemVoucher } from "@/lib/tara-pos-vouchers";
export async function POST(req) {
  const { code, orderId, channel, cartTotal } = await req.json();
  return Response.json(await redeemVoucher(code, { orderId, channel, cartTotal }));
}
