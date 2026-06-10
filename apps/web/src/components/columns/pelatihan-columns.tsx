import type { ColumnDef } from "@tanstack/react-table";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@tepian-k3/api/root";

type RouterOutput = inferRouterOutputs<AppRouter>;
export type Pelatihan =
  RouterOutput["pelatihan"]["base"]["getAllPelatihan"]["data"][number];
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/back-office/pelatihan/index";
import { createCrudActionCell } from "@/lib/create-crud-action-cell";
import {
  createActionColumn,
  createDateColumn,
  createNumberColumn,
  createTextColumn,
} from "@/lib/column-helpers";

interface PelatihanColumnsProps {
  currentPage: number;
  perPage: number;
}

const ActionCell = createCrudActionCell<
  Pelatihan,
  (typeof Route)["types"]["searchSchema"]
>({
  resourceName: "pelatihan",
  resourcePath: "pelatihan",
  permissionPrefix: "pelatihan",
  deleteMutation: trpc.pelatihan.base.deletePelatihan,
  // We do not have restoreMutation currently, so we can omit or add if it exists
  // restoreMutation: trpc.pelatihan.restorePelatihan,
  getQueryOptions: (params) =>
    trpc.pelatihan.base.getAllPelatihan.queryOptions(params),
  useSearchParams: () => Route.useSearch(),
  showDetail: false,
});

export default function getPelatihanColumns({
  currentPage,
  perPage,
}: PelatihanColumnsProps): ColumnDef<Pelatihan>[] {
  return [
    createNumberColumn<Pelatihan>(currentPage, perPage),
    createTextColumn<Pelatihan>("title", "Judul Pelatihan", {
      width: "w-64",
      enableFilter: true,
      placeholder: "Cari judul...",
    }),
    {
      accessorKey: "type",
      header: "Layanan",
      cell: ({ row }) => {
        const val = row.getValue("type") as string;
        if (val === "elearning") return "E-Learning";
        if (val === "bimtek") return "Bimtek";
        if (val === "webinar") return "Webinar";
        return val ?? "E-Learning";
      },
    },
    {
      accessorKey: "price",
      header: "Harga",
      cell: ({ row }) => {
        const price = row.getValue("price") as number;
        return (
          <span>
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(price)}
          </span>
        );
      },
    },
    createTextColumn<Pelatihan>("level", "Level", {
      width: "w-32",
    }),
    createTextColumn<Pelatihan>("duration", "Durasi (Hari)", {
      width: "w-32",
    }),
    createTextColumn<Pelatihan>("status", "Status", {
      width: "w-32",
    }),
    createDateColumn<Pelatihan>("createdAt", "Dibuat"),
    createActionColumn<Pelatihan>(({ row }) => <ActionCell row={row} />),
  ];
}
