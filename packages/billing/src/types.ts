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

export interface BillingProvider {
  createCheckoutSession(params: CheckoutParams): Promise<CheckoutResult>;
  createPortalSession(params: PortalParams): Promise<PortalResult>;
  /** Verifies and parses a raw webhook payload; throws on an invalid signature. */
  verifyWebhook(payload: string, signature: string): unknown;
}
