import Stripe from "stripe";
import type { BillingProvider } from "../types";

// Lazily constructed: this module is imported unconditionally by
// packages/billing/src/index.ts alongside the Polar provider, regardless of
// which one BILLING_PROVIDER actually selects, so env vars are only required
// once a method here is actually called.
let client: Stripe | undefined;

function getClient(): Stripe {
  if (!client) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    client = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return client;
}

export const stripeProvider: BillingProvider = {
  async createCheckoutSession({ priceId, customerEmail, successUrl, cancelUrl, organizationId }) {
    const session = await getClient().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: customerEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { organizationId },
    });
    if (!session.url) {
      throw new Error("Stripe checkout session was created without a URL");
    }
    return { url: session.url };
  },

  async createPortalSession({ customerId, returnUrl }) {
    const session = await getClient().billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  },

  verifyWebhook(payload, signature) {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    }
    return getClient().webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
  },
};
