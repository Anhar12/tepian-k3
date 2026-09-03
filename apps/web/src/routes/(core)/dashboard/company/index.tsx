import getUserCompanyColumns from "@/components/columns/user-company-columns";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { useDataTableRouter } from "@/hooks/use-data-table-router";
import { pageHead } from "@/utils/page-head";
import { trpc } from "@/utils/trpc";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import userCompanySchema from "@tepian-k3/schema/pengujian/user-company.schema";
import type { UserCompaniesWithRelations } from "@tepian-k3/types/pengujian/user-company.types";

import { Building2, PlusCircle } from "lucide-react";

import { useMemo } from "react";

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
      navigate({
        search: updater,
      });
    },
    initialState: {
      sorting: [
        {
          id: "createdAt",
          desc: false,
        },
      ],
    },
    getRowId: (row: any) => row.id,
  });

  return (
    <div className="w-full p-2 sm:p-3">
      <div className="rounded-3xl border bg-card p-3 shadow-sm sm:p-4">
        {/* Header */}
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background">
            <Building2 className="size-4.5 text-primary" />
          </div>

          <h1 className="text-base font-semibold">Daftar Perusahaan</h1>
        </div>

        <DataTable
          table={table}
          isLoading={isLoading}
          error={error}
          emptyMessage="Tidak ada perusahaan ditemukan."
        >
          <DataTableToolbar
            table={table}
            rightActions={
              <PermissionGate permission="user-company.create">
                <Button
                  size="sm"
                  className="gap-2 px-3 sm:px-4"
                  onClick={() =>
                    navigate({
                      to: "/dashboard/company/create",
                    })
                  }
                >
                  <PlusCircle className="size-4" />

                  <span>Tambah Perusahaan</span>
                </Button>
              </PermissionGate>
            }
          />
        </DataTable>
      </div>
    </div>
  );
}
