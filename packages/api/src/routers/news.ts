import newsSchema from "@tepian-k3/schema/news.schema";
import {
  createTRPCRouter,
  formDataInput,
  formDataProcedure,
  withPermission,
  withRateLimit,
} from "..";
import newsQueries from "@tepian-k3/queries/news.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { runEffect } from "../utils/run-effect";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";
import { CACHE_KEYS, CACHE_TTL } from "@tepian-k3/constants";
import { withCache, withCacheInvalidation } from "../utils/cache-helper";
import { Effect } from "effect";
import {
  processAndUploadImage,
  processAndUploadImageIfPresent,
} from "../utils/image-upload";

export const newsRouter = createTRPCRouter({
  getFirst5News: withRateLimit(rateLimiters.moderate()).query(
    async () =>
      await withCache(CACHE_KEYS.NEWS_FIRST_5, CACHE_TTL.LONG, () =>
        runEffect(newsQueries.getFirst5PublishedNews()),
      ),
  ),

  getPublishedNewsById: withRateLimit(rateLimiters.moderate())
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .query(
      async ({ input }) =>
        await withCache(
          `${CACHE_KEYS.NEWS_PREFIX}${input.id}`,
          CACHE_TTL.MEDIUM,
          async () => {
            const newsItem = await runEffect(
              newsQueries.getPublishedNewsById(input.id),
            );

            if (!newsItem) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Berita tidak ditemukan",
              });
            }

            return newsItem;
          },
        ),
    ),

  getCursorPaginatedNews: withRateLimit(rateLimiters.moderate())
    .input(newsSchema.getCursorPaginatedNewsSchema)
    .query(async ({ input }) => {
      const { data, nextCursor, hasMore } = await runEffect(
        newsQueries.getCursorPaginatedNews(input),
      );

      return { data, nextCursor, hasMore };
    }),

  getPaginatedNews: withPermission("news.view")
    .input(newsSchema.getAllNewsSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        newsQueries.getOffsetPaginatedNews(input),
      );

      return { data, pageCount };
    }),

  getNewsById: withPermission("news.read")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .query(async ({ input }) => {
      const newsItem = await runEffect(newsQueries.getNewsById(input.id));

      if (!newsItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Berita tidak ditemukan",
        });
      }

      return newsItem;
    }),

  createNews: withPermission("news.create")
    .input(formDataInput)
    .use(formDataProcedure(newsSchema.createNewsSchema))
    .mutation(
      async ({ ctx }) =>
        await withCacheInvalidation(
          [CACHE_KEYS.NEWS_ALL, CACHE_KEYS.NEWS_FIRST_5],
          () =>
            runEffect(
              Effect.gen(function* () {
                const uploadedFile = yield* processAndUploadImage(
                  ctx.input.data.image,
                  {
                    folder: "news",
                  },
                );

                const result = yield* newsQueries.createNews(
                  ctx.input.data,
                  uploadedFile.key,
                );

                return result;
              }),
            ),
        ),
    ),

  updateNews: withPermission("news.update")
    .input(formDataInput)
    .use(formDataProcedure(newsSchema.updateNewsSchema))
    .mutation(
      async ({ ctx }) =>
        await withCacheInvalidation(
          [
            CACHE_KEYS.NEWS_ALL,
            CACHE_KEYS.NEWS_FIRST_5,
            `${CACHE_KEYS.NEWS_PREFIX}${ctx.input.data.id}`,
          ],
          () =>
            runEffect(
              Effect.gen(function* () {
                const imageUrl = yield* processAndUploadImageIfPresent(
                  ctx.input.data.image,
                  { folder: "news" },
                );

                const result = yield* newsQueries.updateNews(
                  ctx.input.data,
                  imageUrl,
                );

                return result;
              }),
            ),
        ),
    ),

  deleteNews: withPermission("news.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(
          [
            CACHE_KEYS.NEWS_ALL,
            CACHE_KEYS.NEWS_FIRST_5,
            `${CACHE_KEYS.NEWS_PREFIX}${input.id}`,
          ],
          () => runEffect(newsQueries.deleteNews(input.id)),
        ),
    ),

  restoreNews: withPermission("news.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(
          [
            CACHE_KEYS.NEWS_ALL,
            CACHE_KEYS.NEWS_FIRST_5,
            `${CACHE_KEYS.NEWS_PREFIX}${input.id}`,
          ],
          () => runEffect(newsQueries.restoreDeletedNews(input.id)),
        ),
    ),
});
