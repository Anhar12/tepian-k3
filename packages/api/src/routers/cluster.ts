import clusterSchema from "@tepian-k3/schema/cluster.schema";
import { createTRPCRouter, withPermission, withRateLimit } from "..";
import clustersQueries from "@tepian-k3/queries/clusters.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { runEffect } from "../utils/run-effect";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";
import { cacheService } from "@tepian-k3/services/cache";
import { CACHE_KEYS, CACHE_TTL } from "@tepian-k3/constants";

const getAllClustersFromDb = () =>
  runEffect(clustersQueries.getAllClusters());

export const clusterRouter = createTRPCRouter({
  getAllClusters: withRateLimit(rateLimiters.moderate()).query(async () => {
    type Clusters = Awaited<ReturnType<typeof getAllClustersFromDb>>;
    const cached = await cacheService.get<Clusters>(CACHE_KEYS.CLUSTERS_ALL);
    if (cached) return cached;

    const result = await getAllClustersFromDb();
    await cacheService.set(CACHE_KEYS.CLUSTERS_ALL, result, CACHE_TTL.LONG);
    return result;
  }),

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
    .mutation(async ({ input }) => {
      const result = await runEffect(clustersQueries.createCluster(input));
      await cacheService.deleteByPrefix(CACHE_KEYS.CLUSTERS_PREFIX);
      return result;
    }),

  updateCluster: withPermission("clusters.update")
    .input(clusterSchema.updateClusterSchema)
    .mutation(async ({ input }) => {
      const result = await runEffect(clustersQueries.updateCluster(input));
      await cacheService.deleteByPrefix(CACHE_KEYS.CLUSTERS_PREFIX);
      return result;
    }),

  deleteCluster: withPermission("clusters.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await runEffect(clustersQueries.deleteCluster(input.id));
      await cacheService.deleteByPrefix(CACHE_KEYS.CLUSTERS_PREFIX);
      return result;
    }),

  restoreCluster: withPermission("clusters.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await runEffect(clustersQueries.restoreCluster(input.id));
      await cacheService.deleteByPrefix(CACHE_KEYS.CLUSTERS_PREFIX);
      return result;
    }),
});
