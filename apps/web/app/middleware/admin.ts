import { authClient } from "~/lib/auth-client";

/**
 * The ADR-0006 route guard pattern, for the platform-admin oversight pages
 * (ADR-0011): apply via `definePageMeta({ middleware: "admin" })`. See
 * `adminProcedure` in packages/api/src/procedures.ts for the API-side
 * equivalent — this middleware only controls page access; the API still
 * enforces the check independently on every request.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch);

  if (!session.value?.user) {
    return navigateTo(`/sign-in?redirect=${encodeURIComponent(to.fullPath)}`);
  }

  if (!session.value.user.platformAdmin) {
    return navigateTo("/");
  }
});
