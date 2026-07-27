import type { ColumnDef } from "@tanstack/react-table";
import type { PaginatedParameters } from "@tepian-k3/types/pengujian/parameters.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/back-office/parameters";
import {
  createCompactDateColumn,
  createNumberColumn,
  createMergedTextColumn,
  createTextColumn,
  createPriceColumn,
  createStatusColumn,
} from "@/lib/column-helpers";
import {
  PARAMETER_SERVICE_TYPE_LABELS,
  PARAMETER_SERVICE_TYPE_COLORS,
} from "@tepian-k3/constants";
import type { CrudActionCellConfig } from "@/components/crud-row-actions";
import { ParameterModal } from "@/components/modals/parameter-modal";

interface PaginatedParametersColumnsProps {
  currentPage: number;
  perPage: number;
}

export const parameterActionConfig: CrudActionCellConfig<
  PaginatedParameters,
  (typeof Route)["types"]["searchSchema"]
> = {
  resourceName: "parameter",
  resourcePath: "parameters",
  permissionPrefix: "parameters",
  deleteMutation: trpc.pengujian.parameter.deleteParameter,
  restoreMutation: trpc.pengujian.parameter.restoreParameter,
  hardDeleteMutation: trpc.pengujian.parameter.hardDeleteParameter,
  getQueryOptions: (params) =>
    trpc.pengujian.parameter.getPaginatedParameters.queryOptions(params),
  useSearchParams: () => Route.useSearch(),
  showDetail: true,
  editModal: ParameterModal,
};

export default function getPaginatedParametersColumns({
  currentPage,
  perPage,
}: PaginatedParametersColumnsProps): ColumnDef<PaginatedParameters>[] {
  return [
    createNumberColumn<PaginatedParameters>(currentPage, perPage),
    createMergedTextColumn<PaginatedParameters>("name", "Nama Parameter", {
      width: "w-64",
      enableFilter: true,
      placeholder: "Cari nama parameter...",
      secondaryId: "category.name",
    }),
    createTextColumn<PaginatedParameters>("unit", "Satuan", {
      width: "w-32",
    }),
    createPriceColumn<PaginatedParameters>("price", "Harga", {
      width: "w-32",
    }),
    createStatusColumn<PaginatedParameters>("serviceType", "Layanan", {
      width: "w-32",
      enableFilter: true,
      variant: "select",
      statusMap: {
        utama: {
          text: PARAMETER_SERVICE_TYPE_LABELS.utama,
          customColors: PARAMETER_SERVICE_TYPE_COLORS.utama,
        },
        tambahan: {
          text: PARAMETER_SERVICE_TYPE_LABELS.tambahan,
          customColors: PARAMETER_SERVICE_TYPE_COLORS.tambahan,
        },
      },
    }),
    createCompactDateColumn<PaginatedParameters>("createdAt", "Dibuat"),
  ];
}
