import { listVouchers } from "@/lib/tara-pos-vouchers";

export async function POST(req) {
  const { campaign } = await req.json();
  return Response.json(await listVouchers(campaign));
}
