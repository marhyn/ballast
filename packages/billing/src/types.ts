export interface CheckoutParams {
  organizationId: string;
  priceId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResult {
  url: string;
}

export interface PortalParams {
  customerId: string;
  returnUrl: string;
}

export interface PortalResult {
  url: string;
}

/**
 * A subscription-lifecycle webhook event, normalized across providers.
 * `organizationId` is only present on events carrying the metadata set at
 * checkout (see `subscription_data.metadata` in the Stripe provider, and
 * checkout metadata propagation in the Polar provider) — later update/cancel
 * events for the same subscription may not carry it, so callers should fall
 * back to matching on `providerSubscriptionId` when it's null.
 */
export interface NormalizedSubscriptionEvent {
  organizationId: string | null;
  providerCustomerId: string;
  providerSubscriptionId: string;
  status: "active" | "trialing" | "past_due" | "canceled";
  priceId: string;
  currentPeriodEnd: Date | null;
}

export interface BillingProvider {
  createCheckoutSession(params: CheckoutParams): Promise<CheckoutResult>;
  createPortalSession(params: PortalParams): Promise<PortalResult>;
  /** Verifies a raw webhook payload against request headers; throws on an invalid signature. */
  verifyWebhook(payload: string, headers: Record<string, string>): unknown;
  /** Returns null for event types this template doesn't track (e.g. one-off orders, refunds). */
  parseSubscriptionEvent(event: unknown): NormalizedSubscriptionEvent | null;
}
