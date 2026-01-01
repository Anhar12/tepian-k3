import getUserCompanyColumns from "@/components/columns/user-company-columns";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useDataTable } from "@/hooks/use-data-table";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import userCompanySchema from "@tepian-k3/schema/user-company.schema";
import type { UserCompaniesWithRelations } from "@tepian-k3/types/user-company.types";
import { PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/(core)/dashboard/company/")({
  validateSearch: userCompanySchema.getAllUserCompaniesSchema,
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "user-company.read" }),
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    data: company,
    isLoading,
    error,
  } = useQuery(
    trpc.userCompany.getPaginatedUserCompaniesByUserId.queryOptions(params),
  );

  const [showDeleted, setShowDeleted] = useState(params.showDeleted);

  const columns = useMemo(
    () =>
      getUserCompanyColumns({
        currentPage: params.page,
        perPage: params.perPage,
      }),
    [params.page, params.perPage],
  );

  const { table } = useDataTable({
    data: company?.data ?? [],
    columns: columns as UserCompaniesWithRelations[],
    pageCount: company?.pageCount ?? 0,
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
            id="show-deleted-clusters"
            checked={showDeleted}
            onCheckedChange={(checked) => {
              navigate({
                to: "/dashboard/company",
                search: {
                  ...params,
                  showDeleted: Boolean(checked),
                },
              });
              setShowDeleted(Boolean(checked));
            }}
          />
          <Label>Deleted Companies</Label>
        </div>
        <PermissionGate permission="user-company.create">
          <Button onClick={() => navigate({ to: "/dashboard/company/create" })}>
            <PlusCircle className="size-4" />
            Tambah Company
          </Button>
        </PermissionGate>
      </div>
      <DataTable
        table={table}
        isLoading={isLoading}
        error={error}
        emptyMessage="Tidak ada perusahaan ditemukan."
      >
        <DataTableToolbar table={table}>
          <DataTableFilterMenu table={table} />
          <DataTableSortList table={table} />
        </DataTableToolbar>
      </DataTable>
    </div>
  );
}
