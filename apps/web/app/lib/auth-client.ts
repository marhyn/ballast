import { createAuthClient } from "better-auth/vue";
import { organizationClient, inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@ballast/auth";

export const authClient = createAuthClient({
  // inferAdditionalFields pulls in the server's `user.additionalFields` (just
  // `platformAdmin` today, see ADR-0011) so the client's session type has it too.
  plugins: [organizationClient(), inferAdditionalFields<typeof auth>()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
