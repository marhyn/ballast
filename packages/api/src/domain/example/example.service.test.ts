/**
 * TEMPLATE EXAMPLE — see packages/db/src/schema/example.ts. Safe to delete.
 *
 * A real integration test against Postgres (packages/db's `db`), not a
 * mock — demonstrating the testing pattern for a domain service, including
 * the tenant-isolation guarantee deleteNote depends on.
 */
import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@ballast/db";
import { organization } from "@ballast/db/schema";
import { createNote, deleteNote, listNotes } from "./example.service";

describe("example domain service", () => {
  const orgA = randomUUID();
  const orgB = randomUUID();

  beforeAll(async () => {
    await db.insert(organization).values([
      { id: orgA, name: "Org A", slug: `org-a-${orgA}` },
      { id: orgB, name: "Org B", slug: `org-b-${orgB}` },
    ]);
  });

  afterAll(async () => {
    await db.delete(organization).where(inArray(organization.id, [orgA, orgB]));
  });

  it("creates and lists notes scoped to an organization", async () => {
    await createNote(db, orgA, { title: "First", body: "Hello" });
    const notes = await listNotes(db, orgA);
    expect(notes).toHaveLength(1);
    expect(notes[0]?.title).toBe("First");
  });

  it("does not leak notes across organizations", async () => {
    await createNote(db, orgB, { title: "B's note", body: "..." });

    const notesForA = await listNotes(db, orgA);
    const notesForB = await listNotes(db, orgB);

    expect(notesForA.every((note) => note.organizationId === orgA)).toBe(true);
    expect(notesForB.every((note) => note.organizationId === orgB)).toBe(true);
  });

  it("refuses to delete a note belonging to a different organization", async () => {
    const note = await createNote(db, orgA, { title: "Protected", body: "..." });

    await deleteNote(db, orgB, note.id);
    expect((await listNotes(db, orgA)).some((n) => n.id === note.id)).toBe(true);

    await deleteNote(db, orgA, note.id);
    expect((await listNotes(db, orgA)).some((n) => n.id === note.id)).toBe(false);
  });
});
