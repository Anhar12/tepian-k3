import type { ColumnDef } from "@tanstack/react-table";
import type { PaginatedParameters } from "@tepian-k3/types/parameters.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/back-office/parameters";
import {
  createNumberColumn,
  createTextColumn,
  createDateColumn,
  createActionColumn,
  createPriceColumn,
} from "@/lib/column-helpers";
import { createCrudActionCell } from "@/lib/create-crud-action-cell";

interface PaginatedParametersColumnsProps {
  currentPage: number;
  perPage: number;
}

const ActionCell = createCrudActionCell<
  PaginatedParameters,
  (typeof Route)["types"]["searchSchema"]
>({
  resourceName: "cluster",
  resourcePath: "parameters",
  permissionPrefix: "parameters",
  deleteMutation: trpc.parameter.deleteParameter,
  restoreMutation: trpc.parameter.restoreParameter,
  getQueryOptions: (params) =>
    trpc.parameter.getPaginatedParameters.queryOptions(params),
  useSearchParams: () => Route.useSearch(),
  showDetail: true,
});

export default function getPaginatedParametersColumns({
  currentPage,
  perPage,
}: PaginatedParametersColumnsProps): ColumnDef<PaginatedParameters>[] {
  return [
    createNumberColumn<PaginatedParameters>(currentPage, perPage),
    createTextColumn<PaginatedParameters>("category.name", "Kategori", {
      width: "w-64",
    }),
    createTextColumn<PaginatedParameters>("name", "Nama Parameter", {
      width: "w-48",
      enableFilter: true,
      placeholder: "Cari nama parameter...",
    }),
    createTextColumn<PaginatedParameters>("unit", "Satuan", {
      width: "w-32",
    }),
    createPriceColumn<PaginatedParameters>("price", "Harga", {
      width: "w-32",
    }),
    createDateColumn<PaginatedParameters>("createdAt", "Dibuat"),
    createDateColumn<PaginatedParameters>("updatedAt", "Diubah", {
      nullable: true,
    }),
    createActionColumn<PaginatedParameters>(({ row }) => (
      <ActionCell row={row} />
    )),
  ];
}
