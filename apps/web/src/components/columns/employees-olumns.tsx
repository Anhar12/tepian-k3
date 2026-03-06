import type { ColumnDef } from "@tanstack/react-table";
import type { Employees } from "@tepian-k3/types/platform/employee.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/back-office/employees";
import {
  createNumberColumn,
  createTextColumn,
  createDateColumn,
  createActionColumn,
} from "@/lib/column-helpers";
import { createCrudActionCell } from "@/lib/create-crud-action-cell";

interface EmployeesColumnsProps {
  currentPage: number;
  perPage: number;
}

const ActionCell = createCrudActionCell<
  Employees,
  (typeof Route)["types"]["searchSchema"]
>({
  resourceName: "employee",
  resourcePath: "employees",
  permissionPrefix: "employees",
  deleteMutation: trpc.platform.employee.deleteEmployee,
  restoreMutation: trpc.platform.employee.restoreEmployee,
  getQueryOptions: (params) =>
    trpc.platform.employee.getEmployeePaginated.queryOptions(params),
  useSearchParams: () => Route.useSearch(),
});

export default function getEmployeesColumns({
  currentPage,
  perPage,
}: EmployeesColumnsProps): ColumnDef<Employees>[] {
  return [
    createNumberColumn<Employees>(currentPage, perPage),
    createTextColumn<Employees>("name", "Nama", {
      width: "w-64",
    }),
    createTextColumn<Employees>("position.name", "Posisi", {
      width: "w-64",
    }),
    createDateColumn<Employees>("createdAt", "Dibuat"),
    createDateColumn<Employees>("updatedAt", "Diubah", {
      nullable: true,
    }),
    createActionColumn<Employees>(({ row }) => <ActionCell row={row} />),
  ];
}
