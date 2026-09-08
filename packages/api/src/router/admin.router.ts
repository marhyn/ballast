import { adminProcedure } from "../procedures";
import { listOrganizations, listUsers, listSubscriptions } from "../domain/admin/admin.service";

export const adminRouter = {
  organizations: adminProcedure.handler(async ({ context }) => listOrganizations(context.db)),
  users: adminProcedure.handler(async ({ context }) => listUsers(context.db)),
  subscriptions: adminProcedure.handler(async ({ context }) => listSubscriptions(context.db)),
};
