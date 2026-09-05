import { eq } from "drizzle-orm";
import type { Database } from "@ballast/db";
import { subscription } from "@ballast/db/schema";
import { billing } from "@ballast/billing";

export async function getSubscriptionForOrganization(db: Database, organizationId: string) {
  const [row] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.organizationId, organizationId))
    .limit(1);
  return row ?? null;
}

export async function startCheckout(params: {
  organizationId: string;
  priceId: string;
  customerEmail: string;
}) {
  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    throw new Error("APP_URL is not set");
  }
  return billing.createCheckoutSession({
    organizationId: params.organizationId,
    priceId: params.priceId,
    customerEmail: params.customerEmail,
    successUrl: `${appUrl}/dashboard/billing?checkout=success`,
    cancelUrl: `${appUrl}/dashboard/billing?checkout=cancelled`,
  });
}
