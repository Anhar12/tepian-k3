import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import getUsersColumns from "@/components/columns/users-columns";
import { useDataTable } from "@/hooks/use-data-table";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import userSchema from "@tepian-k3/schema/users.schema";
import { PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/(core)/dashboard/users/")({
  validateSearch: (search) => userSchema.getAllUsersSchema.parse(search),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "users.read" }),
  loaderDeps: (search) => ({
    searchParams: userSchema.getAllUsersSchema.parse(search),
  }),
  loader: ({ context, deps }) => {
    return context.queryClient.ensureQueryData(
      context.trpc.user.getUserPaginated.queryOptions(deps.searchParams),
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: users } = useSuspenseQuery(
    trpc.user.getUserPaginated.queryOptions(params),
  );

  const [showDeleted, setShowDeleted] = useState(params.showDeleted);

  const columns = useMemo(
    () =>
      getUsersColumns({
        currentPage: params.page,
        perPage: params.perPage,
      }),
    [params.page, params.perPage],
  );

  const { table } = useDataTable({
    data: users.data,
    columns,
    pageCount: users.pageCount,
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
                to: "/dashboard/users",
                search: {
                  ...params,
                  showDeleted: Boolean(checked),
                },
              });
              setShowDeleted(Boolean(checked));
            }}
          />
          <Label>Deleted Users</Label>
        </div>
        <PermissionGate permission="users.create">
          <Button onClick={() => navigate({ to: "/dashboard/users/create" })}>
            <PlusCircle className="size-4" />
            Tambah Pengguna
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
