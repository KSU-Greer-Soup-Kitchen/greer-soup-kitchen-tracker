// Finishes a PayPal donation after the donor approves it.
// The gift is saved by the webhook when PayPal confirms the payment.

import { captureDonationOrder, readPayPalConfig } from "../../../../../../lib/paypal";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  if (!/^[A-Z0-9]{5,30}$/.test(orderId)) {
    return Response.json({ error: "Unknown order" }, { status: 400 });
  }
  try {
    const status = await captureDonationOrder(orderId, readPayPalConfig());
    return Response.json({ status });
  } catch (err) {
    console.error("PayPal capture:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Could not finish the PayPal payment" }, { status: 502 });
  }
}
