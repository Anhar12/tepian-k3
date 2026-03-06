import getKBLIColumns from "@/components/columns/kbli-columns";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import kbliSchema from "@tepian-k3/schema/pengujian/kbli.schema";
import { PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useDataTableRouter } from "@/hooks/use-data-table-router";

export const Route = createFileRoute("/(core)/back-office/kblis/")({
  validateSearch: kbliSchema.getAllKBLISchema,
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: "kbli.view",
    }),
  component: RouteComponent,
  head: () => pageHead("Manajemen KBLI"),
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    data: kblis,
    isLoading,
    error,
  } = useQuery(trpc.pengujian.kbli.getPaginatedKblis.queryOptions(params));

  const [showDeleted, setShowDeleted] = useState(params.showDeleted);

  const columns = useMemo(
    () =>
      getKBLIColumns({
        currentPage: params.page,
        perPage: params.perPage,
      }),
    [params.page, params.perPage],
  );

  const { table } = useDataTableRouter({
    data: kblis?.data ?? [],
    columns,
    pageCount: kblis?.pageCount ?? 0,
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
            id="show-deleted-parameter"
            checked={showDeleted}
            onCheckedChange={(checked) => {
              navigate({
                to: "/back-office/kblis",
                search: {
                  ...params,
                  showDeleted: Boolean(checked),
                },
              });
              setShowDeleted(Boolean(checked));
            }}
          />
          <Label>Deleted KBLIs</Label>
        </div>
        <PermissionGate permission="kbli.create">
          <Button onClick={() => navigate({ to: "/back-office/kblis/create" })}>
            <PlusCircle className="size-4" />
            Tambah KBLIs
          </Button>
        </PermissionGate>
      </div>
      <DataTable
        table={table}
        isLoading={isLoading}
        error={error}
        emptyMessage="Tidak ada kbli ditemukan."
      >
        <DataTableToolbar table={table}>
          <DataTableFilterMenu table={table} />
          <DataTableSortList table={table} />
        </DataTableToolbar>
      </DataTable>
    </div>
  );
}
