import type { ColumnDef } from "@tanstack/react-table";
import type { Clusters } from "@tepian-k3/types/clusters.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/dashboard/clusters";
import {
  createNumberColumn,
  createTextColumn,
  createDateColumn,
  createActionColumn,
} from "@/lib/column-helpers";
import { createCrudActionCell } from "@/lib/create-crud-action-cell";

interface ClustersColumnsProps {
  currentPage: number;
  perPage: number;
}

const ActionCell = createCrudActionCell<
  Clusters,
  ReturnType<typeof Route.useSearch>
>({
  resourceName: "cluster",
  resourcePath: "clusters",
  permissionPrefix: "clusters",
  deleteMutation: trpc.cluster.deleteCluster,
  restoreMutation: trpc.cluster.restoreCluster,
  getQueryOptions: (params) =>
    trpc.cluster.getPaginatedClusters.queryOptions(params),
  useSearchParams: () => Route.useSearch(),
});

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
    createActionColumn<Clusters>(({ row }) => <ActionCell row={row} />),
  ];
}
