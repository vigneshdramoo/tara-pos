import { validateVoucher } from "@/lib/tara-pos-vouchers";
export async function POST(req) {
  const { code, cartTotal } = await req.json();
  return Response.json(await validateVoucher(code, cartTotal));
}
