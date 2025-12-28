import type { ColumnDef, Row } from "@tanstack/react-table";
import type { Roles } from "@tepian-k3/types/roles.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/dashboard/roles";
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
  ReturnType<typeof Route.useSearch>
>({
  resourceName: "role",
  resourcePath: "roles",
  permissionPrefix: "roles",
  deleteMutation: trpc.role.deleteRole,
  restoreMutation: trpc.role.restoreRole,
  getQueryOptions: (params) => trpc.role.getPaginatedRoles.queryOptions(params),
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
