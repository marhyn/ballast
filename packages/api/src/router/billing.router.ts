import { z } from "zod";
import { organizationProcedure } from "../procedures";
import { getSubscriptionForOrganization, startCheckout } from "../domain/billing/billing.service";

export const billingRouter = {
  current: organizationProcedure.handler(async ({ context }) => {
    return getSubscriptionForOrganization(context.db, context.organizationId);
  }),

  checkout: organizationProcedure
    .input(z.object({ priceId: z.string() }))
    .handler(async ({ context, input }) => {
      return startCheckout({
        organizationId: context.organizationId,
        priceId: input.priceId,
        customerEmail: context.user.email,
      });
    }),
};
