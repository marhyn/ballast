import { authClient } from "~/lib/auth-client";

/**
 * Requires a signed-in User but not an active Organization — for pages like
 * /onboarding that a user without an Organization yet must still reach. Use
 * "organization" middleware instead for pages that need one.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch);

  if (!session.value?.user) {
    return navigateTo(`/sign-in?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});
