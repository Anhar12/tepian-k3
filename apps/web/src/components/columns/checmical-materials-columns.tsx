import type { ColumnDef } from "@tanstack/react-table";
import type { ChemicalMaterial } from "@tepian-k3/types/pengujian/chemical-material.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/back-office/chemical-materials";
import type { CrudActionCellConfig } from "@/components/crud-row-actions";
import {
  createNumberColumn,
  createTextColumn,
  createDateColumn,
} from "@/lib/column-helpers";
import { ChemicalMaterialModal } from "@/components/modals/chemical-material-modal";

interface ChemicalMaterialsColumnsProps {
  currentPage: number;
  perPage: number;
}

export const chemicalMaterialActionConfig: CrudActionCellConfig<
  ChemicalMaterial,
  (typeof Route)["types"]["searchSchema"]
> = {
  resourceName: "bahan kimia",
  resourcePath: "chemical-materials",
  permissionPrefix: "chemical-materials",
  deleteMutation: trpc.pengujian.chemicalMaterial.delete,
  restoreMutation: trpc.pengujian.chemicalMaterial.restore,
  hardDeleteMutation: trpc.pengujian.chemicalMaterial.hardDelete,
  getQueryOptions: (params) =>
    trpc.pengujian.chemicalMaterial.getPaginated.queryOptions(params),
  useSearchParams: () => Route.useSearch(),
  editModal: ChemicalMaterialModal,
};

export default function getChemicalMaterialsColumns({
  currentPage,
  perPage,
}: ChemicalMaterialsColumnsProps): ColumnDef<ChemicalMaterial>[] {
  return [
    createNumberColumn<ChemicalMaterial>(currentPage, perPage),
    createTextColumn<ChemicalMaterial>("name", "Nama", {
      width: "w-32",
      enableFilter: true,
    }),
    createTextColumn<ChemicalMaterial>("code", "Kode", {
      width: "w-24",
      enableFilter: true,
    }),
    {
      id: "stock",
      header: "Stok Fisik",
      cell: ({ row }) => {
        const usedStock = row.original.usedStock ?? 0;
        const sealedStock = row.original.sealedStock ?? 0;
        const totalFisik = usedStock + sealedStock;
        return <span>{totalFisik}</span>;
      },
    },
    {
      id: "booked",
      header: "Di-booking",
      cell: ({ row }) => {
        const pendingStock = row.original.pendingStock ?? 0;
        return <span>{pendingStock}</span>;
      },
    },
    {
      id: "available",
      header: "Sisa Tersedia",
      cell: ({ row }) => {
        const usedStock = row.original.usedStock ?? 0;
        const sealedStock = row.original.sealedStock ?? 0;
        const pendingStock = row.original.pendingStock ?? 0;
        const available = usedStock + sealedStock - pendingStock;
        const monthlyUsage = row.original.monthlyUsage ?? 0;
        
        let textColor = "text-emerald-600";
        if (available <= 0) {
          textColor = "text-red-600";
        } else if (monthlyUsage > 0 && available <= monthlyUsage) {
          textColor = "text-amber-600";
        }

        return <span className={`font-semibold ${textColor}`}>{available}</span>;
      },
    },
    createDateColumn<ChemicalMaterial>("expiredDate", "Tanggal Kadaluarsa", {
      nullable: true,
    }),
  ];
}
