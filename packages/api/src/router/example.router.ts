/**
 * TEMPLATE EXAMPLE — see packages/db/src/schema/example.ts. Safe to delete.
 */
import { z } from "zod";
import { organizationProcedure } from "../procedures";
import { createNote, deleteNote, listNotes } from "../domain/example/example.service";

export const exampleRouter = {
  list: organizationProcedure.handler(async ({ context }) => {
    return listNotes(context.db, context.organizationId);
  }),

  create: organizationProcedure
    .input(z.object({ title: z.string().min(1), body: z.string() }))
    .handler(async ({ context, input }) => {
      return createNote(context.db, context.organizationId, input);
    }),

  delete: organizationProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      await deleteNote(context.db, context.organizationId, input.id);
      return { success: true };
    }),
};
