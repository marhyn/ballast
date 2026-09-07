import { authClient } from "~/lib/auth-client";

/**
 * The ADR-0006 route guard pattern: apply via `definePageMeta({ middleware: "organization" })`
 * on any page that needs a signed-in User acting as an Organization (see
 * `organizationProcedure` in packages/api/src/procedures.ts for the API-side
 * equivalent).
 *
 * `/sign-in` and `/onboarding` don't exist yet — they're the boilerplate
 * pages queued up next (ADR-0009). This middleware is correct now; those
 * redirect targets will 404 until then.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch);

  if (!session.value?.user) {
    return navigateTo(`/sign-in?redirect=${encodeURIComponent(to.fullPath)}`);
  }

  if (!session.value.session.activeOrganizationId) {
    return navigateTo("/onboarding");
  }
});
