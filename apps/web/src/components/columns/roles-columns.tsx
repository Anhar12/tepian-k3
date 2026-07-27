import type { ColumnDef } from "@tanstack/react-table";
import type { Roles } from "@tepian-k3/types/platform/roles.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/back-office/roles";
import {
  createDateColumn,
  createNumberColumn,
  createTextColumn,
} from "@/lib/column-helpers";
import type { CrudActionCellConfig } from "@/components/crud-row-actions";

interface RolesColumnsProps {
  currentPage: number;
  perPage: number;
}

export const roleActionConfig: CrudActionCellConfig<
  Roles,
  (typeof Route)["types"]["searchSchema"]
> = {
  resourceName: "peran",
  resourcePath: "roles",
  permissionPrefix: "roles",
  deleteMutation: trpc.platform.role.deleteRole,
  restoreMutation: trpc.platform.role.restoreRole,
  getQueryOptions: (params) =>
    trpc.platform.role.getPaginatedRoles.queryOptions(params),
  useSearchParams: () => Route.useSearch(),
  showDetail: true,
};

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
  ];
}
