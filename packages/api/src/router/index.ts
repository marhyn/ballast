import { tenantRouter } from "./tenant.router";
import { billingRouter } from "./billing.router";

export const router = {
  tenant: tenantRouter,
  billing: billingRouter,
};

export type AppRouter = typeof router;
