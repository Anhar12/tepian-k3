import getPaginatedParametersColumns, { parameterActionConfig } from "@/components/columns/parameters-columns";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SoftDeleteToggle } from "@/components/soft-delete-toggle";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import parameterSchema from "@tepian-k3/schema/pengujian/parameter.schema";
import { PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useDataTableRouter } from "@/hooks/use-data-table-router";
import { useCrudRowActions, CrudRowActionsModal } from "@/components/crud-row-actions";
import type { PaginatedParameters } from "@tepian-k3/types/pengujian/parameters.types";

export const Route = createFileRoute("/(core)/back-office/parameters/")({
  validateSearch: parameterSchema.getAllParametersSchema,
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: "parameters.view",
    }),
  component: RouteComponent,
  head: () => pageHead("Manajemen Parameter"),
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    data: parameters,
    isLoading,
    error,
  } = useQuery(
    trpc.pengujian.parameter.getPaginatedParameters.queryOptions(params),
  );

  const [showDeleted, setShowDeleted] = useState(params.showDeleted);
  
  const { selectedRow, isActionsOpen, setIsActionsOpen, handleRowClick } = useCrudRowActions<PaginatedParameters>();

  const columns = useMemo(
    () =>
      getPaginatedParametersColumns({
        currentPage: params.page,
        perPage: params.perPage,
      }),
    [params.page, params.perPage],
  );

  const { table } = useDataTableRouter({
    data: (parameters?.data ?? []) as PaginatedParameters[],
    columns,
    pageCount: parameters?.pageCount ?? 0,
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
        <div className="flex flex-row gap-2 items-center">
          <SoftDeleteToggle
            checked={showDeleted ?? false}
            onCheckedChange={(checked) => {
              navigate({
                to: "/back-office/parameters",
                search: {
                  ...params,
                  showDeleted: Boolean(checked),
                },
              });
              setShowDeleted(Boolean(checked));
            }}
          />
        </div>
        <PermissionGate permission="parameters.create">
          <Button
            onClick={() => navigate({ to: "/back-office/parameters/create" })}
          >
            <PlusCircle className="size-4" />
            Tambah Parameter
          </Button>
        </PermissionGate>
      </div>
      <DataTable
        table={table}
        isLoading={isLoading}
        error={error}
        emptyMessage="Tidak ada parameter yang ditemukan"
        emptyDescription="Coba sesuaikan filter atau kata kunci pencarian Anda."
        onRowClick={handleRowClick}
      >
        <DataTableToolbar table={table}>
          <DataTableFilterMenu table={table} />
          <DataTableSortList table={table} />
        </DataTableToolbar>
      </DataTable>
      
      <CrudRowActionsModal
        config={parameterActionConfig}
        row={selectedRow}
        open={isActionsOpen}
        onOpenChange={setIsActionsOpen}
      />
    </div>
  );
}
