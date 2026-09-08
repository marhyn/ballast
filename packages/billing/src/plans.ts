/**
 * Plans are config, not a database table (see ADR-0010) — there's no
 * "Plan" row to migrate, just this list. Replace the id/name/features with
 * your product's real tiers, and `priceIds` with the actual product/price
 * IDs from your Polar and Stripe dashboards (whichever `BILLING_PROVIDER`
 * selects is the one that's read).
 *
 * This file has its own `@ballast/billing/plans` export path, separate from
 * the package root — it's the one piece of this package safe to import from
 * client-side code. The root `index.ts` pulls in the Polar/Stripe SDKs and
 * reads `process.env.BILLING_PROVIDER`, neither of which belongs in a
 * browser bundle.
 */
export interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  /** null on the free plan — it has nothing to check out. */
  priceIds: { polar: string; stripe: string } | null;
  features: string[];
}

export const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For solo projects finding their feet.",
    priceMonthly: 0,
    priceIds: null,
    features: ["1 organization member", "Community support"],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For small teams shipping regularly.",
    priceMonthly: 29,
    priceIds: { polar: "REPLACE_WITH_POLAR_PRO_PRICE_ID", stripe: "REPLACE_WITH_STRIPE_PRO_PRICE_ID" },
    features: ["Unlimited organization members", "Priority email support", "Usage analytics"],
  },
  {
    id: "business",
    name: "Business",
    description: "For growing teams that need more control.",
    priceMonthly: 99,
    priceIds: { polar: "REPLACE_WITH_POLAR_BUSINESS_PRICE_ID", stripe: "REPLACE_WITH_STRIPE_BUSINESS_PRICE_ID" },
    features: ["Everything in Pro", "SSO", "Dedicated support channel"],
  },
];

export function getPlan(planId: string): Plan | undefined {
  return plans.find((plan) => plan.id === planId);
}
