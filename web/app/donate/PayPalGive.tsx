"use client";

// "Give online" box: pick an amount, then pay in PayPal's own window
// (PayPal account, Venmo, or card). The gift is logged by the webhook (FR-4).

import { useEffect, useRef, useState } from "react";

type PayPalButtons = { render: (el: HTMLElement) => Promise<void>; close?: () => void };
type PayPalSdk = {
  Buttons: (options: {
    style?: Record<string, string | number>;
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onError: (err: unknown) => void;
    onCancel?: () => void;
  }) => PayPalButtons;
};

declare global {
  interface Window {
    paypal?: PayPalSdk;
  }
}

const AMOUNTS = [25, 50, 100, 250];

export function PayPalGive({ clientId }: { clientId: string }) {
  const [amount, setAmount] = useState<string>("50");
  const [status, setStatus] = useState<"ready" | "loading" | "done" | "error" | "unavailable">("loading");
  const [message, setMessage] = useState("");
  const slot = useRef<HTMLDivElement>(null);
  // PayPal keeps the first function we give it, so read the latest amount from here
  const amountRef = useRef(amount);
  amountRef.current = amount;

  useEffect(() => {
    let buttons: PayPalButtons | null = null;
    let cancelled = false;

    function draw() {
      if (cancelled || !window.paypal || !slot.current) return;
      buttons = window.paypal.Buttons({
        style: { layout: "vertical", shape: "rect", height: 55, label: "donate" },
        createOrder: async () => {
          setMessage("");
          const res = await fetch("/api/paypal/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: amountRef.current }),
          });
          const data = (await res.json()) as { id?: string; error?: string };
          if (!res.ok || !data.id) {
            setMessage(data.error ?? "PayPal could not start. Please try again.");
            throw new Error(data.error ?? "order failed");
          }
          return data.id;
        },
        onApprove: async ({ orderID }) => {
          const res = await fetch(`/api/paypal/orders/${orderID}/capture`, { method: "POST" });
          if (res.ok) {
            setStatus("done");
          } else {
            setStatus("error");
            setMessage("Your payment did not go through. You have not been charged. Please try again.");
          }
        },
        onError: () => {
          setMessage((m) => m || "Something went wrong with PayPal. You have not been charged. Please try again.");
        },
      });
      buttons.render(slot.current).then(() => !cancelled && setStatus("ready")).catch(() => setStatus("unavailable"));
    }

    if (window.paypal) {
      draw();
    } else {
      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&enable-funding=venmo`;
      script.async = true;
      script.onload = draw;
      script.onerror = () => setStatus("unavailable");
      document.body.appendChild(script);
    }
    return () => {
      cancelled = true;
      buttons?.close?.();
    };
  }, [clientId]);

  if (status === "done") {
    return (
      <div className="success-panel" role="status">
        <h3>Thank you for your gift!</h3>
        <p>
          Your donation of <strong>${Number(amount).toFixed(2)}</strong> went through. PayPal will email you a receipt.
        </p>
      </div>
    );
  }

  const amountOk = Number(amount) >= 1 && Number(amount) <= 10000;

  return (
    <div>
      <fieldset>
        <legend className="field-label">Choose an amount</legend>
        <div className="amounts">
          {AMOUNTS.map((a) => (
            <button key={a} type="button" className="amount" aria-pressed={amount === String(a)} onClick={() => setAmount(String(a))}>
              ${a}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="field" style={{ maxWidth: 320 }}>
        <label htmlFor="other-amount">Or type another amount</label>
        <div className="money-input">
          <span aria-hidden="true">$</span>
          <input
            id="other-amount"
            type="number"
            inputMode="decimal"
            min={1}
            max={10000}
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        {!amountOk && <p className="field-error">Enter an amount from $1 to $10,000</p>}
      </div>

      {message && (
        <p className="alert alert-error" role="alert">
          {message}
        </p>
      )}
      {status === "unavailable" && (
        <p className="alert alert-error" role="alert">
          Online giving is not working right now. Please try again later, or mail a check.
        </p>
      )}
      {status === "loading" && <p className="muted">Loading PayPal...</p>}
      <div className="paypal-slot" ref={slot} hidden={!amountOk} />
    </div>
  );
}
