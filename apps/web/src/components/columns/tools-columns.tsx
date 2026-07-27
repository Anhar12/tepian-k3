import type { ColumnDef } from "@tanstack/react-table";
import type { Tools } from "@tepian-k3/types/pengujian/tools.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/back-office/tools";
import type { CrudActionCellConfig } from "@/components/crud-row-actions";
import { ToolModal } from "@/components/modals/tool-modal";
import {
  createCompactDateColumn,
  createNumberColumn,
  createMergedTextColumn,
  createTextColumn,
} from "@/lib/column-helpers";

interface ToolsColumnsProps {
  currentPage: number;
  perPage: number;
}

export const toolActionConfig: CrudActionCellConfig<
  Tools,
  (typeof Route)["types"]["searchSchema"]
> = {
  resourceName: "alat",
  resourcePath: "tools",
  permissionPrefix: "tools",
  deleteMutation: trpc.pengujian.tool.deleteTool,
  restoreMutation: trpc.pengujian.tool.restoreTool,
  hardDeleteMutation: trpc.pengujian.tool.hardDeleteTool,
  getQueryOptions: (params) =>
    trpc.pengujian.tool.getToolPaginated.queryOptions(params),
  useSearchParams: () => Route.useSearch(),
  showDetail: true,
  editModal: ToolModal,
};

export default function getToolsColumns({
  currentPage,
  perPage,
}: ToolsColumnsProps): ColumnDef<Tools>[] {
  return [
    createNumberColumn<Tools>(currentPage, perPage),
    createMergedTextColumn<Tools>("toolName", "Nama Alat", {
      width: "w-64",
      enableFilter: true,
      placeholder: "Cari nama alat...",
      secondaryId: "toolCode.code",
    }),
    createTextColumn<Tools>("toolUniqueCode", "Kode Unik", {
      width: "w-64",
    }),
    createCompactDateColumn<Tools>("createdAt", "Dibuat"),
  ];
}
