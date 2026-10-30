// Starts a PayPal donation for the amount the donor picked.

import { createDonationOrder, readDonationAmount, readPayPalConfig } from "../../../../lib/paypal";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { amount?: unknown };
  const amount = readDonationAmount(body.amount);
  if (amount === null) {
    return Response.json({ error: "Choose an amount from $1 to $10,000" }, { status: 400 });
  }
  try {
    const id = await createDonationOrder(amount, readPayPalConfig());
    return Response.json({ id });
  } catch (err) {
    console.error("PayPal order:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Could not start PayPal" }, { status: 502 });
  }
}
