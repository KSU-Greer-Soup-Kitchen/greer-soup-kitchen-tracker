import { afterEach, describe, expect, it, vi } from "vitest";
import { readPayPalConfig, verifyWebhookSignature } from "./paypal";

const config = {
  baseUrl: "https://api-m.sandbox.paypal.com",
  clientId: "test-id",
  clientSecret: "test-secret",
  webhookId: "WEBHOOK-1",
};

const signedHeaders = new Headers({
  "paypal-auth-algo": "SHA256withRSA",
  "paypal-cert-url": "https://api.sandbox.paypal.com/v1/notifications/certs/CERT",
  "paypal-transmission-id": "TRANSMISSION-1",
  "paypal-transmission-sig": "SIGNATURE",
  "paypal-transmission-time": "2026-10-05T14:00:00Z",
});

function mockPayPal(verificationStatus: string) {
  const fetchMock = vi.fn(async (url: string, _init?: RequestInit) => {
    if (url.endsWith("/v1/oauth2/token")) {
      return Response.json({ access_token: "TOKEN", expires_in: 3600 });
    }
    return Response.json({ verification_status: verificationStatus });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("verifyWebhookSignature", () => {
  it("rejects a request with no PayPal signature headers without calling PayPal", async () => {
    const fetchMock = mockPayPal("SUCCESS");
    expect(await verifyWebhookSignature(new Headers(), { id: "E1" }, config)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts the event when PayPal says SUCCESS", async () => {
    const fetchMock = mockPayPal("SUCCESS");
    expect(await verifyWebhookSignature(signedHeaders, { id: "E1" }, config)).toBe(true);

    const verifyCall = fetchMock.mock.calls.find(([url]) => url.endsWith("verify-webhook-signature"));
    const body = JSON.parse(verifyCall![1]!.body as string);
    expect(body).toMatchObject({ webhook_id: "WEBHOOK-1", transmission_id: "TRANSMISSION-1", webhook_event: { id: "E1" } });
  });

  it("rejects the event when PayPal says FAILURE", async () => {
    mockPayPal("FAILURE");
    expect(await verifyWebhookSignature(signedHeaders, { id: "E1" }, config)).toBe(false);
  });
});

describe("readPayPalConfig", () => {
  it("uses the sandbox unless told to go live", () => {
    const env = { PAYPAL_CLIENT_ID: "a", PAYPAL_CLIENT_SECRET: "b", PAYPAL_WEBHOOK_ID: "c" };
    expect(readPayPalConfig(env).baseUrl).toBe("https://api-m.sandbox.paypal.com");
    expect(readPayPalConfig({ ...env, PAYPAL_ENV: "live" }).baseUrl).toBe("https://api-m.paypal.com");
  });

  it("fails clearly when a setting is missing", () => {
    expect(() => readPayPalConfig({})).toThrow(/PAYPAL_CLIENT_ID/);
  });
});
