import type { BillingProvider } from "./types";
import { polarProvider } from "./providers/polar";
import { stripeProvider } from "./providers/stripe";

const providers: Record<string, BillingProvider> = {
  polar: polarProvider,
  stripe: stripeProvider,
};

const selected = process.env.BILLING_PROVIDER ?? "polar";

export const billing: BillingProvider = providers[selected] ?? polarProvider;

export * from "./types";
