import { TRPCError } from "@trpc/server";
import { db } from "@tepian-k3/db/client";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  isNull,
} from "@tepian-k3/db";
import { clusters } from "@tepian-k3/db/schema";
import { z } from "zod";
import clusterSchema from "@tepian-k3/schema/pengujian/cluster.schema";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import type { ExtendedColumnFilter } from "@tepian-k3/types/data-table.types";
import { filterColumns } from "@tepian-k3/utils/filter-column";

const clustersQueries = {
  getAllClusters() {
    return Effect.tryPromise({
      try: () =>
        db.query.clusters.findMany({
          where: isNull(clusters.deletedAt),
          orderBy: [asc(clusters.sortOrder), asc(clusters.name)],
        }),
      catch: (error) => {
        logError(
          "clustersQueries.getAllClusters",
          "Error fetching all clusters",
          {
            error,
          },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data cluster",
        });
      },
    });
  },

  reorderClusters(payload: { id: string; direction: "left" | "right" }) {
    return Effect.gen(function* () {
      const allClusters = yield* Effect.tryPromise({
        try: () =>
          db.query.clusters.findMany({
            where: isNull(clusters.deletedAt),
            orderBy: [asc(clusters.sortOrder), asc(clusters.name)],
          }),
        catch: (error) => {
          logError(
            "clustersQueries.reorderClusters",
            "Error fetching all clusters for reordering",
            { error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil data cluster",
          });
        },
      });

      const currentIndex = allClusters.findIndex((c) => c.id === payload.id);
      if (currentIndex === -1) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Klaster tidak ditemukan",
          }),
        );
      }

      const targetIndex =
        payload.direction === "left" ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= allClusters.length) {
        return yield* Effect.succeed({ success: true });
      }

      const currentCluster = allClusters[currentIndex];
      const targetCluster = allClusters[targetIndex];

      if (!currentCluster || !targetCluster) {
        return yield* Effect.succeed({ success: true });
      }

      // Jika sortOrder sama, beri sequence baru 0, 1, 2... untuk semua klaster
      let currentOrder = currentCluster.sortOrder;
      let targetOrder = targetCluster.sortOrder;

      if (currentOrder === targetOrder) {
        currentOrder = currentIndex;
        targetOrder = targetIndex;
      }

      yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            // Normalisasi urutan seluruh cluster jika ada order duplikat
            for (let i = 0; i < allClusters.length; i++) {
              const item = allClusters[i];
              if (!item) continue;

              if (i === currentIndex) {
                await tx
                  .update(clusters)
                  .set({ sortOrder: targetOrder })
                  .where(eq(clusters.id, currentCluster.id));
              } else if (i === targetIndex) {
                await tx
                  .update(clusters)
                  .set({ sortOrder: currentOrder })
                  .where(eq(clusters.id, targetCluster.id));
              } else {
                await tx
                  .update(clusters)
                  .set({ sortOrder: i })
                  .where(eq(clusters.id, item.id));
              }
            }
          }),
        catch: (error) => {
          logError(
            "clustersQueries.reorderClusters",
            "Error updating cluster order in transaction",
            { error, payload },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui urutan klaster",
          });
        },
      });

      return yield* Effect.succeed({ success: true });
    });
  },

  getClusterById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.clusters.findFirst({
          where: and(eq(clusters.id, id), isNull(clusters.deletedAt)),
        }),
      catch: (error) => {
        logError(
          "clustersQueries.getClusterById",
          "Error fetching cluster by ID",
          {
            id,
            error,
          },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data cluster",
        });
      },
    }).pipe(
      Effect.flatMap((cluster) =>
        cluster ? Effect.succeed(cluster) : Effect.succeed(null),
      ),
    );
  },

  getDeletedClusterById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.clusters.findFirst({
          where: and(eq(clusters.id, id), isNotNull(clusters.deletedAt)),
        }),
      catch: (error) => {
        logError(
          "clustersQueries.getDeletedClusterById",
          "Error fetching deleted cluster by ID",
          {
            id,
            error,
          },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data cluster yang dihapus",
        });
      },
    }).pipe(
      Effect.flatMap((cluster) =>
        cluster ? Effect.succeed(cluster) : Effect.succeed(null),
      ),
    );
  },

  getClusterByName(name: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.clusters.findFirst({
          where: and(eq(clusters.name, name), isNull(clusters.deletedAt)),
        }),
      catch: (error) => {
        logError(
          "clustersQueries.getClusterByName",
          "Error fetching cluster by name",
          {
            name,
            error,
          },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data cluster",
        });
      },
    }).pipe(
      Effect.flatMap((cluster) =>
        cluster ? Effect.succeed(cluster) : Effect.succeed(null),
      ),
    );
  },

  getOffsetPaginatedClusters(
    input: z.infer<typeof clusterSchema.getAllClustersSchema>,
  ) {
    return Effect.gen(function* () {
      const offset = (input.page - 1) * input.perPage;
      const advancedTable = input.filters && input.filters.length > 0;

      const where = advancedTable
        ? filterColumns({
            table: clusters,
            filters: input.filters as ExtendedColumnFilter<typeof clusters>[],
            joinOperator: "and",
          })
        : and(
            input.name ? ilike(clusters.name, `%${input.name}%`) : undefined,
            input.createdAt.length > 0
              ? and(
                  input.createdAt[0]
                    ? gte(
                        clusters.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[0]);
                          date.setHours(0, 0, 0, 0);
                          return date.toISOString();
                        })(),
                      )
                    : undefined,
                  input.createdAt[1]
                    ? gte(
                        clusters.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[1]);
                          date.setHours(23, 59, 59, 999);
                          return date.toISOString();
                        })(),
                      )
                    : undefined,
                )
              : undefined,
            input.showDeleted
              ? isNotNull(clusters.deletedAt)
              : isNull(clusters.deletedAt),
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc ? desc(clusters[item.id]) : asc(clusters[item.id]),
            )
          : [desc(clusters.createdAt)];

      const { data, total } = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const data = await tx
              .select()
              .from(clusters)
              .limit(input.perPage)
              .offset(offset)
              .where(where)
              .orderBy(...orderBy);

            const total = await tx
              .select({
                count: count(),
              })
              .from(clusters)
              .where(where)
              .execute()
              .then((res) => res[0]?.count ?? 0);

            return { data, total };
          }),
        catch: (error) => {
          logError(
            "clustersQueries.getOffsetPaginatedClusters",
            "Error fetching paginated clusters",
            {
              input,
              error,
            },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengambil data cluster`,
            cause: error,
          });
        },
      });

      const pageCount = Math.ceil(total / input.perPage);

      return {
        data,
        pageCount,
      };
    });
  },

  createCluster(data: z.infer<typeof clusterSchema.createClusterSchema>) {
    return Effect.gen(this, function* () {
      const isExisting = yield* clustersQueries.getClusterByName(data.name);

      if (isExisting) {
        return Effect.fail(
          new TRPCError({
            code: "CONFLICT",
            message: "Cluster dengan nama tersebut sudah ada",
          }),
        );
      }

      const [newCluster] = yield* Effect.tryPromise({
        try: () => db.insert(clusters).values(data).returning(),
        catch: (error) => {
          logError(
            "clustersQueries.createCluster",
            "Error creating new cluster",
            { error, data },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat cluster baru",
          });
        },
      });

      if (!newCluster) {
        return Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat cluster baru",
          }),
        );
      }

      return newCluster;
    });
  },

  updateCluster(data: z.infer<typeof clusterSchema.updateClusterSchema>) {
    return Effect.gen(this, function* () {
      const existingCluster = yield* clustersQueries.getClusterById(data.id);

      if (!existingCluster) {
        return Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Cluster tidak ditemukan",
          }),
        );
      }

      if (data.name && data.name !== existingCluster.name) {
        const isNameTaken = yield* clustersQueries.getClusterByName(data.name);
        if (isNameTaken) {
          return Effect.fail(
            new TRPCError({
              code: "CONFLICT",
              message: "Cluster dengan nama tersebut sudah ada",
            }),
          );
        }
      }

      const [updatedCluster] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(clusters)
            .set({
              name: data.name ?? existingCluster.name,
              description: data.description ?? existingCluster.description,
            })
            .where(eq(clusters.id, data.id))
            .returning(),
        catch: (error) => {
          logError("clustersQueries.updateCluster", "Error updating cluster", {
            error,
            data,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui cluster",
            cause: error,
          });
        },
      });

      if (!updatedCluster) {
        return Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui cluster",
          }),
        );
      }

      return updatedCluster;
    });
  },

  deleteCluster(id: string) {
    return Effect.gen(this, function* () {
      const existingCluster = yield* clustersQueries.getClusterById(id);

      if (!existingCluster) {
        return Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Cluster tidak ditemukan",
          }),
        );
      }

      const [deletedCluster] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(clusters)
            .set({ deletedAt: new Date().toISOString() })
            .where(eq(clusters.id, id))
            .returning(),
        catch: (error) => {
          logError("clustersQueries.deleteCluster", "Error deleting cluster", {
            error,
            id,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus cluster",
            cause: error,
          });
        },
      });

      if (!deletedCluster) {
        return Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus cluster",
          }),
        );
      }

      return deletedCluster;
    });
  },

  restoreCluster(id: string) {
    return Effect.gen(this, function* () {
      const deletedCluster = yield* clustersQueries.getDeletedClusterById(id);

      if (!deletedCluster) {
        return Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Cluster yang dihapus tidak ditemukan",
          }),
        );
      }

      const [restoredCluster] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(clusters)
            .set({ deletedAt: null })
            .where(eq(clusters.id, id))
            .returning(),
        catch: (error) => {
          logError(
            "clustersQueries.restoreCluster",
            "Error restoring cluster",
            {
              error,
              id,
            },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan cluster",
            cause: error,
          });
        },
      });

      if (!restoredCluster) {
        return Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan cluster",
          }),
        );
      }

      return restoredCluster;
    });
  },

  hardDeleteCluster(id: string) {
    return Effect.tryPromise({
      try: () => db.delete(clusters).where(eq(clusters.id, id)).returning(),
      catch: (error) => {
        logError(
          "clustersQueries.hardDeleteCluster",
          "Error hard deleting cluster",
          { error, id },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus permanen cluster",
        });
      },
    });
  },
};

export default clustersQueries;
