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
import clusterSchema from "@tepian-k3/schema/cluster.schema";
import { Effect } from "effect";
import { logger } from "@tepian-k3/services/logger";
import type { ExtendedColumnFilter } from "@tepian-k3/types/data-table.types";
import { filterColumns } from "@tepian-k3/utils/filter-column";

const clustersQueries = {
  getAllClusters() {
    return Effect.tryPromise({
      try: () =>
        db.query.clusters.findMany({
          where: isNull(clusters.deletedAt),
        }),
      catch: (error) => {
        logger.error("Error fetching all clusters", { error });
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data cluster",
        });
      },
    });
  },

  getClusterById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.clusters.findFirst({
          where: and(eq(clusters.id, id), isNull(clusters.deletedAt)),
        }),
      catch: (error) => {
        logger.error("Error fetching cluster by ID", { error });
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data cluster",
        });
      },
    }).pipe(
      Effect.flatMap((cluster) =>
        cluster ? Effect.succeed(cluster) : Effect.succeed(null)
      )
    );
  },

  getDeletedClusterById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.clusters.findFirst({
          where: and(eq(clusters.id, id), isNotNull(clusters.deletedAt)),
        }),
      catch: (error) => {
        logger.error("Error fetching deleted cluster by ID", { error });
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data cluster yang dihapus",
        });
      },
    }).pipe(
      Effect.flatMap((cluster) =>
        cluster ? Effect.succeed(cluster) : Effect.succeed(null)
      )
    );
  },

  getClusterByName(name: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.clusters.findFirst({
          where: and(eq(clusters.name, name), isNull(clusters.deletedAt)),
        }),
      catch: (error) => {
        logger.error("Error fetching cluster by name", { error });
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data cluster",
        });
      },
    }).pipe(
      Effect.flatMap((cluster) =>
        cluster ? Effect.succeed(cluster) : Effect.succeed(null)
      )
    );
  },

  getOffsetPaginatedClusters(
    input: z.infer<typeof clusterSchema.getAllClustersSchema>
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
                        })()
                      )
                    : undefined,
                  input.createdAt[1]
                    ? gte(
                        clusters.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[1]);
                          date.setHours(23, 59, 59, 999);
                          return date.toISOString();
                        })()
                      )
                    : undefined
                )
              : undefined,
            input.showDeleted
              ? isNotNull(clusters.deletedAt)
              : isNull(clusters.deletedAt)
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc ? desc(clusters[item.id]) : asc(clusters[item.id])
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
          logger.error("Error fetching paginated clusters", {
            error,
            input,
          });
          return new TRPCError({
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
          })
        );
      }

      const [newCluster] = yield* Effect.tryPromise({
        try: () => db.insert(clusters).values(data).returning(),
        catch: (error) => {
          logger.error("Error creating new cluster", { error, data });
          return new TRPCError({
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
          })
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
          })
        );
      }

      if (data.name && data.name !== existingCluster.name) {
        const isNameTaken = yield* clustersQueries.getClusterByName(data.name);
        if (isNameTaken) {
          return Effect.fail(
            new TRPCError({
              code: "CONFLICT",
              message: "Cluster dengan nama tersebut sudah ada",
            })
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
          logger.error("Error updating cluster", { error, data });
          return new TRPCError({
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
          })
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
          })
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
          logger.error("Error deleting cluster", { error, id });
          return new TRPCError({
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
          })
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
          })
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
          logger.error("Error restoring cluster", { error, id });
          return new TRPCError({
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
          })
        );
      }

      return restoredCluster;
    });
  },
};

export default clustersQueries;
