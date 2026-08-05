import { TRPCError } from "@trpc/server";
import { db } from "@tepian-k3/db/client";
import { asc, eq, isNull } from "@tepian-k3/db";
import { landingStats } from "@tepian-k3/db/schema";
import { z } from "zod";
import landingStatsSchema from "@tepian-k3/schema/platform/landing-stats.schema";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";

const landingStatsQueries = {
  /**
   * Get all active landing statistics sorted by sortOrder
   */
  getAllLandingStats: () =>
    Effect.tryPromise({
      try: () =>
        db.query.landingStats.findMany({
          where: isNull(landingStats.deletedAt),
          orderBy: asc(landingStats.sortOrder),
        }),
      catch: (error) => {
        logError("landingStats.queries", "getAllLandingStats", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data statistik landing page.",
        });
      },
    }),

  /**
   * Upsert (insert or update) a landing stat record by serviceType
   * @param {z.infer<typeof landingStatsSchema.upsertLandingStatSchema>} data
   */
  upsertLandingStat: (
    data: z.infer<typeof landingStatsSchema.upsertLandingStatSchema>,
  ) =>
    Effect.tryPromise({
      try: async () => {
        const existing = await db.query.landingStats.findFirst({
          where: eq(landingStats.serviceType, data.serviceType),
        });

        if (existing) {
          const [updated] = await db
            .update(landingStats)
            .set({
              primaryCount: data.primaryCount,
              primaryLabel: data.primaryLabel,
              secondaryCount: data.secondaryCount,
              secondaryLabel: data.secondaryLabel,
              sortOrder: data.sortOrder ?? existing.sortOrder,
              deletedAt: null,
            })
            .where(eq(landingStats.id, existing.id))
            .returning();

          if (!updated) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Gagal memperbarui data statistik.",
            });
          }
          return updated;
        } else {
          const [created] = await db
            .insert(landingStats)
            .values(data)
            .returning();

          if (!created) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Gagal menambahkan data statistik.",
            });
          }
          return created;
        }
      },
      catch: (error) => {
        logError("landingStats.queries", "upsertLandingStat", { error, data });
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menyimpan data statistik.",
        });
      },
    }),
};

export default landingStatsQueries;
