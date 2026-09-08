import type { BillingProvider } from "./types";
import { polarProvider } from "./providers/polar";
import { stripeProvider } from "./providers/stripe";
import { plans } from "./plans";

const providers: Record<string, BillingProvider> = {
  polar: polarProvider,
  stripe: stripeProvider,
};

export const activeProviderName = (process.env.BILLING_PROVIDER ?? "polar") as "polar" | "stripe";

export const billing: BillingProvider = providers[activeProviderName] ?? polarProvider;

export function getPlanForPriceId(priceId: string) {
  return plans.find((plan) => plan.priceIds?.[activeProviderName] === priceId);
}

export * from "./types";
export * from "./plans";
