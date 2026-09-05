import { protectedProcedure } from "../procedures";
import { listOrganizationsForUser } from "../domain/tenant/tenant.service";

export const tenantRouter = {
  list: protectedProcedure.handler(async ({ context }) => {
    return listOrganizationsForUser(context.db, context.user.id);
  }),
};
