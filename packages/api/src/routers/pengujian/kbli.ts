import kbliSchema from "@tepian-k3/schema/pengujian/kbli.schema";
import { createTRPCRouter, withPermission, withRateLimit } from "../..";
import kbliQueries from "@tepian-k3/queries/pengujian/kbli.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { runEffect } from "../../utils/run-effect";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";
import { CACHE_KEYS, CACHE_TTL } from "@tepian-k3/constants";
import { withCache, withCacheInvalidation } from "../../utils/cache-helper";

export const kbliRouter = createTRPCRouter({
  getAllKblis: withRateLimit(rateLimiters.moderate()).query(
    async ({ ctx }) =>
      await withCache(
        CACHE_KEYS.KBLIS_ALL,
        CACHE_TTL.LONG,
        () => runEffect(kbliQueries.getAllKblis()),
        () => ctx.c.header("X-Data-Source", "cache"),
      ),
  ),

  getPaginatedKblis: withPermission("kbli.view")
    .input(kbliSchema.getAllKBLISchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        kbliQueries.getOffsetPaginatedKblis(input),
      );

      return { data, pageCount };
    }),

  getKbliById: withPermission("kbli.read")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .query(async ({ input }) => {
      const kbli = await runEffect(kbliQueries.getKbliById(input.id));

      if (!kbli) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kbli tidak ditemukan",
        });
      }

      return kbli;
    }),

  createKbli: withPermission("kbli.create")
    .input(kbliSchema.createKBLISchema)
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.KBLIS_PREFIX, () =>
          runEffect(kbliQueries.createKbli(input)),
        ),
    ),

  updateKbli: withPermission("kbli.update")
    .input(kbliSchema.updateKBLISchema)
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.KBLIS_PREFIX, () =>
          runEffect(kbliQueries.updateKbli(input)),
        ),
    ),

  deleteKbli: withPermission("kbli.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.KBLIS_PREFIX, () =>
          runEffect(kbliQueries.deleteKbli(input.id)),
        ),
    ),

  restoreKbli: withPermission("kbli.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.KBLIS_PREFIX, () =>
          runEffect(kbliQueries.restoreKbli(input.id)),
        ),
    ),

  hardDeleteKbli: withPermission("kbli.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.KBLIS_PREFIX, () =>
          runEffect(kbliQueries.hardDeleteKbli(input.id)),
        ),
    ),
});
