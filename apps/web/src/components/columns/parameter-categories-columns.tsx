import type { ColumnDef } from "@tanstack/react-table";
import type { ParameterCategories } from "@tepian-k3/types/pengujian/parameter-categories.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/back-office/parameter-categories";
import {
  createNumberColumn,
  createTextColumn,
  createDateColumn,
} from "@/lib/column-helpers";
import type { CrudActionCellConfig } from "@/components/crud-row-actions";
import { ParameterCategoryModal } from "@/components/modals/parameter-category-modal";

interface ParameterCategoriesColumnsProps {
  currentPage: number;
  perPage: number;
}

export const parameterCategoryActionConfig: CrudActionCellConfig<
  ParameterCategories,
  (typeof Route)["types"]["searchSchema"]
> = {
  resourceName: "kategori parameter",
  resourcePath: "parameter-categories",
  permissionPrefix: "parameter-categories",
  deleteMutation: trpc.pengujian.parameterCategories.deleteParameterCategory,
  restoreMutation: trpc.pengujian.parameterCategories.restoreParameterCategory,
  hardDeleteMutation:
    trpc.pengujian.parameterCategories.hardDeleteParameterCategory,
  getQueryOptions: (params) =>
    trpc.pengujian.parameterCategories.getPaginatedParameterCategories.queryOptions(
      params,
    ),
  useSearchParams: () => Route.useSearch(),
  editModal: ParameterCategoryModal,
};

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
  ];
}
