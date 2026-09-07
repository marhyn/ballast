/**
 * TEMPLATE EXAMPLE — see packages/db/src/schema/example.ts. Safe to delete.
 */
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import type { Database } from "@ballast/db";
import { exampleNote } from "@ballast/db/schema";

export async function listNotes(db: Database, organizationId: string) {
  return db
    .select()
    .from(exampleNote)
    .where(eq(exampleNote.organizationId, organizationId))
    .orderBy(desc(exampleNote.createdAt));
}

export async function createNote(
  db: Database,
  organizationId: string,
  input: { title: string; body: string },
) {
  const [note] = await db
    .insert(exampleNote)
    .values({ id: randomUUID(), organizationId, title: input.title, body: input.body })
    .returning();
  if (!note) {
    throw new Error("Failed to create note");
  }
  return note;
}

/**
 * Filters by organizationId as well as id — not just a permission check, a
 * correctness one: without it, one Organization could delete another's row
 * by guessing/leaking its id.
 */
export async function deleteNote(db: Database, organizationId: string, noteId: string) {
  await db
    .delete(exampleNote)
    .where(and(eq(exampleNote.id, noteId), eq(exampleNote.organizationId, organizationId)));
}
