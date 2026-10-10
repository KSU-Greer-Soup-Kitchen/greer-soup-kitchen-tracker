import { describe, expect, it, vi } from "vitest";
import { handlePayPalEvent, readCompletedCapture, type DonationToSave, type PayPalEvent } from "./donations";

// Trimmed copy of a real PAYMENT.CAPTURE.COMPLETED event
function captureEvent(overrides: Record<string, unknown> = {}): PayPalEvent {
  return {
    id: "WH-TEST-1",
    event_type: "PAYMENT.CAPTURE.COMPLETED",
    resource: {
      id: "CAPTURE-123",
      status: "COMPLETED",
      amount: { currency_code: "USD", value: "25.00" },
      create_time: "2026-10-05T14:00:00Z",
      supplementary_data: { related_ids: { order_id: "ORDER-9" } },
      ...overrides,
    },
  };
}

const payer = { email: "donor@example.com", firstName: "Test", lastName: "Donor" };

describe("readCompletedCapture", () => {
  it("reads the gift details", () => {
    expect(readCompletedCapture(captureEvent())).toEqual({
      txnId: "CAPTURE-123",
      orderId: "ORDER-9",
      amount: 25,
      currency: "USD",
      donatedAt: "2026-10-05T14:00:00Z",
    });
  });

  it("ignores other event types", () => {
    expect(readCompletedCapture({ ...captureEvent(), event_type: "PAYMENT.CAPTURE.REFUNDED" })).toBeNull();
  });

  it("ignores captures that are not completed", () => {
    expect(readCompletedCapture(captureEvent({ status: "PENDING" }))).toBeNull();
  });

  it("ignores a missing or zero amount", () => {
    expect(readCompletedCapture(captureEvent({ amount: { value: "0.00" } }))).toBeNull();
    expect(readCompletedCapture(captureEvent({ amount: undefined }))).toBeNull();
  });
});

describe("handlePayPalEvent", () => {
  it("looks up the payer and saves a new gift", async () => {
    const getPayer = vi.fn().mockResolvedValue(payer);
    const saveDonation = vi.fn().mockResolvedValue(true);

    const result = await handlePayPalEvent(captureEvent(), { getPayer, saveDonation });

    expect(result).toBe("saved");
    expect(getPayer).toHaveBeenCalledWith("ORDER-9");
    const saved: DonationToSave = saveDonation.mock.calls[0][0];
    expect(saved).toMatchObject({ txnId: "CAPTURE-123", amount: 25, eventId: "WH-TEST-1", payer });
  });

  it("reports a repeat of the same transaction as a duplicate", async () => {
    const result = await handlePayPalEvent(captureEvent(), {
      getPayer: vi.fn().mockResolvedValue(payer),
      saveDonation: vi.fn().mockResolvedValue(false),
    });
    expect(result).toBe("duplicate");
  });

  it("still saves the gift when there is no order to look up", async () => {
    const getPayer = vi.fn();
    const saveDonation = vi.fn().mockResolvedValue(true);

    const result = await handlePayPalEvent(captureEvent({ supplementary_data: undefined }), { getPayer, saveDonation });

    expect(result).toBe("saved");
    expect(getPayer).not.toHaveBeenCalled();
    expect(saveDonation.mock.calls[0][0].payer.email).toBeNull();
  });

  it("does nothing for events it does not handle", async () => {
    const saveDonation = vi.fn();
    const result = await handlePayPalEvent({ event_type: "CHECKOUT.ORDER.APPROVED" }, { getPayer: vi.fn(), saveDonation });
    expect(result).toBe("ignored");
    expect(saveDonation).not.toHaveBeenCalled();
  });
});
