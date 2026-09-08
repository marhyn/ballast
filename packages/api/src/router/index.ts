import { tenantRouter } from "./tenant.router";
import { billingRouter } from "./billing.router";
import { adminRouter } from "./admin.router";
import { exampleRouter } from "./example.router";

export const router = {
  tenant: tenantRouter,
  billing: billingRouter,
  admin: adminRouter,
  // TEMPLATE EXAMPLE — see packages/db/src/schema/example.ts. Safe to delete.
  example: exampleRouter,
};

export type AppRouter = typeof router;
