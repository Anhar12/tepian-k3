import clusterSchema from "@tepian-k3/schema/pengujian/cluster.schema";
import { createTRPCRouter, withPermission, withRateLimit } from "../..";
import clustersQueries from "@tepian-k3/queries/pengujian/clusters.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { runEffect } from "../../utils/run-effect";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";
import { CACHE_KEYS, CACHE_TTL } from "@tepian-k3/constants";
import { withCache, withCacheInvalidation } from "../../utils/cache-helper";

export const clusterRouter = createTRPCRouter({
  getAllClusters: withRateLimit(rateLimiters.moderate()).query(
    async () =>
      await withCache(CACHE_KEYS.CLUSTERS_ALL, CACHE_TTL.LONG, () =>
        runEffect(clustersQueries.getAllClusters()),
      ),
  ),

  getPaginatedClusters: withPermission("clusters.view")
    .input(clusterSchema.getAllClustersSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        clustersQueries.getOffsetPaginatedClusters(input),
      );

      return { data, pageCount };
    }),

  getClusterById: withPermission("clusters.read")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .query(async ({ input }) => {
      const cluster = await runEffect(clustersQueries.getClusterById(input.id));

      if (!cluster) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cluster tidak ditemukan",
        });
      }

      return cluster;
    }),

  createCluster: withPermission("clusters.create")
    .input(clusterSchema.createClusterSchema)
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.CLUSTERS_PREFIX, () =>
          runEffect(clustersQueries.createCluster(input)),
        ),
    ),

  updateCluster: withPermission("clusters.update")
    .input(clusterSchema.updateClusterSchema)
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.CLUSTERS_PREFIX, () =>
          runEffect(clustersQueries.updateCluster(input)),
        ),
    ),

  deleteCluster: withPermission("clusters.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.CLUSTERS_PREFIX, () =>
          runEffect(clustersQueries.deleteCluster(input.id)),
        ),
    ),

  restoreCluster: withPermission("clusters.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.CLUSTERS_PREFIX, () =>
          runEffect(clustersQueries.restoreCluster(input.id)),
        ),
    ),
});
