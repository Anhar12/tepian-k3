import {
  createActionColumn,
  createDateColumn,
  createNumberColumn,
  createStatusColumn,
  createTextColumn,
} from "@/lib/column-helpers";
import { createCrudActionCell } from "@/lib/create-crud-action-cell";
import { Route } from "@/routes/(core)/back-office/tool-codes";
import { trpc } from "@/utils/trpc";
import type { ColumnDef } from "@tanstack/react-table";
import type { ToolCodes } from "@tepian-k3/types/pengujian/tool-codes.types";

interface ToolCodesColumnsProps {
  currentPage: number;
  perPage: number;
}

const ActionCell = createCrudActionCell<
  ToolCodes,
  (typeof Route)["types"]["searchSchema"]
>({
  resourceName: "tool-code",
  resourcePath: "tool-codes",
  permissionPrefix: "tool-codes",
  deleteMutation: trpc.pengujian.toolCode.deleteToolCode,
  restoreMutation: trpc.pengujian.toolCode.restoreToolCode,
  getQueryOptions: (params) =>
    trpc.pengujian.toolCode.getPaginatedToolCodes.queryOptions(params),
  useSearchParams: () => Route.useSearch(),
  showDetail: true,
});

export default function getToolCodesColumns({
  currentPage,
  perPage,
}: ToolCodesColumnsProps): ColumnDef<ToolCodes>[] {
  return [
    createNumberColumn<ToolCodes>(currentPage, perPage),
    createTextColumn<ToolCodes>("code", "Nama Alat", {
      width: "w-48",
      enableFilter: true,
      placeholder: "Cari nama alat...",
    }),
    createTextColumn<ToolCodes>("description", "Deskripsi", {
      width: "w-64",
      nullable: true,
    }),
    createStatusColumn<ToolCodes>("isActive", "Status", {
      width: "w-64",
      statusMap: {
        true: { text: "Aktif", customColors: "bg-green-100 text-green-800" },
        false: { text: "Tidak Aktif", customColors: "bg-red-100 text-red-800" },
      },
    }),
    createDateColumn<ToolCodes>("createdAt", "Dibuat"),
    createDateColumn<ToolCodes>("updatedAt", "Diubah", { nullable: true }),
    createActionColumn<ToolCodes>(({ row }) => <ActionCell row={row} />),
  ];
}
