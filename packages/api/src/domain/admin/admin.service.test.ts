import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@ballast/db";
import { organization, user, member, subscription } from "@ballast/db/schema";
import { plans } from "@ballast/billing/plans";
import { listOrganizations, listUsers, listSubscriptions } from "./admin.service";

// Resolved from the real plan list rather than hardcoded, so a plan rename
// doesn't silently break this fixture (caught for real bootstrapping the
// ecomail-clone test product off this template — see marhyn/ballast#2).
// Split into separate consts (not just narrowed on `paidPlan`) because TS's
// null narrowing doesn't carry into the closures below.
const paidPlan = plans.find((plan) => plan.priceIds !== null);
if (!paidPlan?.priceIds) {
  throw new Error("Expected at least one checkout-eligible plan in packages/billing/src/plans.ts");
}
const paidPlanId = paidPlan.id;
const paidPlanPriceId = paidPlan.priceIds.polar;

describe("admin domain service", () => {
  const orgId = randomUUID();
  const userAId = randomUUID();
  const userBId = randomUUID();
  const subscriptionId = randomUUID();

  beforeAll(async () => {
    await db.insert(organization).values({ id: orgId, name: "Admin Test Org", slug: `admin-test-${orgId}`, createdAt: new Date() });
    await db.insert(user).values([
      { id: userAId, name: "Admin Test User A", email: `admin-test-a-${userAId}@example.com` },
      { id: userBId, name: "Admin Test User B", email: `admin-test-b-${userBId}@example.com` },
    ]);
    await db.insert(member).values([
      { id: randomUUID(), organizationId: orgId, userId: userAId, role: "owner", createdAt: new Date() },
      { id: randomUUID(), organizationId: orgId, userId: userBId, role: "member", createdAt: new Date() },
    ]);
    await db.insert(subscription).values({
      id: subscriptionId,
      organizationId: orgId,
      provider: "polar",
      providerCustomerId: "cus_admin_test",
      providerSubscriptionId: `polar_sub_admin_test_${subscriptionId}`,
      status: "active",
      priceId: paidPlanPriceId,
      currentPeriodEnd: new Date(),
    });
  });

  afterAll(async () => {
    await db.delete(subscription).where(eq(subscription.id, subscriptionId));
    await db.delete(member).where(eq(member.organizationId, orgId));
    await db.delete(user).where(inArray(user.id, [userAId, userBId]));
    await db.delete(organization).where(eq(organization.id, orgId));
  });

  it("lists organizations with member count and resolved plan", async () => {
    const orgs = await listOrganizations(db);
    const org = orgs.find((o) => o.id === orgId);
    expect(org).toBeDefined();
    expect(org?.memberCount).toBe(2);
    expect(org?.planId).toBe(paidPlanId);
    expect(org?.subscriptionStatus).toBe("active");
  });

  it("lists users with their organization count", async () => {
    const users = await listUsers(db);
    const userA = users.find((u) => u.id === userAId);
    const userB = users.find((u) => u.id === userBId);
    expect(userA?.organizationCount).toBe(1);
    expect(userB?.organizationCount).toBe(1);
  });

  it("lists subscriptions with the owning organization's name and resolved plan", async () => {
    const subscriptions = await listSubscriptions(db);
    const sub = subscriptions.find((s) => s.id === subscriptionId);
    expect(sub?.organizationName).toBe("Admin Test Org");
    expect(sub?.planId).toBe(paidPlanId);
  });
});
