import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { organization } from "better-auth/plugins";
import { db } from "@ballast/db";
import * as schema from "@ballast/db/schema";
import {
  sendOrganizationInvitationEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
} from "./email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  // Platform-wide oversight access (see docs/adr/0011-platform-admin-flag.md) —
  // deliberately a plain flag, not better-auth's admin plugin's role/ban/impersonate
  // system, which is unused here. `input: false` means it can only be set by direct
  // DB access, never through better-auth's own update-user API — no self-promotion.
  user: {
    additionalFields: {
      platformAdmin: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail(user.email, url);
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
  },

  plugins: [
    organization({
      sendInvitationEmail: async (data) => {
        const inviteUrl = `${process.env.APP_URL}/accept-invitation/${data.id}`;
        await sendOrganizationInvitationEmail({
          to: data.email,
          organizationName: data.organization.name,
          inviterName: data.inviter.user.name,
          inviteUrl,
        });
      },
    }),
  ],
});

export type Auth = typeof auth;
