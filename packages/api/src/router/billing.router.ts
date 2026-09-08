import { z } from "zod";
import { organizationProcedure } from "../procedures";
import { getCurrentPlan, startCheckout, startPortalSession } from "../domain/billing/billing.service";

export const billingRouter = {
  current: organizationProcedure.handler(async ({ context }) => {
    return getCurrentPlan(context.db, context.organizationId);
  }),

  checkout: organizationProcedure
    .input(z.object({ planId: z.string() }))
    .handler(async ({ context, input }) => {
      return startCheckout({
        organizationId: context.organizationId,
        planId: input.planId,
        customerEmail: context.user.email,
      });
    }),

  portal: organizationProcedure.handler(async ({ context }) => {
    return startPortalSession(context.db, context.organizationId);
  }),
};
