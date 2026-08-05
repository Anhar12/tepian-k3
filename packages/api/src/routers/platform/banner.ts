import bannerSchema from "@tepian-k3/schema/platform/banner.schema";
import {
  createTRPCRouter,
  formDataInput,
  formDataProcedure,
  withPermission,
  withRateLimit,
} from "../..";
import bannerQueries from "@tepian-k3/queries/platform/banner.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { runEffect } from "../../utils/run-effect";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";
import { CACHE_KEYS, CACHE_TTL } from "@tepian-k3/constants";
import { withCache, withCacheInvalidation } from "../../utils/cache-helper";
import { Effect } from "effect";
import {
  processAndUploadImage,
  processAndUploadImageIfPresent,
} from "../../utils/image-upload";

export const bannerRouter = createTRPCRouter({
  getAllBanners: withRateLimit(rateLimiters.moderate()).query(
    async ({ ctx }) =>
      await withCache(
        CACHE_KEYS.BANNERS_ALL,
        CACHE_TTL.LONG,
        () => runEffect(bannerQueries.getAllActiveBanners("hero")),
        () => ctx.c.header("X-Data-Source", "cache"),
      ),
  ),

  getAllInfoBanners: withRateLimit(rateLimiters.moderate()).query(
    async ({ ctx }) =>
      await withCache(
        "banners:info:all",
        CACHE_TTL.LONG,
        () => runEffect(bannerQueries.getAllActiveBanners("info")),
        () => ctx.c.header("X-Data-Source", "cache"),
      ),
  ),

  getAllBannersForAdmin: withPermission("banners.view").query(
    async () => await runEffect(bannerQueries.getAllBannersForAdmin()),
  ),

  getPaginatedBanners: withPermission("banners.view")
    .input(bannerSchema.getAllBannersSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        bannerQueries.getOffsetPaginatedBanners(input),
      );

      return { data, pageCount };
    }),

  getBannerById: withPermission("banners.read")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .query(async ({ input }) => {
      const banner = await runEffect(bannerQueries.getBannerById(input.id));

      if (!banner) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Banner tidak ditemukan",
        });
      }

      return banner;
    }),

  createBanner: withPermission("banners.create")
    .input(formDataInput)
    .use(formDataProcedure(bannerSchema.createBannerSchema))
    .mutation(
      async ({ ctx }) =>
        await withCacheInvalidation(CACHE_KEYS.BANNERS_PREFIX, () =>
          runEffect(
            Effect.gen(function* () {
              const uploadedFile = yield* processAndUploadImage(
                ctx.input.data.picture,
                {
                  folder: "banners",
                },
              );

              const result = yield* bannerQueries.createBanner(
                ctx.input.data,
                uploadedFile.key,
              );

              return result;
            }),
          ),
        ),
    ),

  updateBanner: withPermission("banners.update")
    .input(formDataInput)
    .use(formDataProcedure(bannerSchema.updateBannerSchema))
    .mutation(
      async ({ ctx }) =>
        await withCacheInvalidation(CACHE_KEYS.BANNERS_PREFIX, () =>
          runEffect(
            Effect.gen(function* () {
              const bannerUrl = yield* processAndUploadImageIfPresent(
                ctx.input.data.picture,
                { folder: "banners" },
              );

              const result = yield* bannerQueries.updateBanner(
                ctx.input.data,
                bannerUrl,
              );

              return result;
            }),
          ),
        ),
    ),

  deleteBanner: withPermission("banners.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.BANNERS_PREFIX, () =>
          runEffect(bannerQueries.deleteBanner(input.id)),
        ),
    ),

  restoreBanner: withPermission("banners.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.BANNERS_PREFIX, () =>
          runEffect(bannerQueries.restoreBanner(input.id)),
        ),
    ),

  hardDeleteBanner: withPermission("banners.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.BANNERS_PREFIX, () =>
          runEffect(bannerQueries.hardDeleteBanner(input.id)),
        ),
    ),

  reorderBanners: withPermission("banners.update")
    .input(bannerSchema.reorderBannersSchema)
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.BANNERS_PREFIX, () =>
          runEffect(bannerQueries.reorderBanners(input.items)),
        ),
    ),
});
