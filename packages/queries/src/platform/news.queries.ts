import { TRPCError } from "@trpc/server";
import { db } from "@tepian-k3/db/client";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  isNotNull,
  isNull,
  lte,
  gt,
  sql,
} from "@tepian-k3/db";
import { news } from "@tepian-k3/db/schema";
import { z } from "zod";
import newsSchema from "@tepian-k3/schema/platform/news.schema";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import { getOffsetPaginated } from "../utils/get-offset-paginated";
import { getCursorPaginated } from "../utils/get-cursor-paginated";
import { replaceStorageFile } from "../helpers/storage.helpers";

const newsQueries = {
  /**
   * Get First 5 Published News
   */
  getFirst5PublishedNews: () =>
    Effect.tryPromise({
      try: () =>
        db.query.news.findMany({
          where: and(
            eq(news.isPublished, true),
            lte(news.publishedAt, new Date().toISOString()), // only show if publish date has passed
            isNull(news.deletedAt),
          ),
          orderBy: [desc(news.publishedAt)],
          limit: 5,
        }),
      catch: (error) => {
        logError("news.queries", "getFirst5PublishedNews", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil berita",
        });
      },
    }),

  /**
   * Get Scheduled News
   */
  getScheduledNews: () =>
    Effect.tryPromise({
      try: () =>
        db.query.news.findMany({
          where: and(
            eq(news.isPublished, true),
            gt(news.publishedAt, sql`CURRENT_TIMESTAMP`), // future dates only
          ),
          orderBy: [asc(news.publishedAt)],
        }),
      catch: (error) => {
        logError("news.queries", "getScheduledNews", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil berita terjadwal",
        });
      },
    }),

  /**
   * Get Published News by ID (for public access)
   * @param {string} id
   */
  getPublishedNewsById: (id: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.news.findFirst({
          where: and(
            eq(news.id, id),
            eq(news.isPublished, true),
            lte(news.publishedAt, new Date().toISOString()),
            isNull(news.deletedAt),
          ),
        }),
      catch: (error) => {
        logError("news.queries", "getPublishedNewsById", { error, id });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil berita",
        });
      },
    }),

  /**
   * Get News by ID
   * @param {string} id
   */
  getNewsById: (id: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.news.findFirst({
          where: eq(news.id, id),
        }),
      catch: (error) => {
        logError("news.queries", "getNewsById", { error, id });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil berita",
        });
      },
    }),

  /**
   * Get Deleted News by ID
   */
  getDeletedNewsById: (id: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.news.findFirst({
          where: and(eq(news.id, id), isNotNull(news.deletedAt)),
        }),
      catch: (error) => {
        logError("news.queries", "getDeletedNewsById", { error, id });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil berita yang dihapus",
        });
      },
    }),

  /**
   * Get All News with Pagination and Filters
   * @param {z.infer<typeof newsSchema.getAllNewsSchema>} input
   */
  getOffsetPaginatedNews: (
    input: z.infer<typeof newsSchema.getAllNewsSchema>,
  ) =>
    getOffsetPaginated({
      table: news,
      input,
      searchConditions: [
        input.title ? ilike(news.title, `%${input.title}%`) : undefined,
        input.isPublished !== undefined
          ? eq(news.isPublished, input.isPublished)
          : undefined,
      ],
      errorContext: {
        queryName: "news.queries",
        errorMessage: "Gagal mengambil daftar berita",
      },
    }),

  /**
   * Get All News with Cursor Pagination and Filters
   * @param {z.infer<typeof newsSchema.getCursorPaginatedNewsSchema>} input
   */
  getCursorPaginatedNews: (
    input: z.infer<typeof newsSchema.getCursorPaginatedNewsSchema>,
  ) =>
    getCursorPaginated({
      table: news,
      input,
      searchConditions: [
        input.title ? ilike(news.title, `%${input.title}%`) : undefined,
        input.isPublished !== undefined
          ? eq(news.isPublished, input.isPublished)
          : undefined,
      ],
      errorContext: {
        queryName: "news.queries",
        errorMessage: "Gagal mengambil daftar berita",
      },
    }),

  /**
   * Create News
   * @param {z.infer<typeof newsSchema.createNewsSchema>} data
   * @param {string} imageUrl
   */
  createNews: (
    data: z.infer<typeof newsSchema.createNewsSchema>,
    imageUrl: string,
  ) =>
    Effect.gen(function* () {
      const [newNews] = yield* Effect.tryPromise({
        try: () =>
          db
            .insert(news)
            .values({
              ...data,
              imageUrl,
            })
            .returning(),
        catch: (error) => {
          logError("news.queries", "createNews", { error, data });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat berita",
          });
        },
      });

      if (!newNews) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat berita",
          }),
        );
      }

      return newNews;
    }),

  /**
   * Update News
   * @param {z.infer<typeof newsSchema.updateNewsSchema>} data
   * @param {string | null | undefined} imageUrl
   */
  updateNews: (
    data: z.infer<typeof newsSchema.updateNewsSchema>,
    imageUrl: string | null | undefined,
  ) =>
    Effect.gen(function* () {
      const isExist = yield* newsQueries.getNewsById(data.id);

      if (!isExist) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Berita tidak ditemukan",
          }),
        );
      }

      const [updatedNews] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(news)
            .set({
              ...data,
              imageUrl: imageUrl ?? isExist.imageUrl,
            })
            .where(eq(news.id, data.id))
            .returning(),
        catch: (error) => {
          logError("news.queries", "updateNews", { error, data, imageUrl });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui berita",
          });
        },
      });

      if (!updatedNews) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui berita",
          }),
        );
      }

      yield* replaceStorageFile(imageUrl, isExist.imageUrl, "news.queries");

      return updatedNews;
    }),

  /**
   * Delete News
   */
  deleteNews: (id: string) =>
    Effect.gen(function* () {
      const isExist = yield* newsQueries.getNewsById(id);

      if (!isExist) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Berita tidak ditemukan",
          }),
        );
      }

      const [deletedNews] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(news)
            .set({ deletedAt: new Date().toISOString() })
            .where(eq(news.id, id))
            .returning(),
        catch: (error) => {
          logError("news.queries", "deleteNews", { error, id });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus berita",
          });
        },
      });

      if (!deletedNews) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus berita",
          }),
        );
      }

      return deletedNews;
    }),

  /**
   * Restore Deleted News
   */
  restoreDeletedNews: (id: string) =>
    Effect.gen(function* () {
      const isExist = yield* newsQueries.getDeletedNewsById(id);

      if (!isExist) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Berita yang dihapus tidak ditemukan",
          }),
        );
      }

      const [restoredNews] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(news)
            .set({ deletedAt: null })
            .where(eq(news.id, id))
            .returning(),
        catch: (error) => {
          logError("news.queries", "restoreDeletedNews", { error, id });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan berita yang dihapus",
          });
        },
      });

      if (!restoredNews) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan berita yang dihapus",
          }),
        );
      }

      return restoredNews;
    }),

  /**
   * Hard delete news permanently
   */
  hardDeleteNews: (id: string) =>
    Effect.tryPromise({
      try: () => db.delete(news).where(eq(news.id, id)).returning(),
      catch: (error) => {
        logError("news.queries", "hardDeleteNews", { error, id });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus permanen berita",
        });
      },
    }),
};

export default newsQueries;
