import type { ColumnDef } from "@tanstack/react-table";
import type { UsersWithoutFoto } from "@tepian-k3/types/users.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/dashboard/users";
import { createCrudActionCell } from "@/lib/create-crud-action-cell";
import {
  createActionColumn,
  createDateColumn,
  createNumberColumn,
  createTextColumn,
} from "@/lib/column-helpers";

interface UsersColumnsProps {
  currentPage: number;
  perPage: number;
}

const ActionCell = createCrudActionCell<
  UsersWithoutFoto,
  (typeof Route)["types"]["searchSchema"]
>({
  resourceName: "user",
  resourcePath: "users",
  permissionPrefix: "users",
  deleteMutation: trpc.user.deleteUser,
  restoreMutation: trpc.user.restoreUser,
  getQueryOptions: (params) => trpc.user.getUserPaginated.queryOptions(params),
  useSearchParams: () => Route.useSearch(),
});

export default function getUsersColumns({
  currentPage,
  perPage,
}: UsersColumnsProps): ColumnDef<UsersWithoutFoto>[] {
  return [
    createNumberColumn<UsersWithoutFoto>(currentPage, perPage),
    createTextColumn<UsersWithoutFoto>("name", "Nama User", {
      width: "w-48",
      enableFilter: true,
      placeholder: "Cari nama user...",
    }),
    createTextColumn<UsersWithoutFoto>("email", "Email", {
      width: "w-64",
    }),
    createDateColumn<UsersWithoutFoto>("createdAt", "Dibuat"),
    createDateColumn<UsersWithoutFoto>("updatedAt", "Diubah", {
      nullable: true,
    }),
    createActionColumn<UsersWithoutFoto>(({ row }) => <ActionCell row={row} />),
  ];
}
