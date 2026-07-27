import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { PermissionGate } from "@/components/permission-gate";
import getToolsColumns, { toolActionConfig } from "@/components/columns/tools-columns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SoftDeleteToggle } from "@/components/soft-delete-toggle";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import toolsSchema from "@tepian-k3/schema/pengujian/tools.schema";
import { PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useDataTableRouter } from "@/hooks/use-data-table-router";
import type { Tools } from "@tepian-k3/types/pengujian/tools.types";
import { useCrudRowActions, CrudRowActionsModal } from "@/components/crud-row-actions";

export const Route = createFileRoute("/(core)/back-office/tools/")({
  validateSearch: toolsSchema.getAllToolsSchema,
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "tools.view" }),
  component: RouteComponent,
  head: () => pageHead("Manajemen Alat"),
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    data: tools,
    isLoading,
    error,
  } = useQuery(trpc.pengujian.tool.getToolPaginated.queryOptions(params));

  const [showDeleted, setShowDeleted] = useState(params.showDeleted);
  
  const { selectedRow, isActionsOpen, setIsActionsOpen, handleRowClick } = useCrudRowActions<Tools>();

  const columns = useMemo(
    () =>
      getToolsColumns({
        currentPage: params.page,
        perPage: params.perPage,
      }),
    [params.page, params.perPage],
  );

  const { table } = useDataTableRouter({
    data: (tools?.data ?? []) as Tools[],
    columns,
    pageCount: tools?.pageCount ?? 0,
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
                to: "/back-office/tools",
                search: {
                  ...params,
                  showDeleted: Boolean(checked),
                },
              });
              setShowDeleted(Boolean(checked));
            }}
          />
        </div>
        <PermissionGate permission="tools.create">
          <Button onClick={() => navigate({ to: "/back-office/tools/create" })}>
            <PlusCircle className="size-4" />
            Tambah Alat
          </Button>
        </PermissionGate>
      </div>
      <DataTable
        table={table}
        isLoading={isLoading}
        error={error}
        emptyMessage="Tidak ada alat ditemukan."
        emptyDescription="Coba sesuaikan filter atau kata kunci pencarian Anda."
        onRowClick={handleRowClick}
      >
        <DataTableToolbar table={table}>
          <DataTableFilterMenu table={table} />
          <DataTableSortList table={table} />
        </DataTableToolbar>
      </DataTable>
      
      <CrudRowActionsModal
        config={toolActionConfig}
        row={selectedRow}
        open={isActionsOpen}
        onOpenChange={setIsActionsOpen}
      />
    </div>
  );
}
