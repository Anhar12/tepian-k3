import type { ColumnDef } from "@tanstack/react-table";
import type { Employees } from "@tepian-k3/types/platform/employee.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/back-office/employees";
import {
  createNumberColumn,
  createMergedTextColumn,
  createCompactDateColumn,
} from "@/lib/column-helpers";
import type { CrudActionCellConfig } from "@/components/crud-row-actions";

interface EmployeesColumnsProps {
  currentPage: number;
  perPage: number;
}

export const employeeActionConfig: CrudActionCellConfig<
  Employees,
  (typeof Route)["types"]["searchSchema"]
> = {
  resourceName: "pegawai",
  resourcePath: "employees",
  permissionPrefix: "employees",
  deleteMutation: trpc.platform.employee.deleteEmployee,
  restoreMutation: trpc.platform.employee.restoreEmployee,
  hardDeleteMutation: trpc.platform.employee.hardDeleteEmployee,
  getQueryOptions: (params) =>
    trpc.platform.employee.getEmployeePaginated.queryOptions(params),
  useSearchParams: () => Route.useSearch(),
  showDetail: true,
};

export default function getEmployeesColumns({
  currentPage,
  perPage,
}: EmployeesColumnsProps): ColumnDef<Employees>[] {
  return [
    createNumberColumn<Employees>(currentPage, perPage),
    createMergedTextColumn<Employees>("name", "Nama", {
      width: "w-64",
      secondaryId: "position.name",
    }),
    createCompactDateColumn<Employees>("createdAt", "Dibuat"),
  ];
}
