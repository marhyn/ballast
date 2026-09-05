import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./auth";

export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // "polar" | "stripe"
  providerCustomerId: text("provider_customer_id").notNull(),
  providerSubscriptionId: text("provider_subscription_id").notNull().unique(),
  status: text("status").notNull(), // "active" | "trialing" | "past_due" | "canceled"
  priceId: text("price_id").notNull(),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
