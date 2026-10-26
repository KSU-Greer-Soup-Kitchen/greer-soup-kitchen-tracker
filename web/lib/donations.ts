// Turns a PayPal webhook event into a saved donation (FR-4).
// The PayPal and database calls are passed in so this logic can be tested on its own.

import type { OrderDetails, Payer, PayPalPaymentMethod } from "./paypal";

export type PayPalEvent = {
  id?: string;
  event_type?: string;
  resource?: Record<string, unknown>;
};

export type CompletedCapture = {
  txnId: string;
  orderId: string | null;
  amount: number;
  currency: string;
  donatedAt: string;
};

export type DonationToSave = CompletedCapture & {
  eventId: string | null;
  payer: Payer;
  paymentMethod: PayPalPaymentMethod | null;
};

export type HandleResult = "saved" | "duplicate" | "ignored";

export type Deps = {
  getOrderDetails: (orderId: string) => Promise<OrderDetails>;
  // Returns true if a new row was added, false if this transaction was already saved
  saveDonation: (donation: DonationToSave) => Promise<boolean>;
};

const NO_DETAILS: OrderDetails = { payer: { email: null, firstName: null, lastName: null }, paymentMethod: null };

// Pulls the money details out of a PAYMENT.CAPTURE.COMPLETED event.
// Returns null for any other event, or one missing the fields we need.
export function readCompletedCapture(event: PayPalEvent): CompletedCapture | null {
  if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED" || !event.resource) {
    return null;
  }
  const resource = event.resource as {
    id?: string;
    status?: string;
    amount?: { value?: string; currency_code?: string };
    create_time?: string;
    supplementary_data?: { related_ids?: { order_id?: string } };
  };
  const amount = Number(resource.amount?.value);
  if (!resource.id || resource.status !== "COMPLETED" || !(amount > 0)) {
    return null;
  }
  return {
    txnId: resource.id,
    orderId: resource.supplementary_data?.related_ids?.order_id ?? null,
    amount,
    currency: resource.amount?.currency_code ?? "USD",
    donatedAt: resource.create_time ?? new Date().toISOString(),
  };
}

export async function handlePayPalEvent(event: PayPalEvent, deps: Deps): Promise<HandleResult> {
  const capture = readCompletedCapture(event);
  if (!capture) {
    return "ignored";
  }
  const details = capture.orderId ? await deps.getOrderDetails(capture.orderId) : NO_DETAILS;
  const added = await deps.saveDonation({ ...capture, eventId: event.id ?? null, ...details });
  return added ? "saved" : "duplicate";
}
