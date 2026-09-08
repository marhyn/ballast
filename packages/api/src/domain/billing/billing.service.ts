import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { Database } from "@ballast/db";
import { subscription } from "@ballast/db/schema";
import { billing, activeProviderName, getPlan, getPlanForPriceId, plans } from "@ballast/billing";

export async function getSubscriptionForOrganization(db: Database, organizationId: string) {
  const [row] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.organizationId, organizationId))
    .limit(1);
  return row ?? null;
}

/**
 * `planId` is resolved server-side because it depends on `activeProviderName`
 * (which price-id map to check a subscription's `priceId` against) — the web
 * app only ever imports the provider-agnostic `@ballast/billing/plans` list,
 * not this lookup.
 */
export async function getCurrentPlan(db: Database, organizationId: string) {
  const currentSubscription = await getSubscriptionForOrganization(db, organizationId);
  if (!currentSubscription) {
    const freePlan = plans.find((plan) => plan.priceIds === null);
    return { subscription: null, planId: freePlan?.id ?? null };
  }
  const plan = getPlanForPriceId(currentSubscription.priceId);
  return { subscription: currentSubscription, planId: plan?.id ?? null };
}

function requireAppUrl() {
  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    throw new Error("APP_URL is not set");
  }
  return appUrl;
}

export async function startCheckout(params: {
  organizationId: string;
  planId: string;
  customerEmail: string;
}) {
  const plan = getPlan(params.planId);
  if (!plan || !plan.priceIds) {
    throw new Error(`Plan "${params.planId}" is not checkout-eligible`);
  }
  const appUrl = requireAppUrl();
  return billing.createCheckoutSession({
    organizationId: params.organizationId,
    priceId: plan.priceIds[activeProviderName],
    customerEmail: params.customerEmail,
    successUrl: `${appUrl}/settings/billing?checkout=success`,
    cancelUrl: `${appUrl}/settings/billing?checkout=cancelled`,
  });
}

export async function startPortalSession(db: Database, organizationId: string) {
  const existing = await getSubscriptionForOrganization(db, organizationId);
  if (!existing) {
    throw new Error("No subscription to manage yet — choose a plan first");
  }
  const appUrl = requireAppUrl();
  return billing.createPortalSession({
    customerId: existing.providerCustomerId,
    returnUrl: `${appUrl}/settings/billing`,
  });
}

/**
 * Verifies and applies an inbound provider webhook. Runs outside the oRPC
 * context (no signed-in user — the request is from Polar/Stripe's servers),
 * so it takes `db` directly rather than via a procedure's context.
 */
export async function handleBillingWebhook(db: Database, payload: string, headers: Record<string, string>) {
  const verified = billing.verifyWebhook(payload, headers);
  const normalized = billing.parseSubscriptionEvent(verified);
  if (!normalized) {
    return;
  }

  if (normalized.organizationId) {
    await db
      .insert(subscription)
      .values({
        id: randomUUID(),
        organizationId: normalized.organizationId,
        provider: activeProviderName,
        providerCustomerId: normalized.providerCustomerId,
        providerSubscriptionId: normalized.providerSubscriptionId,
        status: normalized.status,
        priceId: normalized.priceId,
        currentPeriodEnd: normalized.currentPeriodEnd,
      })
      .onConflictDoUpdate({
        target: subscription.providerSubscriptionId,
        set: {
          status: normalized.status,
          priceId: normalized.priceId,
          currentPeriodEnd: normalized.currentPeriodEnd,
          updatedAt: new Date(),
        },
      });
    return;
  }

  // An update/cancel event without metadata (shouldn't happen given
  // subscription_data.metadata / Polar's metadata propagation on checkout,
  // but the row might predate that fix) — match by the provider's own id.
  await db
    .update(subscription)
    .set({
      status: normalized.status,
      priceId: normalized.priceId,
      currentPeriodEnd: normalized.currentPeriodEnd,
      updatedAt: new Date(),
    })
    .where(eq(subscription.providerSubscriptionId, normalized.providerSubscriptionId));
}
