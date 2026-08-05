import { TRPCError } from "@trpc/server";
import { db } from "@tepian-k3/db/client";
import { asc, eq, isNull } from "@tepian-k3/db";
import { landingRegions } from "@tepian-k3/db/schema";
import { z } from "zod";
import landingRegionSchema from "@tepian-k3/schema/platform/landing-region.schema";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";

const landingRegionQueries = {
  /**
   * Get all active region statistics sorted by sortOrder
   */
  getAllLandingRegions: () =>
    Effect.tryPromise({
      try: () =>
        db.query.landingRegions.findMany({
          where: isNull(landingRegions.deletedAt),
          orderBy: asc(landingRegions.sortOrder),
        }),
      catch: (error) => {
        logError("landingRegion.queries", "getAllLandingRegions", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data wilayah kerja.",
        });
      },
    }),

  /**
   * Create a new landing region entry
   * @param {z.infer<typeof landingRegionSchema.createLandingRegionSchema>} data
   */
  createLandingRegion: (
    data: z.infer<typeof landingRegionSchema.createLandingRegionSchema>,
  ) =>
    Effect.tryPromise({
      try: async () => {
        const [created] = await db
          .insert(landingRegions)
          .values(data)
          .returning();

        if (!created) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menambahkan wilayah kerja.",
          });
        }
        return created;
      },
      catch: (error) => {
        logError("landingRegion.queries", "createLandingRegion", {
          error,
          data,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menambahkan wilayah kerja.",
        });
      },
    }),

  /**
   * Update an existing landing region entry
   * @param {z.infer<typeof landingRegionSchema.updateLandingRegionSchema>} data
   */
  updateLandingRegion: (
    data: z.infer<typeof landingRegionSchema.updateLandingRegionSchema>,
  ) =>
    Effect.tryPromise({
      try: async () => {
        const { id, ...updateData } = data;
        const [updated] = await db
          .update(landingRegions)
          .set(updateData)
          .where(eq(landingRegions.id, id))
          .returning();

        if (!updated) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Data wilayah kerja tidak ditemukan.",
          });
        }
        return updated;
      },
      catch: (error) => {
        logError("landingRegion.queries", "updateLandingRegion", {
          error,
          data,
        });
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memperbarui wilayah kerja.",
        });
      },
    }),

  /**
   * Soft delete a landing region
   * @param {string} id
   */
  deleteLandingRegion: (id: string) =>
    Effect.tryPromise({
      try: async () => {
        const [deleted] = await db
          .update(landingRegions)
          .set({ deletedAt: new Date().toISOString() })
          .where(eq(landingRegions.id, id))
          .returning();

        if (!deleted) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Data wilayah kerja tidak ditemukan.",
          });
        }
        return deleted;
      },
      catch: (error) => {
        logError("landingRegion.queries", "deleteLandingRegion", { error, id });
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus wilayah kerja.",
        });
      },
    }),
};

export default landingRegionQueries;
