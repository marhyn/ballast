import { handleBillingWebhook } from "@ballast/api";
import { db } from "@ballast/db";

// Hit directly by the billing provider's servers, not by an app user — no
// auth context, and the raw body must reach the provider's verifier
// untouched (JSON.parse would break signature verification).
export default defineEventHandler(async (event) => {
  const payload = (await readRawBody(event)) ?? "";
  const headers = getHeaders(event) as Record<string, string>;

  try {
    await handleBillingWebhook(db, payload, headers);
  } catch (error) {
    console.error("Billing webhook rejected:", error);
    setResponseStatus(event, 400);
    return { received: false };
  }

  return { received: true };
});
