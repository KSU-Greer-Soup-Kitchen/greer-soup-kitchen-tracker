// PayPal sends donation events here (FR-4).
// Answer 200 once handled. Any other answer makes PayPal retry for up to 3 days,
// which is what we want when the database or PayPal is briefly down.

import { handlePayPalEvent, type PayPalEvent } from "../../../../lib/donations";
import { getOrderPayer, readPayPalConfig, verifyWebhookSignature } from "../../../../lib/paypal";
import { savePayPalDonation } from "../../../../lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let event: PayPalEvent;
  try {
    event = JSON.parse(await request.text());
  } catch {
    return Response.json({ error: "Body is not valid JSON" }, { status: 400 });
  }

  let config;
  try {
    config = readPayPalConfig();
  } catch (err) {
    console.error("PayPal webhook:", err);
    return Response.json({ error: "Server is missing PayPal settings" }, { status: 500 });
  }

  let genuine: boolean;
  try {
    genuine = await verifyWebhookSignature(request.headers, event, config);
  } catch (err) {
    console.error("PayPal webhook: could not check signature", err);
    return Response.json({ error: "Could not check signature" }, { status: 503 });
  }
  if (!genuine) {
    console.warn("PayPal webhook: rejected event with bad signature", event.id);
    return Response.json({ error: "Signature check failed" }, { status: 400 });
  }

  try {
    const result = await handlePayPalEvent(event, {
      getPayer: (orderId) => getOrderPayer(orderId, config),
      saveDonation: savePayPalDonation,
    });
    // Log the event id and outcome only, never donor details
    console.log(`PayPal webhook: ${event.event_type} ${event.id} -> ${result}`);
    return Response.json({ result });
  } catch (err) {
    console.error("PayPal webhook: could not save event", event.id, err);
    return Response.json({ error: "Could not save event" }, { status: 500 });
  }
}
