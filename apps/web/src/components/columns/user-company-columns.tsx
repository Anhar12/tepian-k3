import type { ColumnDef } from "@tanstack/react-table";
import type { UserCompaniesWithRelations } from "@tepian-k3/types/user-company.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/dashboard/company";
import {
  createNumberColumn,
  createTextColumn,
  createDateColumn,
  createActionColumn,
} from "@/lib/column-helpers";
import { createCrudActionCell } from "@/lib/create-crud-action-cell";

interface UserCompanyColumnsProps {
  currentPage: number;
  perPage: number;
}

const ActionCell = createCrudActionCell<
  UserCompaniesWithRelations,
  ReturnType<typeof Route.useSearch>
>({
  resourceName: "company",
  resourcePath: "user-company",
  permissionPrefix: "user-company",
  deleteMutation: trpc.userCompany.userDeleteUserCompany,
  restoreMutation: trpc.userCompany.userRestoreUserCompany,
  getQueryOptions: (params) =>
    trpc.userCompany.getPaginatedUserCompaniesByUserId.queryOptions(params),
  useSearchParams: () => Route.useSearch(),
  showDetail: true,
});

export default function getUserCompanyColumns({
  currentPage,
  perPage,
}: UserCompanyColumnsProps): ColumnDef<UserCompaniesWithRelations>[] {
  return [
    createNumberColumn<UserCompaniesWithRelations>(currentPage, perPage),
    createTextColumn<UserCompaniesWithRelations>("name", "Nama Perusahaan", {
      width: "w-48",
      enableFilter: true,
      placeholder: "Cari nama perusahaan...",
    }),
    createTextColumn<UserCompaniesWithRelations>("kbli.name", "KBLI", {
      width: "w-48",
    }),
    createTextColumn<UserCompaniesWithRelations>("province.name", "Provinsi", {
      width: "w-48",
    }),
    createTextColumn<UserCompaniesWithRelations>("regency.name", "Kota/Kab", {
      width: "w-48",
    }),
    createTextColumn<UserCompaniesWithRelations>("district.name", "Kecamatan", {
      width: "w-48",
    }),
    createTextColumn<UserCompaniesWithRelations>(
      "village.name",
      "Desa/Kelurahan",
      {
        width: "w-64",
      },
    ),
    createDateColumn<UserCompaniesWithRelations>("createdAt", "Dibuat"),
    createDateColumn<UserCompaniesWithRelations>("updatedAt", "Diubah", {
      nullable: true,
    }),
    createActionColumn<UserCompaniesWithRelations>(({ row }) => (
      <ActionCell row={row} />
    )),
  ];
}
