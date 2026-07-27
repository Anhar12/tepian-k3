import type { ColumnDef, Row } from "@tanstack/react-table";
import type { ToolCalibration } from "@tepian-k3/types/pengujian/tool-calibration.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/back-office/tools/$toolId.calibration.index";
import type { CrudActionCellConfig } from "@/components/crud-row-actions";
import {
  createNumberColumn,
  createTextColumn,
} from "@/lib/column-helpers";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { format } from "date-fns";
import { ToolCalibrationModal } from "@/components/modals/tool-calibration-modal";

interface ToolCalibrationColumnsProps {
  currentPage: number;
  perPage: number;
}

export function getToolCalibrationActionConfig(toolId: string): CrudActionCellConfig<
  ToolCalibration,
  (typeof Route)["types"]["searchSchema"]
> {
  return {
    resourceName: "kalibrasi alat",
    resourcePath: "tool-calibrations",
    permissionPrefix: "tool-calibrations",
    deleteMutation: trpc.pengujian.tool.deleteToolCalibration,
    restoreMutation: trpc.pengujian.tool.restoreToolCalibration,
    hardDeleteMutation: trpc.pengujian.tool.hardDeleteToolCalibration,
    getQueryOptions: (params) =>
      trpc.pengujian.tool.getPaginatedCalibrations.queryOptions({
        toolId,
        ...params,
      }),
    useSearchParams: () => Route.useSearch(),
    showDetail: true,
    editModal: ToolCalibrationModal,
  };
}

export default function getToolCalibrationColumns({
  currentPage,
  perPage,
}: ToolCalibrationColumnsProps): ColumnDef<ToolCalibration>[] {
  return [
    createNumberColumn<ToolCalibration>(currentPage, perPage),
    createTextColumn<ToolCalibration>("note", "Catatan", {
      width: "w-48",
      enableFilter: true,
      placeholder: "Cari catatan...",
    }),
    {
      id: "calibrationDate",
      accessorKey: "calibrationDate",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Tanggal Kalibrasi"
          label="Tanggal Kalibrasi"
        />
      ),
      cell: ({ row }) => {
        const calDate = row.original.calibrationDate;
        const createdDate = row.original.createdAt;
        return (
          <div className="flex flex-col min-w-0 w-48">
            <span className="font-medium truncate text-sm">
              {calDate ? format(new Date(calDate), "EEEE, dd MMMM yyyy") : "-"}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              Dibuat: {createdDate ? format(new Date(createdDate), "dd MMM yy") : "-"}
            </span>
          </div>
        );
      },
      meta: { label: "Tanggal Kalibrasi" },
    },
  ];
}
