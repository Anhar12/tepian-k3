import { TRPCError } from "@trpc/server";
import { db } from "@tepian-k3/db/client";
import { and, asc, eq, ilike, isNotNull, isNull } from "@tepian-k3/db";
import { banners } from "@tepian-k3/db/schema";
import { z } from "zod";
import bannerSchema from "@tepian-k3/schema/platform/banner.schema";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import { getOffsetPaginated } from "../utils/get-offset-paginated";
import { replaceStorageFile } from "../helpers/storage.helpers";

const bannerQueries = {
  /**
   * Get all active banners for user display (filtered by type: 'hero' | 'info')
   */
  getAllActiveBanners: (type: string = "hero") =>
    Effect.tryPromise({
      try: () =>
        db.query.banners.findMany({
          where: and(
            eq(banners.isActive, true),
            eq(banners.type, type),
            isNull(banners.deletedAt),
          ),
          orderBy: asc(banners.order),
        }),
      catch: (error) => {
        logError("banner.queries", "getAllActiveBanners", { error, type });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil banner aktif.",
        });
      },
    }),

  /**
   * Get all banners (active & inactive) for admin management
   */
  getAllBannersForAdmin: () =>
    Effect.tryPromise({
      try: () =>
        db.query.banners.findMany({
          where: isNull(banners.deletedAt),
          orderBy: asc(banners.order),
        }),
      catch: (error) => {
        logError("banner.queries", "getAllBannersForAdmin", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil semua data banner.",
        });
      },
    }),

  /**
   * Get active banners with id
   * @param {string} id
   */
  getBannerById: (id: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.banners.findFirst({
          where: and(eq(banners.id, id), isNull(banners.deletedAt)),
        }),
      catch: (error) => {
        logError("banner.queries", "getBannerById", { error, id });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil banner.",
        });
      },
    }),

  /**
   * Get banner by order
   * @param {number} order
   */
  getBannerByOrder: (order: number) =>
    Effect.tryPromise({
      try: () =>
        db.query.banners.findFirst({
          where: and(eq(banners.order, order), isNull(banners.deletedAt)),
        }),
      catch: (error) => {
        logError("banner.queries", "getBannerByOrder", { error, order });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil banner.",
        });
      },
    }),

  /**
   * Get deleted banners by id
   * @param {string} id
   */
  getDeletedBannerById: (id: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.banners.findFirst({
          where: and(eq(banners.id, id), isNotNull(banners.deletedAt)),
        }),
      catch: (error) => {
        logError("banner.queries", "getDeletedBannerById", { error, id });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil banner terhapus.",
        });
      },
    }),

  /**
   * Get Offset Pagination Banners
   * @param {z.infer<typeof bannerSchema.getAllBannersSchema>} input
   */
  getOffsetPaginatedBanners: (
    input: z.infer<typeof bannerSchema.getAllBannersSchema>,
  ) =>
    getOffsetPaginated({
      table: banners,
      input,
      searchConditions: [
        input.title ? ilike(banners.title, `%${input.title}%`) : undefined,
        input.order ? eq(banners.order, input.order) : undefined,
        input.isActive !== undefined
          ? eq(banners.isActive, input.isActive)
          : undefined,
      ],
      errorContext: {
        queryName: "banner.queries",
        errorMessage: "Gagal mengambil data banner.",
      },
    }),

  /**
   * Create Banner
   * @param {z.infer<typeof bannerSchema.createBannerSchema>} data
   * @param {string} bannerUrl
   */
  createBanner: (
    data: z.infer<typeof bannerSchema.createBannerSchema>,
    bannerUrl: string,
  ) =>
    Effect.gen(this, function* () {
      const isExisting = yield* bannerQueries.getBannerByOrder(data.order);

      if (isExisting) {
        const allBanners = yield* Effect.tryPromise({
          try: () => db.select({ order: banners.order }).from(banners),
          catch: () => [],
        });
        const maxOrder = allBanners.reduce(
          (max, b) => Math.max(max, b.order),
          0,
        );
        data.order = maxOrder + 1;
      }

      const [newBanner] = yield* Effect.tryPromise({
        try: () =>
          db
            .insert(banners)
            .values({ ...data, bannerUrl })
            .returning(),
        catch: (error) => {
          logError("banner.queries", "createBanner", { error, data });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat banner.",
          });
        },
      });

      if (!newBanner) {
        return Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat banner.",
          }),
        );
      }

      return newBanner;
    }),

  /**
   * Update Banner
   * @param {z.infer<typeof bannerSchema.updateBannerSchema>} data
   * @param {string} bannerUrl (optional)
   */
  updateBanner: (
    data: z.infer<typeof bannerSchema.updateBannerSchema>,
    bannerUrl?: string,
  ) =>
    Effect.gen(this, function* () {
      const existingBanner = yield* bannerQueries.getBannerById(data.id);

      if (!existingBanner) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Banner tidak ditemukan.",
          }),
        );
      }

      // Handle order changes
      if (data.order !== undefined && data.order !== existingBanner.order) {
        const bannerWithTargetOrder = yield* bannerQueries.getBannerByOrder(
          data.order,
        );

        if (bannerWithTargetOrder) {
          // Swap orders
          // Swap the order of the existing banner with the target order
          yield* Effect.tryPromise({
            try: () =>
              db
                .update(banners)
                .set({ order: existingBanner.order })
                .where(eq(banners.id, bannerWithTargetOrder.id)),
            catch: (error) => {
              logError("banner.queries", "updateBanner:swapOrder", { error });
              return new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal memperbarui urutan banner.",
              });
            },
          });
        }
      }

      const [updatedBanner] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(banners)
            .set({ ...data, bannerUrl: bannerUrl ?? existingBanner.bannerUrl })
            .where(eq(banners.id, data.id))
            .returning(),
        catch: (error) => {
          logError("banner.queries", "updateBanner", { error, data });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui banner.",
          });
        },
      });

      if (!updatedBanner) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui banner.",
          }),
        );
      }

      yield* replaceStorageFile(
        bannerUrl,
        existingBanner.bannerUrl,
        "banner.queries",
      );

      return updatedBanner;
    }),

  /**
   * Delete banner
   * @param {string} id
   */
  deleteBanner: (id: string) =>
    Effect.gen(this, function* () {
      const existingBanner = yield* bannerQueries.getBannerById(id);

      if (!existingBanner) {
        return Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Banner tidak ditemukan.",
          }),
        );
      }

      const [deleted] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(banners)
            .set({ deletedAt: new Date().toISOString(), isActive: false })
            .where(eq(banners.id, id))
            .returning(),
        catch: (error) => {
          logError("banner.queries", "deleteBanner", { error, id });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus banner.",
          });
        },
      });

      if (!deleted) {
        return Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus banner.",
          }),
        );
      }

      return deleted;
    }),

  /**
   * Restore Banner
   * @param {string} id
   */
  restoreBanner: (id: string) =>
    Effect.gen(this, function* () {
      const deletedBanner = yield* bannerQueries.getDeletedBannerById(id);

      if (!deletedBanner) {
        return Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Banner terhapus tidak ditemukan.",
          }),
        );
      }

      const [restored] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(banners)
            .set({ deletedAt: null })
            .where(eq(banners.id, id))
            .returning(),
        catch: (error) => {
          logError("banner.queries", "restoreBanner", { error, id });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan banner.",
          });
        },
      });

      if (!restored) {
        return Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan banner.",
          }),
        );
      }

      return restored;
    }),

  /**
   * Hard delete banner
   * @param {string} id
   */
  hardDeleteBanner: (id: string) =>
    Effect.tryPromise({
      try: () => db.delete(banners).where(eq(banners.id, id)).returning(),
      catch: (error) => {
        logError("banner.queries", "hardDeleteBanner", { error, id });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus permanen banner.",
        });
      },
    }),

  /**
   * Bulk reorder banners
   * @param {Array<{ id: string; order: number }>} items
   */
  reorderBanners: (items: Array<{ id: string; order: number }>) =>
    Effect.tryPromise({
      try: () =>
        db.transaction(async (tx) => {
          for (const item of items) {
            await tx
              .update(banners)
              .set({ order: item.order })
              .where(eq(banners.id, item.id));
          }
          return items;
        }),
      catch: (error) => {
        logError("banner.queries", "reorderBanners", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memperbarui urutan banner.",
        });
      },
    }),
};

export default bannerQueries;
