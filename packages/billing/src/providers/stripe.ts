import Stripe from "stripe";
import type { BillingProvider, NormalizedSubscriptionEvent } from "../types";

function normalizeStatus(status: Stripe.Subscription.Status): NormalizedSubscriptionEvent["status"] {
  if (status === "active" || status === "trialing" || status === "past_due") {
    return status;
  }
  return "canceled";
}

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
      // Session-level metadata isn't copied onto the Subscription object Stripe
      // creates — only subscription_data.metadata is, and that's what shows up
      // on the customer.subscription.* webhook events this template listens for.
      subscription_data: { metadata: { organizationId } },
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

  verifyWebhook(payload, headers) {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    }
    const signature = headers["stripe-signature"];
    if (!signature) {
      throw new Error("Missing stripe-signature header");
    }
    return getClient().webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
  },

  parseSubscriptionEvent(event) {
    const e = event as Stripe.Event;
    if (!e.type?.startsWith("customer.subscription.")) {
      return null;
    }
    const sub = e.data.object as Stripe.Subscription;
    const item = sub.items.data[0];
    if (!item) {
      return null;
    }
    const organizationId = typeof sub.metadata?.organizationId === "string" ? sub.metadata.organizationId : null;
    return {
      organizationId,
      providerCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      providerSubscriptionId: sub.id,
      status: normalizeStatus(sub.status),
      priceId: item.price.id,
      currentPeriodEnd: new Date(item.current_period_end * 1000),
    };
  },
};
