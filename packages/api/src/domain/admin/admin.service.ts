import { desc, sql } from "drizzle-orm";
import type { Database } from "@ballast/db";
import { organization, user, member, subscription } from "@ballast/db/schema";
import { getPlanForPriceId } from "@ballast/billing";

export async function listOrganizations(db: Database) {
  const [organizations, memberCounts, subscriptions] = await Promise.all([
    db.select().from(organization).orderBy(desc(organization.createdAt)),
    db.select({ organizationId: member.organizationId, count: sql<number>`count(*)::int` }).from(member).groupBy(member.organizationId),
    db.select().from(subscription),
  ]);

  const memberCountByOrg = new Map(memberCounts.map((row) => [row.organizationId, row.count]));
  const subscriptionByOrg = new Map(subscriptions.map((row) => [row.organizationId, row]));

  return organizations.map((org) => {
    const sub = subscriptionByOrg.get(org.id);
    return {
      ...org,
      memberCount: memberCountByOrg.get(org.id) ?? 0,
      planId: sub ? (getPlanForPriceId(sub.priceId)?.id ?? null) : null,
      subscriptionStatus: sub?.status ?? null,
    };
  });
}

export async function listUsers(db: Database) {
  const [users, organizationCounts] = await Promise.all([
    db.select().from(user).orderBy(desc(user.createdAt)),
    db.select({ userId: member.userId, count: sql<number>`count(*)::int` }).from(member).groupBy(member.userId),
  ]);

  const organizationCountByUser = new Map(organizationCounts.map((row) => [row.userId, row.count]));

  return users.map((u) => ({
    ...u,
    organizationCount: organizationCountByUser.get(u.id) ?? 0,
  }));
}

export async function listSubscriptions(db: Database) {
  const [subscriptions, organizations] = await Promise.all([
    db.select().from(subscription).orderBy(desc(subscription.createdAt)),
    db.select({ id: organization.id, name: organization.name }).from(organization),
  ]);

  const organizationNameById = new Map(organizations.map((org) => [org.id, org.name]));

  return subscriptions.map((sub) => ({
    ...sub,
    organizationName: organizationNameById.get(sub.organizationId) ?? "Unknown organization",
    planId: getPlanForPriceId(sub.priceId)?.id ?? null,
  }));
}
