import type { ColumnDef, Row } from "@tanstack/react-table";
import type { ToolCheck } from "@tepian-k3/types/pengujian/tool-check.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/back-office/tools/$toolId.status.index";
import type { CrudActionCellConfig } from "@/components/crud-row-actions";
import {
  createDateColumn,
  createNumberColumn,
  createStatusColumn,
} from "@/lib/column-helpers";
import {
  TOOLS_CONDITIONS,
  TOOLS_CONDITIONS_COLORS,
} from "@tepian-k3/constants";
import { ToolCheckModal } from "@/components/modals/tool-check-modal";

interface ToolCheckColumnsProps {
  currentPage: number;
  perPage: number;
}

export function getToolCheckActionConfig(toolId: string): CrudActionCellConfig<
  ToolCheck,
  (typeof Route)["types"]["searchSchema"]
> {
  return {
    resourceName: "status alat",
    resourcePath: "tool-checks",
    permissionPrefix: "tool-checks",
    deleteMutation: trpc.pengujian.tool.deleteToolCheck,
    restoreMutation: trpc.pengujian.tool.restoreToolCheck,
    hardDeleteMutation: trpc.pengujian.tool.hardDeleteToolCheck,
    getQueryOptions: (params) =>
      trpc.pengujian.tool.getPaginatedChecks.queryOptions({
        toolId,
        ...params,
      }),
    useSearchParams: () => Route.useSearch(),
    editModal: ToolCheckModal,
  };
}

export default function getToolCheckColumns({
  currentPage,
  perPage,
}: ToolCheckColumnsProps): ColumnDef<ToolCheck>[] {
  return [
    createNumberColumn<ToolCheck>(currentPage, perPage),
    createStatusColumn<ToolCheck>("checkAlatMenyala", "Alat Menyala", {
      width: "w-48",
      statusMap: {
        true: { text: "Ya", customColors: "bg-green-100 text-green-800" },
        false: { text: "Tidak", customColors: "bg-red-100 text-red-800" },
      },
    }),
    createStatusColumn<ToolCheck>("checkPenyimpangan", "Penyimpangan", {
      width: "w-48",
      statusMap: {
        true: { text: "Ya", customColors: "bg-green-100 text-green-800" },
        false: { text: "Tidak", customColors: "bg-red-100 text-red-800" },
      },
    }),
    createStatusColumn<ToolCheck>("checkKelengkapanAlat", "Kelengkapan Alat", {
      width: "w-48",
      statusMap: {
        true: { text: "Ya", customColors: "bg-green-100 text-green-800" },
        false: { text: "Tidak", customColors: "bg-red-100 text-red-800" },
      },
    }),
    createStatusColumn<ToolCheck>(
      "checkKondisiFisikAlat",
      "Kondisi Fisik Alat",
      {
        width: "w-48",
        statusMap: {
          true: { text: "Ya", customColors: "bg-green-100 text-green-800" },
          false: {
            text: "Tidak",
            customColors: "bg-red-100 text-red-800",
          },
        },
      },
    ),
    createStatusColumn<ToolCheck>(
      "checkConditionResult",
      "Kondisi Fisik Alat",
      {
        width: "w-48",
        statusMap: TOOLS_CONDITIONS.map((condition) => ({
          text: condition,
          customColors: TOOLS_CONDITIONS_COLORS[condition],
        })).reduce(
          (acc, curr) => {
            acc[curr.text] = {
              text: curr.text,
              customColors: curr.customColors,
            };
            return acc;
          },
          {} as Record<string, { text: string; customColors: string }>,
        ),
      },
    ),
    createDateColumn<ToolCheck>("createdAt", "Dibuat"),
    createDateColumn<ToolCheck>("updatedAt", "Diubah", {
      nullable: true,
    }),
  ];
}
