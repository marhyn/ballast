import { Lettr } from "lettr";

if (!process.env.LETTR_API_KEY) {
  throw new Error("LETTR_API_KEY is not set");
}

const lettr = new Lettr(process.env.LETTR_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "no-reply@ballast.example";

async function send(to: string, subject: string, html: string) {
  const { error } = await lettr.emails.send({ from: FROM, to: [to], subject, html });
  if (error) {
    console.error(`[email] failed to send "${subject}" to ${to}:`, error.message);
  }
}

export async function sendVerificationEmail(to: string, url: string) {
  await send(
    to,
    "Verify your email",
    `<p>Click the link below to verify your email address.</p><p><a href="${url}">${url}</a></p>`,
  );
}

export async function sendResetPasswordEmail(to: string, url: string) {
  await send(
    to,
    "Reset your password",
    `<p>Click the link below to reset your password. If you didn't request this, ignore this email.</p><p><a href="${url}">${url}</a></p>`,
  );
}

export async function sendOrganizationInvitationEmail(params: {
  to: string;
  organizationName: string;
  inviterName: string;
  inviteUrl: string;
}) {
  await send(
    params.to,
    `${params.inviterName} invited you to join ${params.organizationName}`,
    `<p>${params.inviterName} invited you to join <strong>${params.organizationName}</strong> on Ballast.</p><p><a href="${params.inviteUrl}">${params.inviteUrl}</a></p>`,
  );
}
