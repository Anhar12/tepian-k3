import type { ColumnDef } from "@tanstack/react-table";
import type { Positions } from "@tepian-k3/types/platform/position.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/back-office/positions";
import {
  createNumberColumn,
  createTextColumn,
  createDateColumn,
  createActionColumn,
} from "@/lib/column-helpers";
import { createCrudActionCell } from "@/lib/create-crud-action-cell";

interface PositionsColumnsProps {
  currentPage: number;
  perPage: number;
}

const ActionCell = createCrudActionCell<
  Positions,
  (typeof Route)["types"]["searchSchema"]
>({
  resourceName: "position",
  resourcePath: "positions",
  permissionPrefix: "positions",
  deleteMutation: trpc.platform.position.deletePosition,
  restoreMutation: trpc.platform.position.restorePosition,
  getQueryOptions: (params) =>
    trpc.platform.position.getPositionPaginated.queryOptions(params),
  useSearchParams: () => Route.useSearch(),
});

export default function getPositionsColumns({
  currentPage,
  perPage,
}: PositionsColumnsProps): ColumnDef<Positions>[] {
  return [
    createNumberColumn<Positions>(currentPage, perPage),
    createTextColumn<Positions>("name", "Nama", {
      width: "w-64",
    }),
    createTextColumn<Positions>("description", "Deskripsi", {
      width: "w-64",
    }),
    createDateColumn<Positions>("createdAt", "Dibuat"),
    createDateColumn<Positions>("updatedAt", "Diubah", {
      nullable: true,
    }),
    createActionColumn<Positions>(({ row }) => <ActionCell row={row} />),
  ];
}
