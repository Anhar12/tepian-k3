import getSPTColumns from "@/components/columns/spt-columns";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTableRouter } from "@/hooks/use-data-table-router";
import { pageHead } from "@/utils/page-head";
import { trpc } from "@/utils/trpc";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import documentSchema from "@tepian-k3/schema/platform/document.schema";
import { useMemo } from "react";

export const Route = createFileRoute("/(core)/employee/spt/")({
  validateSearch: documentSchema.getMyAssignmentDocumentsSchema,
  component: RouteComponent,
  head: () => pageHead("SPT Saya"),
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    data: spt,
    isLoading,
    error,
  } = useQuery({
    ...trpc.pengujian.document.getMyAssignmentDocuments.queryOptions(params),
    placeholderData: keepPreviousData,
  });

  const columns = useMemo(
    () =>
      getSPTColumns({
        currentPage: params.page,
        perPage: params.perPage,
      }),
    [params.page, params.perPage],
  );

  const { table } = useDataTableRouter({
    data: spt?.data ?? [],
    columns,
    pageCount: spt?.pageCount ?? 0,
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
      <DataTable
        table={table}
        isLoading={isLoading}
        error={error}
        emptyMessage="Tidak ada SPT yang ditemukan."
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
