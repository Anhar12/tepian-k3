import type { ColumnDef } from "@tanstack/react-table";
import type { Banner } from "@tepian-k3/types/platform/banner.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/back-office/banners";
import {
  createBadgeColumn,
  createNumberColumn,
  createTextColumn,
  createDateColumn,
  createActionColumn,
} from "@/lib/column-helpers";
import { createCrudActionCell } from "@/lib/create-crud-action-cell";

interface BannersColumnsProps {
  currentPage: number;
  perPage: number;
}

const ActionCell = createCrudActionCell<
  Banner,
  (typeof Route)["types"]["searchSchema"]
>({
  resourceName: "banner",
  resourcePath: "banners",
  permissionPrefix: "banners",
  deleteMutation: trpc.platform.banner.deleteBanner,
  restoreMutation: trpc.platform.banner.restoreBanner,
  getQueryOptions: (params) =>
    trpc.platform.banner.getPaginatedBanners.queryOptions(params),
  useSearchParams: () => Route.useSearch(),
});

export default function getBannersColumns({
  currentPage,
  perPage,
}: BannersColumnsProps): ColumnDef<Banner>[] {
  return [
    createNumberColumn<Banner>(currentPage, perPage),
    createTextColumn<Banner>("title", "Judul", {
      width: "w-32",
      enableFilter: true,
    }),
    createTextColumn<Banner>("order", "Urutan", {
      width: "w-24",
    }),
    createBadgeColumn<Banner>("isActive", "Aktif", {
      valueIsBoolean: true,
    }),
    createDateColumn<Banner>("createdAt", "Dibuat"),
    createDateColumn<Banner>("updatedAt", "Diubah", {
      nullable: true,
    }),
    createActionColumn<Banner>(({ row }) => <ActionCell row={row} />),
  ];
}
