// Finishes a PayPal donation after the donor approves it, and saves the gift right away.
// The webhook saves it again when PayPal confirms the payment, as a backup.
// Both use PayPal's capture id, so a gift is only ever stored once.

import { captureDonationOrder, readPayPalCheckoutConfig } from "../../../../../../lib/paypal";
import { savePayPalDonation } from "../../../../../../lib/supabase";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  if (!/^[A-Z0-9]{5,30}$/.test(orderId)) {
    return Response.json({ error: "Unknown order" }, { status: 400 });
  }

  let captured;
  try {
    captured = await captureDonationOrder(orderId, readPayPalCheckoutConfig());
  } catch (err) {
    console.error("PayPal capture:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Could not finish the PayPal payment" }, { status: 502 });
  }
  if (!captured.capture) {
    return Response.json({ error: "PayPal did not complete the payment" }, { status: 402 });
  }

  try {
    await savePayPalDonation({ ...captured.capture, orderId, eventId: null, ...captured.details });
  } catch (err) {
    // The money went through, so still thank the donor. The webhook will save the gift when it arrives.
    console.error("PayPal capture: payment taken but not saved yet:", err instanceof Error ? err.message : err);
  }
  return Response.json({ status: captured.status });
}
