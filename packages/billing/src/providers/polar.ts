// Field names verified against @polar-sh/sdk docs/examples as of Sep 2026 — check
// for drift on upgrade, the SDK is younger and moves faster than Stripe's.
import { Polar } from "@polar-sh/sdk";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import type { BillingProvider, NormalizedSubscriptionEvent } from "../types";

// Polar's SubscriptionStatus has more values than this template's `subscription.status`
// column tracks; the unpaid/incomplete states all mean "not currently entitled",
// so they collapse onto "canceled" rather than growing the DB enum.
function normalizeStatus(status: string): NormalizedSubscriptionEvent["status"] {
  if (status === "active" || status === "trialing" || status === "past_due") {
    return status;
  }
  return "canceled";
}

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

  verifyWebhook(payload, headers) {
    if (!process.env.POLAR_WEBHOOK_SECRET) {
      throw new Error("POLAR_WEBHOOK_SECRET is not set");
    }
    try {
      // standardwebhooks needs all three headers to reconstruct the signed
      // content (`webhook-id.webhook-timestamp.payload`) and check timestamp
      // tolerance — a signature alone isn't enough to verify.
      return validateEvent(payload, headers, process.env.POLAR_WEBHOOK_SECRET);
    } catch (error) {
      if (error instanceof WebhookVerificationError) {
        throw new Error("Invalid Polar webhook signature");
      }
      throw error;
    }
  },

  parseSubscriptionEvent(event) {
    const e = event as { type?: string; data?: Record<string, unknown> };
    if (!e.type?.startsWith("subscription.") || !e.data) {
      return null;
    }
    const data = e.data as {
      id: string;
      customerId: string;
      priceId: string;
      status: string;
      currentPeriodEnd: string | Date | null;
      metadata: Record<string, unknown>;
    };
    const organizationId = typeof data.metadata.organizationId === "string" ? data.metadata.organizationId : null;
    return {
      organizationId,
      providerCustomerId: data.customerId,
      providerSubscriptionId: data.id,
      status: normalizeStatus(data.status),
      priceId: data.priceId,
      currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null,
    };
  },
};
