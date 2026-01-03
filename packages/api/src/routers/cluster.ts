import clusterSchema from "@tepian-k3/schema/cluster.schema";
import { createTRPCRouter, publicProcedure, withPermission } from "..";
import clustersQueries from "@tepian-k3/queries/clusters.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { runEffect } from "../utils/run-effect";

export const clusterRouter = createTRPCRouter({
  getAllClusters: publicProcedure.query(
    async () => await runEffect(clustersQueries.getAllClusters())
  ),

  getPaginatedClusters: withPermission("clusters.read")
    .input(clusterSchema.getAllClustersSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        clustersQueries.getOffsetPaginatedClusters(input)
      );

      return { data, pageCount };
    }),

  getClusterById: withPermission("clusters.read")
    .input(
      z.object({
        id: z.uuidv7(),
      })
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
      async ({ input }) => await runEffect(clustersQueries.createCluster(input))
    ),

  updateCluster: withPermission("clusters.update")
    .input(clusterSchema.updateClusterSchema)
    .mutation(
      async ({ input }) => await runEffect(clustersQueries.updateCluster(input))
    ),

  deleteCluster: withPermission("clusters.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await runEffect(clustersQueries.deleteCluster(input.id))
    ),

  restoreCluster: withPermission("clusters.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await runEffect(clustersQueries.restoreCluster(input.id))
    ),
});
