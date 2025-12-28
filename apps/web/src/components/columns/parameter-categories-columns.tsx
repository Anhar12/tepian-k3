import type { ColumnDef } from "@tanstack/react-table";
import type { ParameterCategories } from "@tepian-k3/types/parameter-categories.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/dashboard/parameter-categories";
import {
  createNumberColumn,
  createTextColumn,
  createDateColumn,
  createActionColumn,
} from "@/lib/column-helpers";
import { createCrudActionCell } from "@/lib/create-crud-action-cell";

interface ParameterCategoriesColumnsProps {
  currentPage: number;
  perPage: number;
}

const ActionCell = createCrudActionCell<
  ParameterCategories,
  ReturnType<typeof Route.useSearch>
>({
  resourceName: "parameter-category",
  resourcePath: "parameter-categories",
  permissionPrefix: "parameter-categories",
  deleteMutation: trpc.parameterCategories.deleteParameterCategory,
  restoreMutation: trpc.parameterCategories.restoreParameterCategory,
  getQueryOptions: (params) =>
    trpc.parameterCategories.getPaginatedParameterCategories.queryOptions(
      params,
    ),
  useSearchParams: () => Route.useSearch(),
});

export default function getParameterCategoriesColumns({
  currentPage,
  perPage,
}: ParameterCategoriesColumnsProps): ColumnDef<ParameterCategories>[] {
  return [
    createNumberColumn<ParameterCategories>(currentPage, perPage),
    createTextColumn<ParameterCategories>("name", "Nama Kategori Parameter", {
      width: "w-48",
      enableFilter: true,
      placeholder: "Cari nama kategori parameter...",
    }),
    createTextColumn<ParameterCategories>("description", "Deskripsi", {
      width: "w-64",
    }),
    createDateColumn<ParameterCategories>("createdAt", "Dibuat"),
    createDateColumn<ParameterCategories>("updatedAt", "Diubah", {
      nullable: true,
    }),
    createActionColumn<ParameterCategories>(({ row }) => (
      <ActionCell row={row} />
    )),
  ];
}
