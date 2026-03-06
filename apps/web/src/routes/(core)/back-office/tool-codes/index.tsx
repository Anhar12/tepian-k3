import getToolCodesColumns from "@/components/columns/tool-codes-columns";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useDataTableRouter } from "@/hooks/use-data-table-router";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import toolCodeSchema from "@tepian-k3/schema/pengujian/tool-code.schema";
import { PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/(core)/back-office/tool-codes/")({
  validateSearch: toolCodeSchema.getAllToolCodesSchema,
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "tool-codes.view" }),
  component: RouteComponent,
  head: () => pageHead("Manajemen Kode Alat"),
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    data: toolCodes,
    isLoading,
    error,
  } = useQuery(
    trpc.pengujian.toolCode.getPaginatedToolCodes.queryOptions(params),
  );

  const [showDeleted, setShowDeleted] = useState(params.showDeleted);

  const columns = useMemo(
    () =>
      getToolCodesColumns({
        currentPage: params.page,
        perPage: params.perPage,
      }),
    [params.page, params.perPage],
  );

  const { table } = useDataTableRouter({
    data: toolCodes?.data ?? [],
    columns,
    pageCount: toolCodes?.pageCount ?? 0,
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
        <div className="flex flex-row gap-2">
          <Checkbox
            id="show-deleted-tool-codes"
            checked={showDeleted}
            onCheckedChange={(checked) => {
              navigate({
                to: "/back-office/tool-codes",
                search: {
                  ...params,
                  showDeleted: Boolean(checked),
                },
              });
              setShowDeleted(Boolean(checked));
            }}
          />
          <Label htmlFor="show-deleted-tool-codes">Deleted Tool Codes</Label>
        </div>
        <PermissionGate permission="tool-codes.create">
          <Button
            onClick={() => navigate({ to: "/back-office/tool-codes/create" })}
          >
            <PlusCircle className="size-4" />
            Tambah Kode Alat
          </Button>
        </PermissionGate>
      </div>
      <DataTable
        table={table}
        isLoading={isLoading}
        error={error}
        emptyMessage="Tidak ada kode alat ditemukan."
        emptyDescription="Coba sesuaikan filter atau kata kunci pencarian Anda."
      >
        <DataTableToolbar table={table}>
          <DataTableFilterMenu table={table} />
          <DataTableSortList table={table} />
        </DataTableToolbar>
      </DataTable>
    </div>
  );
}
