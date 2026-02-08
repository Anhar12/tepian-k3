import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/utils/page-head";
import bannerSchema from "@tepian-k3/schema/banner.schema";
import { requirePermission } from "@/utils/require-permission";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useMemo, useState } from "react";
import getBannersColumns from "@/components/columns/banner-columns";
import { useDataTableRouter } from "@/hooks/use-data-table-router";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";

export const Route = createFileRoute("/(core)/back-office/banners/")({
  validateSearch: bannerSchema.getAllBannersSchema,
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: "banners.view",
    }),
  component: RouteComponent,
  head: () => pageHead("Manajemen Banner"),
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    data: banner,
    isLoading,
    error,
  } = useQuery({
    ...trpc.banner.getPaginatedBanners.queryOptions(params),
    placeholderData: keepPreviousData,
  });

  const [showDeleted, setShowDeleted] = useState(params.showDeleted);

  const columns = useMemo(
    () =>
      getBannersColumns({
        currentPage: params.page,
        perPage: params.perPage,
      }),
    [params.page, params.perPage],
  );

  const { table } = useDataTableRouter({
    data: banner?.data ?? [],
    columns,
    pageCount: banner?.pageCount ?? 0,
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
            id="show-deleted-chemical-material"
            checked={showDeleted}
            onCheckedChange={(checked) => {
              navigate({
                to: "/back-office/banners",
                search: {
                  ...params,
                  showDeleted: Boolean(checked),
                },
              });
              setShowDeleted(Boolean(checked));
            }}
          />
          <Label>Deleted Banners</Label>
        </div>
        <PermissionGate permission="banners.create">
          <Button
            onClick={() => navigate({ to: "/back-office/banners/create" })}
          >
            <PlusCircle className="size-4" />
            Tambah Banner
          </Button>
        </PermissionGate>
      </div>
      <DataTable
        table={table}
        isLoading={isLoading}
        error={error}
        emptyMessage="Tidak ada banner yang ditemukan"
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
