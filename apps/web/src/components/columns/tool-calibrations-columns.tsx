import type { ColumnDef, Row } from "@tanstack/react-table";
import type { ToolCalibration } from "@tepian-k3/types/tool-calibration.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/back-office/tools/$toolId.calibration.index";
import { createCrudActionCell } from "@/lib/create-crud-action-cell";
import {
  createActionColumn,
  createDateColumn,
  createNumberColumn,
  createTextColumn,
} from "@/lib/column-helpers";

interface ToolCalibrationColumnsProps {
  currentPage: number;
  perPage: number;
}

function ActionCell(row: Row<ToolCalibration>) {
  const { toolId } = Route.useParams();

  const ActionCell = createCrudActionCell<
    ToolCalibration,
    (typeof Route)["types"]["searchSchema"]
  >({
    resourceName: "tool-calibration",
    resourcePath: "tool-calibrations",
    permissionPrefix: "tool-calibrations",
    deleteMutation: trpc.tool.deleteToolCalibration,
    restoreMutation: trpc.tool.restoreToolCalibration,
    getQueryOptions: (params) =>
      trpc.tool.getPaginatedCalibrations.queryOptions({
        toolId,
        ...params,
      }),
    useSearchParams: () => Route.useSearch(),
    showDetail: true,
  });

  return ActionCell({ row });
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
    createDateColumn<ToolCalibration>("calibrationDate", "Tanggal Kalibrasi", {
      format: "EEEE, dd MMMM yyyy",
    }),
    createDateColumn<ToolCalibration>("createdAt", "Dibuat"),
    createDateColumn<ToolCalibration>("updatedAt", "Diubah", {
      nullable: true,
    }),
    createActionColumn<ToolCalibration>(({ row }) => ActionCell(row)),
  ];
}
