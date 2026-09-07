/**
 * TEMPLATE EXAMPLE — a worked reference for the full domain pattern
 * (schema → service → router → page → test), not a real feature.
 * Safe to delete: see the `bootstrap-project` skill's "_example" step.
 */
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./auth";

export const exampleNote = pgTable("example_note", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
