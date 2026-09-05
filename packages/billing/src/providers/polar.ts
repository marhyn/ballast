// Field names verified against @polar-sh/sdk docs/examples as of Sep 2026 — check
// for drift on upgrade, the SDK is younger and moves faster than Stripe's.
import { Polar } from "@polar-sh/sdk";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import type { BillingProvider } from "../types";

// Lazily constructed: this module is imported unconditionally by
// packages/billing/src/index.ts alongside the Stripe provider, regardless of
// which one BILLING_PROVIDER actually selects, so env vars are only required
// once a method here is actually called.
let client: Polar | undefined;

function getClient(): Polar {
  if (!client) {
    if (!process.env.POLAR_ACCESS_TOKEN) {
      throw new Error("POLAR_ACCESS_TOKEN is not set");
    }
    client = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN,
      server: process.env.POLAR_ENV === "production" ? "production" : "sandbox",
    });
  }
  return client;
}

export const polarProvider: BillingProvider = {
  async createCheckoutSession({ priceId, customerEmail, successUrl, organizationId }) {
    const checkout = await getClient().checkouts.create({
      products: [priceId],
      customerEmail,
      successUrl,
      metadata: { organizationId },
    });
    return { url: checkout.url };
  },

  async createPortalSession({ customerId }) {
    const session = await getClient().customerSessions.create({ customerId });
    return { url: session.customerPortalUrl };
  },

  verifyWebhook(payload, signature) {
    if (!process.env.POLAR_WEBHOOK_SECRET) {
      throw new Error("POLAR_WEBHOOK_SECRET is not set");
    }
    try {
      return validateEvent(payload, { "webhook-signature": signature }, process.env.POLAR_WEBHOOK_SECRET);
    } catch (error) {
      if (error instanceof WebhookVerificationError) {
        throw new Error("Invalid Polar webhook signature");
      }
      throw error;
    }
  },
};
