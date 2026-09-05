import { os, ORPCError } from "@orpc/server";
import type { Context } from "./context";

// oRPC's API surface (`.$context()`, `.use()`, `.middleware()`) is newer and
// less battle-tested than tRPC's — verified against orpc.dev docs as of
// Sep 2026 (see ADR-0001), but worth a second look on upgrade.
export const publicProcedure = os.$context<Context>();

const requireAuth = publicProcedure.middleware(async ({ context, next }) => {
  if (!context.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({ context: { user: context.user } });
});

/** Requires a signed-in User; does not require an active Organization. */
export const protectedProcedure = publicProcedure.use(requireAuth);

// Built off `publicProcedure`, not `protectedProcedure` — `.middleware()` isn't
// callable on a builder that already has `.use()` applied to it.
const requireOrganization = publicProcedure.middleware(async ({ context, next }) => {
  if (!context.organizationId) {
    throw new ORPCError("FORBIDDEN", { message: "No active organization — select or create one first" });
  }
  return next({ context: { organizationId: context.organizationId } });
});

/** Requires a signed-in User acting as an Organization (ADR-0003). */
export const organizationProcedure = protectedProcedure.use(requireOrganization);
