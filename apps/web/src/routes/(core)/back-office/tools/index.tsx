import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { PermissionGate } from "@/components/permission-gate";
import getToolsColumns from "@/components/columns/tools-columns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useDataTable } from "@/hooks/use-data-table";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import toolsSchema from "@tepian-k3/schema/tools.schema";
import { PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/(core)/back-office/tools/")({
  validateSearch: toolsSchema.getAllToolsSchema,
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "tools.read" }),
  loaderDeps: (search) => ({
    searchParams: toolsSchema.getAllToolsSchema.parse(search),
  }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      context.trpc.tool.getToolPaginated.queryOptions(deps.searchParams),
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: tools } = useSuspenseQuery(
    trpc.tool.getToolPaginated.queryOptions(params),
  );

  const [showDeleted, setShowDeleted] = useState(params.showDeleted);

  const columns = useMemo(
    () =>
      getToolsColumns({
        currentPage: params.page,
        perPage: params.perPage,
      }),
    [params.page, params.perPage],
  );

  const { table } = useDataTable({
    data: tools.data,
    columns,
    pageCount: tools.pageCount,
    initialState: {
      sorting: [{ id: "createdAt", desc: false }],
      pagination: {
        pageSize: params.perPage,
        pageIndex: params.page - 1,
      },
    },
    getRowId: (row) => row.id,
  });

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex flex-row gap-2">
          <Checkbox
            id="show-deleted-users"
            checked={showDeleted}
            onCheckedChange={(checked) => {
              navigate({
                to: "/dashboard/tools",
                search: {
                  ...params,
                  showDeleted: Boolean(checked),
                },
              });
              setShowDeleted(Boolean(checked));
            }}
          />
          <Label>Deleted Tools</Label>
        </div>
        <PermissionGate permission="tools.create">
          <Button onClick={() => navigate({ to: "/dashboard/tools/create" })}>
            <PlusCircle className="size-4" />
            Tambah Alat
          </Button>
        </PermissionGate>
      </div>
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <DataTableFilterMenu table={table} />
          <DataTableSortList table={table} />
        </DataTableToolbar>
      </DataTable>
    </div>
  );
}
