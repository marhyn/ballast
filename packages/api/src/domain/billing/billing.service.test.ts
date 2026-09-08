import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { Webhook } from "standardwebhooks";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@ballast/db";
import { organization, subscription } from "@ballast/db/schema";
import { plans } from "@ballast/billing/plans";
import { getCurrentPlan, handleBillingWebhook } from "./billing.service";

// Resolved from the real plan list rather than hardcoded, so a plan rename
// doesn't silently break this fixture (caught for real bootstrapping the
// ecomail-clone test product off this template — see marhyn/ballast#2).
// Split into separate consts (not just narrowed on `paidPlan`) because TS's
// null narrowing doesn't carry into the `it()` closures below.
const paidPlan = plans.find((plan) => plan.priceIds !== null);
if (!paidPlan?.priceIds) {
  throw new Error("Expected at least one checkout-eligible plan in packages/billing/src/plans.ts");
}
const paidPlanId = paidPlan.id;
const paidPlanPriceId = paidPlan.priceIds.polar;

function signedHeaders(webhook: Webhook, msgId: string, payload: string) {
  const timestamp = new Date();
  return {
    "webhook-id": msgId,
    "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
    "webhook-signature": webhook.sign(msgId, timestamp, payload),
  };
}

/**
 * A real Polar `subscription.*` webhook body — the SDK's own zod schema
 * validates the full nested Subscription object (customer, user, product,
 * price), not just the handful of fields this template's provider actually
 * reads, so a realistic payload needs every required field, not a shorthand.
 */
function buildPolarSubscriptionPayload(params: {
  type: "subscription.created" | "subscription.updated";
  id: string;
  customerId: string;
  priceId: string;
  status: string;
  currentPeriodEnd: string;
  organizationId?: string;
}) {
  const now = new Date().toISOString();
  const productId = randomUUID();
  return JSON.stringify({
    type: params.type,
    data: {
      created_at: now,
      modified_at: null,
      id: params.id,
      amount: 2900,
      currency: "usd",
      recurring_interval: "month",
      status: params.status,
      current_period_start: now,
      current_period_end: params.currentPeriodEnd,
      cancel_at_period_end: false,
      canceled_at: null,
      started_at: now,
      ends_at: null,
      ended_at: null,
      customer_id: params.customerId,
      product_id: productId,
      price_id: params.priceId,
      discount_id: null,
      checkout_id: null,
      customer_cancellation_reason: null,
      customer_cancellation_comment: null,
      metadata: params.organizationId ? { organizationId: params.organizationId } : {},
      customer: {
        id: params.customerId,
        created_at: now,
        modified_at: null,
        metadata: {},
        external_id: null,
        email: "customer@example.com",
        email_verified: true,
        name: null,
        billing_address: null,
        tax_id: null,
        organization_id: randomUUID(),
        avatar_url: "https://example.com/avatar.png",
      },
      user_id: randomUUID(),
      user: {
        id: randomUUID(),
        email: "customer@example.com",
        public_name: "Test Customer",
      },
      product: {
        created_at: now,
        modified_at: null,
        id: productId,
        name: "Pro",
        description: null,
        recurring_interval: "month",
        is_recurring: true,
        is_archived: false,
        organization_id: randomUUID(),
        metadata: {},
        prices: [],
        benefits: [],
        medias: [],
        attached_custom_fields: [],
      },
      price: {
        created_at: now,
        modified_at: null,
        id: params.priceId,
        amount_type: "free",
        is_archived: false,
        product_id: productId,
        type: "recurring",
        recurring_interval: "month",
      },
      discount: null,
    },
  });
}

describe("billing domain service", () => {
  const orgId = randomUUID();

  beforeAll(async () => {
    await db.insert(organization).values({ id: orgId, name: "Billing Test Org", slug: `billing-test-${orgId}`, createdAt: new Date() });
  });

  afterAll(async () => {
    await db.delete(subscription).where(eq(subscription.organizationId, orgId));
    await db.delete(organization).where(eq(organization.id, orgId));
  });

  it("resolves the free plan when an organization has no subscription", async () => {
    const result = await getCurrentPlan(db, orgId);
    expect(result.subscription).toBeNull();
    expect(result.planId).toBe("starter");
  });

  it("applies a real, signed Polar webhook end-to-end — verify, parse, upsert", async () => {
    // BILLING_PROVIDER defaults to "polar" (see packages/billing/src/index.ts),
    // and nothing in this test suite overrides that.
    //
    // A real POLAR_WEBHOOK_SECRET is a plain-text secret, not pre-base64'd —
    // the Polar SDK's validateEvent() re-encodes it (Buffer.from(secret,
    // "utf-8").toString("base64")) before handing it to the underlying
    // Webhook verifier, so signing here must mirror that exact transform or
    // the two sides derive different raw HMAC keys.
    const secret = randomUUID();
    process.env.POLAR_WEBHOOK_SECRET = secret;
    const webhook = new Webhook(Buffer.from(secret, "utf-8").toString("base64"));
    const providerSubscriptionId = randomUUID();
    const customerId = randomUUID();

    const createdPayload = buildPolarSubscriptionPayload({
      type: "subscription.created",
      id: providerSubscriptionId,
      customerId,
      priceId: paidPlanPriceId,
      status: "active",
      currentPeriodEnd: new Date().toISOString(),
      organizationId: orgId,
    });
    await handleBillingWebhook(db, createdPayload, signedHeaders(webhook, randomUUID(), createdPayload));

    const afterCreate = await getCurrentPlan(db, orgId);
    expect(afterCreate.subscription?.status).toBe("active");
    expect(afterCreate.planId).toBe(paidPlanId);

    // A later event for the same provider subscription id upserts in place,
    // even without organizationId in its metadata (matched by providerSubscriptionId).
    const updatedPayload = buildPolarSubscriptionPayload({
      type: "subscription.updated",
      id: providerSubscriptionId,
      customerId,
      priceId: paidPlanPriceId,
      status: "past_due",
      currentPeriodEnd: new Date().toISOString(),
    });
    await handleBillingWebhook(db, updatedPayload, signedHeaders(webhook, randomUUID(), updatedPayload));

    const afterUpdate = await getCurrentPlan(db, orgId);
    expect(afterUpdate.subscription?.status).toBe("past_due");
  });

  it("rejects a webhook signed with the wrong secret", async () => {
    process.env.POLAR_WEBHOOK_SECRET = randomUUID();
    const wrongWebhook = new Webhook(Buffer.from(randomUUID(), "utf-8").toString("base64"));
    const payload = buildPolarSubscriptionPayload({
      type: "subscription.created",
      id: randomUUID(),
      customerId: randomUUID(),
      priceId: paidPlanPriceId,
      status: "active",
      currentPeriodEnd: new Date().toISOString(),
    });

    await expect(
      handleBillingWebhook(db, payload, signedHeaders(wrongWebhook, randomUUID(), payload)),
    ).rejects.toThrow();
  });
});
