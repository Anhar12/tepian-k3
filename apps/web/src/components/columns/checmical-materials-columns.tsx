import type { ColumnDef } from "@tanstack/react-table";
import type { ChemicalMaterial } from "@tepian-k3/types/chemical-material.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/back-office/chemical-materials";
import {
  createNumberColumn,
  createTextColumn,
  createDateColumn,
  createActionColumn,
} from "@/lib/column-helpers";
import { createCrudActionCell } from "@/lib/create-crud-action-cell";

interface ChemicalMaterialsColumnsProps {
  currentPage: number;
  perPage: number;
}

const ActionCell = createCrudActionCell<
  ChemicalMaterial,
  (typeof Route)["types"]["searchSchema"]
>({
  resourceName: "chemical-material",
  resourcePath: "chemical-materials",
  permissionPrefix: "chemical-materials",
  deleteMutation: trpc.chemicalMaterial.delete,
  restoreMutation: trpc.chemicalMaterial.restore,
  getQueryOptions: (params) =>
    trpc.chemicalMaterial.getPaginated.queryOptions(params),
  useSearchParams: () => Route.useSearch(),
});

export default function getChemicalMaterialsColumns({
  currentPage,
  perPage,
}: ChemicalMaterialsColumnsProps): ColumnDef<ChemicalMaterial>[] {
  return [
    createNumberColumn<ChemicalMaterial>(currentPage, perPage),
    createTextColumn<ChemicalMaterial>("name", "Nama", {
      width: "w-32",
    }),
    createTextColumn<ChemicalMaterial>("code", "Kode", {
      width: "w-24",
    }),
    createDateColumn<ChemicalMaterial>("expiredDate", "Tanggal Kadaluarsa", {
      nullable: true,
    }),
    createDateColumn<ChemicalMaterial>("createdAt", "Dibuat"),
    createDateColumn<ChemicalMaterial>("updatedAt", "Diubah", {
      nullable: true,
    }),
    createActionColumn<ChemicalMaterial>(({ row }) => <ActionCell row={row} />),
  ];
}
