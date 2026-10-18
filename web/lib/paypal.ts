// Talks to the PayPal REST API: login token, webhook signature check, and order lookup.

const API_BASE = {
  sandbox: "https://api-m.sandbox.paypal.com",
  live: "https://api-m.paypal.com",
} as const;

export type PayPalConfig = {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  webhookId: string;
};

export type Payer = {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  instrumentType: string | null;
};

export function readPayPalConfig(env: Record<string, string | undefined> = process.env): PayPalConfig {
  const mode = env.PAYPAL_ENV === "live" ? "live" : "sandbox";
  const clientId = env.PAYPAL_CLIENT_ID;
  const clientSecret = env.PAYPAL_CLIENT_SECRET;
  const webhookId = env.PAYPAL_WEBHOOK_ID;
  if (!clientId || !clientSecret || !webhookId) {
    throw new Error("PayPal settings missing: set PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET and PAYPAL_WEBHOOK_ID");
  }
  return { baseUrl: API_BASE[mode], clientId, clientSecret, webhookId };
}

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getAccessToken(config: PayPalConfig): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }
  const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const res = await fetch(`${config.baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    throw new Error(`PayPal token request failed (${res.status})`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  // Refresh a minute early so a token never expires mid-request
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return data.access_token;
}

// The headers PayPal signs every webhook with
const SIGNATURE_HEADERS = [
  "paypal-auth-algo",
  "paypal-cert-url",
  "paypal-transmission-id",
  "paypal-transmission-sig",
  "paypal-transmission-time",
] as const;

// Asks PayPal whether this webhook really came from them.
// Returns false for a bad or missing signature. Throws if PayPal can't be reached,
// so the caller can answer with an error and PayPal will retry later.
export async function verifyWebhookSignature(
  headers: Headers,
  event: unknown,
  config: PayPalConfig,
): Promise<boolean> {
  const values = SIGNATURE_HEADERS.map((name) => headers.get(name));
  if (values.some((value) => !value)) {
    return false;
  }
  const [authAlgo, certUrl, transmissionId, transmissionSig, transmissionTime] = values;

  const token = await getAccessToken(config);
  const res = await fetch(`${config.baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: config.webhookId,
      webhook_event: event,
    }),
  });
  if (!res.ok) {
    throw new Error(`PayPal signature check failed (${res.status})`);
  }
  const data = (await res.json()) as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}

// A capture event doesn't include the donor's email, so look it up on the order.
export async function getOrderPayer(orderId: string, config: PayPalConfig): Promise<Payer> {
  const token = await getAccessToken(config);
  const res = await fetch(`${config.baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`PayPal order lookup failed (${res.status})`);
  }
  const order = (await res.json()) as {
    payer?: { email_address?: string; name?: { given_name?: string; surname?: string } };
    payment_source?: Record<string, unknown>
  };
  return {
    email: order.payer?.email_address ?? null,
    firstName: order.payer?.name?.given_name ?? null,
    lastName: order.payer?.name?.surname ?? null,
    instrumentType: Object.keys(order.payment_source ?? {})[0]?.toUpperCase() ?? null
  };
}
