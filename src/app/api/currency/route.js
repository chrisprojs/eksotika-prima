import { SUPPORTED_CURRENCIES, getIdrRateMap } from "@/lib/currency";

export const revalidate = 3600;

export async function GET() {
  const rates = await getIdrRateMap();

  return Response.json({
    base: "IDR",
    rates,
    supported: SUPPORTED_CURRENCIES,
  });
}
