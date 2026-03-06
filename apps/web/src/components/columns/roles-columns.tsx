import type { ColumnDef } from "@tanstack/react-table";
import type { Roles } from "@tepian-k3/types/platform/roles.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/back-office/roles";
import { createCrudActionCell } from "@/lib/create-crud-action-cell";
import {
  createActionColumn,
  createDateColumn,
  createNumberColumn,
  createTextColumn,
} from "@/lib/column-helpers";

interface RolesColumnsProps {
  currentPage: number;
  perPage: number;
}

const ActionCell = createCrudActionCell<
  Roles,
  (typeof Route)["types"]["searchSchema"]
>({
  resourceName: "role",
  resourcePath: "roles",
  permissionPrefix: "roles",
  deleteMutation: trpc.platform.role.deleteRole,
  restoreMutation: trpc.platform.role.restoreRole,
  getQueryOptions: (params) =>
    trpc.platform.role.getPaginatedRoles.queryOptions(params),
  useSearchParams: () => Route.useSearch(),
  showDetail: true,
});

export default function getRolesColumns({
  currentPage,
  perPage,
}: RolesColumnsProps): ColumnDef<Roles>[] {
  return [
    createNumberColumn<Roles>(currentPage, perPage),
    createTextColumn<Roles>("name", "Nama Role", {
      width: "w-48",
      enableFilter: true,
      placeholder: "Cari nama role...",
    }),
    createTextColumn<Roles>("description", "Deskripsi", {
      width: "w-64",
    }),
    createDateColumn<Roles>("createdAt", "Dibuat"),
    createDateColumn<Roles>("updatedAt", "Diubah", { nullable: true }),
    createActionColumn<Roles>(({ row }) => <ActionCell row={row} />),
  ];
}
