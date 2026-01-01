import type { ColumnDef } from "@tanstack/react-table";
import type { KBLI } from "@tepian-k3/types/kbli.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/back-office/kblis";
import {
  createNumberColumn,
  createTextColumn,
  createDateColumn,
  createActionColumn,
} from "@/lib/column-helpers";
import { createCrudActionCell } from "@/lib/create-crud-action-cell";

interface KBLIColumnsProps {
  currentPage: number;
  perPage: number;
}

const ActionCell = createCrudActionCell<
  KBLI,
  (typeof Route)["types"]["searchSchema"]
>({
  resourceName: "kbli",
  resourcePath: "kblis",
  permissionPrefix: "kbli",
  deleteMutation: trpc.kbli.deleteKbli,
  restoreMutation: trpc.kbli.restoreKbli,
  getQueryOptions: (params) => trpc.kbli.getPaginatedKblis.queryOptions(params),
  useSearchParams: () => Route.useSearch(),
});

export default function getKBLIColumns({
  currentPage,
  perPage,
}: KBLIColumnsProps): ColumnDef<KBLI>[] {
  return [
    createNumberColumn<KBLI>(currentPage, perPage),
    createTextColumn<KBLI>("name", "Nama KBLI", {
      width: "w-48",
      enableFilter: true,
      placeholder: "Cari nama kbli...",
    }),
    createDateColumn<KBLI>("createdAt", "Dibuat"),
    createDateColumn<KBLI>("updatedAt", "Diubah", { nullable: true }),
    createActionColumn<KBLI>(({ row }) => <ActionCell row={row} />),
  ];
}
