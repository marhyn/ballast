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
