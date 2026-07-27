import getRolesColumns, { roleActionConfig } from "@/components/columns/roles-columns";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { SoftDeleteToggle } from "@/components/soft-delete-toggle";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import rolesSchema from "@tepian-k3/schema/platform/role.schema";
import { useMemo, useState } from "react";
import { useDataTableRouter } from "@/hooks/use-data-table-router";
import { CrudRowActionsModal, useCrudRowActions } from "@/components/crud-row-actions";
import type { Roles } from "@tepian-k3/types/platform/roles.types";

export const Route = createFileRoute("/(core)/back-office/roles/")({
  validateSearch: rolesSchema.getAllRolesSchema,
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "roles.view" }),
  component: RouteComponent,
  head: () => pageHead("Manajemen Peran"),
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    data: roles,
    isLoading,
    error,
  } = useQuery(trpc.platform.role.getPaginatedRoles.queryOptions(params));

  const [showDeleted, setShowDeleted] = useState(params.showDeleted);
  const { selectedRow, isActionsOpen, setIsActionsOpen, handleRowClick } = useCrudRowActions<Roles>();

  const columns = useMemo(
    () =>
      getRolesColumns({
        currentPage: params.page,
        perPage: params.perPage,
      }),
    [params.page, params.perPage],
  );

  const { table } = useDataTableRouter({
    data: roles?.data ?? [],
    columns,
    pageCount: roles?.pageCount ?? 0,
    search: params,
    navigate: ({ search: updater }) => {
      navigate({ search: updater });
    },
    initialState: {
      sorting: [{ id: "createdAt", desc: false }],
    },
    getRowId: (row) => row.id,
  });

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex items-center justify-between gap-4">
        <SoftDeleteToggle
          checked={showDeleted ?? false}
          onCheckedChange={(checked) => {
            navigate({
              to: "/back-office/roles",
              search: {
                ...params,
                showDeleted: checked,
              },
            });
            setShowDeleted(checked);
          }}
        />
      </div>
      <DataTable
        table={table}
        isLoading={isLoading}
        error={error}
        emptyMessage="Tidak ada role yang ditemukan."
        emptyDescription="Coba sesuaikan filter atau tambahkan role baru."
        onRowClick={handleRowClick}
      >
        <DataTableToolbar table={table}>
          <DataTableFilterMenu table={table} />
          <DataTableSortList table={table} />
        </DataTableToolbar>
      </DataTable>

      <CrudRowActionsModal
        config={roleActionConfig}
        row={selectedRow}
        open={isActionsOpen}
        onOpenChange={setIsActionsOpen}
      />
    </div>
  );
}
