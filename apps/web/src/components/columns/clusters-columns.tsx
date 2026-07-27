import type { ColumnDef } from "@tanstack/react-table";
import type { Clusters } from "@tepian-k3/types/pengujian/clusters.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/back-office/clusters";
import type { CrudActionCellConfig } from "@/components/crud-row-actions";
import {
  createNumberColumn,
  createTextColumn,
  createDateColumn,
} from "@/lib/column-helpers";
import { ClusterModal } from "@/components/modals/cluster-modal";

interface ClustersColumnsProps {
  currentPage: number;
  perPage: number;
}

export const clusterActionConfig: CrudActionCellConfig<
  Clusters,
  (typeof Route)["types"]["searchSchema"]
> = {
  resourceName: "cluster",
  resourcePath: "clusters",
  permissionPrefix: "clusters",
  deleteMutation: trpc.pengujian.cluster.deleteCluster,
  restoreMutation: trpc.pengujian.cluster.restoreCluster,
  hardDeleteMutation: trpc.pengujian.cluster.hardDeleteCluster,
  getQueryOptions: (params) =>
    trpc.pengujian.cluster.getPaginatedClusters.queryOptions(params),
  useSearchParams: () => Route.useSearch(),
  editModal: ClusterModal,
};

export default function getClustersColumns({
  currentPage,
  perPage,
}: ClustersColumnsProps): ColumnDef<Clusters>[] {
  return [
    createNumberColumn<Clusters>(currentPage, perPage),
    createTextColumn<Clusters>("name", "Nama Cluster", {
      width: "w-48",
      enableFilter: true,
      placeholder: "Cari nama cluster...",
    }),
    createTextColumn<Clusters>("description", "Deskripsi", {
      width: "w-64",
    }),
    createDateColumn<Clusters>("createdAt", "Dibuat"),
    createDateColumn<Clusters>("updatedAt", "Diubah", { nullable: true }),
  ];
}
