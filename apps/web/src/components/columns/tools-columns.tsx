import type { ColumnDef } from "@tanstack/react-table";
import type { Tools } from "@tepian-k3/types/tools.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/back-office/tools";
import { createCrudActionCell } from "@/lib/create-crud-action-cell";
import {
  createActionColumn,
  createDateColumn,
  createNumberColumn,
  createTextColumn,
} from "@/lib/column-helpers";

interface ToolsColumnsProps {
  currentPage: number;
  perPage: number;
}

const ActionCell = createCrudActionCell<
  Tools,
  (typeof Route)["types"]["searchSchema"]
>({
  resourceName: "tool",
  resourcePath: "tools",
  permissionPrefix: "tools",
  deleteMutation: trpc.tool.deleteTool,
  restoreMutation: trpc.tool.restoreTool,
  getQueryOptions: (params) => trpc.tool.getToolPaginated.queryOptions(params),
  useSearchParams: () => Route.useSearch(),
  showDetail: true,
});

export default function getToolsColumns({
  currentPage,
  perPage,
}: ToolsColumnsProps): ColumnDef<Tools>[] {
  return [
    createNumberColumn<Tools>(currentPage, perPage),
    createTextColumn<Tools>("toolName", "Nama Alat", {
      width: "w-48",
      enableFilter: true,
      placeholder: "Cari nama alat...",
    }),
    createTextColumn<Tools>("toolCode", "Kode Alat", {
      width: "w-64",
    }),
    createDateColumn<Tools>("createdAt", "Dibuat"),
    createDateColumn<Tools>("updatedAt", "Diubah", { nullable: true }),
    createActionColumn<Tools>(({ row }) => <ActionCell row={row} />),
  ];
}
