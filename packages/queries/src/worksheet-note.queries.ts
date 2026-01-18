import { desc, eq } from "@tepian-k3/db";
import { db } from "@tepian-k3/db/client";
import { worksheetNotes } from "@tepian-k3/db/schema";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";
import { logError } from "effect/Effect";

const worksheetNoteQueries = {
  /**
   * Get worksheet note by worksheet ID.
   */
  getWorksheetNoteByWorksheetId: (worksheetId: string) =>
    Effect.tryPromise({
      try: async () =>
        db.query.worksheetNotes.findMany({
          where: eq(worksheetNotes.worksheetId, worksheetId),
          orderBy: [desc(worksheetNotes.createdAt)],
          with: {
            createdBy: true,
          },
        }),
      catch: (error) => {
        logError(
          "worksheetNoteQueries.getWorksheetNoteByWorksheetId",
          "Failed to get worksheet notes by worksheet ID",
          {
            worksheetId,
            error,
          },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mendapatkan catatan lembar kerja.",
        });
      },
    }),
};

export default worksheetNoteQueries;
