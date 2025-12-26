import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Button } from "@/components/ui/button";
import getUsersColumns from "@/components/users-columns";
import { useDataTable } from "@/hooks/use-data-table";
import { trpc } from "@/utils/trpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import userSchema from "@tepian-k3/schema/users.schema";
import { PlusCircle } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/(core)/dashboard/users/")({
  validateSearch: (search) => userSchema.getAllUsersSchema.parse(search),
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
      sorting: [{ id: "createdAt", desc: true }],
      pagination: {
        pageSize: 10,
        pageIndex: 0,
      },
    },
    getRowId: (row) => row.id,
  });

  return (
    <div className="flex flex-col">
      <Button
        className="mb-4 self-end"
        onClick={() => navigate({ to: "/dashboard/users/create" })}
      >
        <PlusCircle className="size-4" />
        Tambah Pengguna
      </Button>
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <DataTableFilterMenu table={table} />
          <DataTableSortList table={table} />
        </DataTableToolbar>
      </DataTable>
    </div>
  );
}
