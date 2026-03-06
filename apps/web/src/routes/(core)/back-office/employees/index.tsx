import getEmployeesColumns from "@/components/columns/employees-olumns";
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
import employeeSchema from "@tepian-k3/schema/platform/employee.schema";
import type { Employees } from "@tepian-k3/types/platform/employee.types";
import { PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useDataTableRouter } from "@/hooks/use-data-table-router";

export const Route = createFileRoute("/(core)/back-office/employees/")({
  validateSearch: employeeSchema.getAllEmployeesSchema,
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: "employees.view",
    }),
  component: RouteComponent,
  head: () => pageHead("Manajemen Karyawan"),
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    data: employees,
    isLoading,
    error,
  } = useQuery(
    trpc.platform.employee.getEmployeePaginated.queryOptions(params),
  );

  const [showDeleted, setShowDeleted] = useState(params.showDeleted);

  const columns = useMemo(
    () =>
      getEmployeesColumns({
        currentPage: params.page,
        perPage: params.perPage,
      }),
    [params.page, params.perPage],
  );

  const { table } = useDataTableRouter({
    data: employees?.data ?? [],
    columns: columns as unknown as Employees[],
    pageCount: employees?.pageCount ?? 0,
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
            id="show-deleted-position"
            checked={showDeleted}
            onCheckedChange={(checked) => {
              navigate({
                to: "/back-office/employees",
                search: {
                  ...params,
                  showDeleted: Boolean(checked),
                },
              });
              setShowDeleted(Boolean(checked));
            }}
          />
          <Label>Deleted Employees</Label>
        </div>
        <PermissionGate permission="employees.create">
          <Button
            onClick={() => navigate({ to: "/back-office/employees/create" })}
          >
            <PlusCircle className="size-4" />
            Tambah Employee
          </Button>
        </PermissionGate>
      </div>
      <DataTable
        table={table}
        isLoading={isLoading}
        error={error}
        emptyMessage="Tidak ada karyawan yang ditemukan"
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
