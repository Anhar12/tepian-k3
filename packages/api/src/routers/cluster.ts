import clusterSchema from "@tepian-k3/schema/cluster.schema";
import { createTRPCRouter, withPermission } from "..";
import { Effect } from "effect";
import clustersQueries from "@tepian-k3/queries/clusters.queries";
import z from "zod";

export const clusterRouter = createTRPCRouter({
  getPaginatedClusters: withPermission("clusters.read")
    .input(clusterSchema.getAllClustersSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await Effect.runPromise(
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
    .query(
      async ({ input }) =>
        await Effect.runPromise(clustersQueries.getClusterById(input.id))
    ),

  createCluster: withPermission("clusters.create")
    .input(clusterSchema.createClusterSchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(clustersQueries.createCluster(input))
    ),

  updateCluster: withPermission("clusters.update")
    .input(clusterSchema.updateClusterSchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(clustersQueries.updateCluster(input))
    ),

  deleteCluster: withPermission("clusters.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(clustersQueries.deleteCluster(input.id))
    ),

  restoreCluster: withPermission("clusters.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(clustersQueries.restoreCluster(input.id))
    ),
});
