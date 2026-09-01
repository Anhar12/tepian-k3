import getUserCompanyColumns from "@/components/columns/user-company-columns";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/utils/page-head";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import userCompanySchema from "@tepian-k3/schema/pengujian/user-company.schema";
import type { UserCompaniesWithRelations } from "@tepian-k3/types/pengujian/user-company.types";
import { PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useDataTableRouter } from "@/hooks/use-data-table-router";

export const Route = createFileRoute("/(core)/dashboard/company/")({
  validateSearch: userCompanySchema.getAllUserCompaniesSchema,
  component: RouteComponent,
  head: () => pageHead("Perusahaan"),
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    data: company,
    isLoading,
    error,
  } = useQuery(
    trpc.pengujian.userCompany.getPaginatedUserCompaniesByUserId.queryOptions(
      params,
    ),
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

  const { table } = useDataTableRouter({
    data: company?.data ?? [],
    columns: columns as unknown as UserCompaniesWithRelations[],
    pageCount: company?.pageCount ?? 0,
    search: params,
    navigate: ({ search: updater }) => {
      navigate({ search: updater });
    },
    initialState: {
      sorting: [{ id: "createdAt", desc: false }],
    },
    getRowId: (row: any) => row.id,
  });

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex flex-row gap-2"></div>
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
