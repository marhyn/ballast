import { eq } from "drizzle-orm";
import type { Database } from "@ballast/db";
import { organization, member } from "@ballast/db/schema";

export async function listOrganizationsForUser(db: Database, userId: string) {
  return db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      role: member.role,
    })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(eq(member.userId, userId));
}
