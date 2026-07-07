import { describe, it, expect, beforeAll } from "vitest";
import crypto from "node:crypto";
import { verifyWebhookSignature } from "./paystack";

const TEST_SECRET = "sk_test_this_is_a_fake_key_used_only_in_tests";

function signBody(body: string, secret: string): string {
  return crypto.createHmac("sha512", secret).update(body).digest("hex");
}

describe("verifyWebhookSignature", () => {
  beforeAll(() => {
    process.env.PAYSTACK_SECRET_KEY = TEST_SECRET;
  });

  const body = JSON.stringify({ event: "charge.success", data: { reference: "tmt_abc123", amount: 15000 } });

  it("accepts a correctly signed body -- this is what lets a real payment activate a plan", () => {
    const signature = signBody(body, TEST_SECRET);
    expect(verifyWebhookSignature(body, signature)).toBe(true);
  });

  it("rejects a signature computed with the wrong secret", () => {
    const signature = signBody(body, "sk_test_a_completely_different_key");
    expect(verifyWebhookSignature(body, signature)).toBe(false);
  });

  it("rejects when the body has been tampered with after signing -- e.g. amount edited up or down", () => {
    const signature = signBody(body, TEST_SECRET);
    const tamperedBody = JSON.stringify({ event: "charge.success", data: { reference: "tmt_abc123", amount: 999999999 } });
    expect(verifyWebhookSignature(tamperedBody, signature)).toBe(false);
  });

  it("rejects a missing signature header entirely, rather than treating it as trusted", () => {
    expect(verifyWebhookSignature(body, null)).toBe(false);
  });

  it("rejects a malformed (non-hex) signature instead of throwing", () => {
    expect(verifyWebhookSignature(body, "not-valid-hex-at-all!!")).toBe(false);
  });

  it("rejects an empty-string signature", () => {
    expect(verifyWebhookSignature(body, "")).toBe(false);
  });
});
