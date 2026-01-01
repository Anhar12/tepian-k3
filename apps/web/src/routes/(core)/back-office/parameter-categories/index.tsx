import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import parameterCategoriesSchema from "@tepian-k3/schema/parameter-categories.schema";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import getParameterCategoriesColumns from "@/components/columns/parameter-categories-columns";
import { useDataTable } from "@/hooks/use-data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import type { ParameterCategories } from "@tepian-k3/types/parameter-categories.types";

export const Route = createFileRoute(
  "/(core)/back-office/parameter-categories/",
)({
  validateSearch: parameterCategoriesSchema.getAllParameterCategoriesSchema,
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: "parameter-categories.read",
    }),
  loaderDeps: (search) => ({
    searchParams:
      parameterCategoriesSchema.getAllParameterCategoriesSchema.parse(search),
  }),
  loader: ({ context, deps }) => {
    return context.queryClient.ensureQueryData(
      context.trpc.parameterCategories.getPaginatedParameterCategories.queryOptions(
        deps.searchParams,
      ),
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: parameterCategories } = useSuspenseQuery(
    trpc.parameterCategories.getPaginatedParameterCategories.queryOptions(
      params,
    ),
  );

  const [showDeleted, setShowDeleted] = useState(params.showDeleted);

  const columns = useMemo(
    () =>
      getParameterCategoriesColumns({
        currentPage: params.page,
        perPage: params.perPage,
      }),
    [params.page, params.perPage],
  );

  const { table } = useDataTable({
    data: parameterCategories.data,
    columns: columns as ParameterCategories[],
    pageCount: parameterCategories.pageCount,
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
            id="show-deleted-parameter-categories"
            checked={showDeleted}
            onCheckedChange={(checked) => {
              navigate({
                to: "/back-office/parameter-categories",
                search: {
                  ...params,
                  showDeleted: Boolean(checked),
                },
              });
              setShowDeleted(Boolean(checked));
            }}
          />
          <Label>Deleted Parameter Categories</Label>
        </div>
        <PermissionGate permission="parameter-categories.create">
          <Button
            onClick={() =>
              navigate({ to: "/back-office/parameter-categories/create" })
            }
          >
            <PlusCircle className="size-4" />
            Tambah Kategori Parameter
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
