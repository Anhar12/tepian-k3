import getChemicalMaterialsColumns, { chemicalMaterialActionConfig } from "@/components/columns/checmical-materials-columns";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { useDataTableRouter } from "@/hooks/use-data-table-router";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import chemicalMaterialSchema from "@tepian-k3/schema/pengujian/chemical-material.schema";
import { PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { SoftDeleteToggle } from "@/components/soft-delete-toggle";
import { useCrudRowActions, CrudRowActionsModal } from "@/components/crud-row-actions";
import type { ChemicalMaterial } from "@tepian-k3/types/pengujian/chemical-material.types";
import { ChemicalSummaryCard } from "./-components/chemical-summary-card";

export const Route = createFileRoute("/(core)/back-office/chemical-materials/")(
  {
    validateSearch: chemicalMaterialSchema.getAllChemicalMaterialsSchema,
    beforeLoad: async ({ context }) =>
      await requirePermission(context, {
        permission: "chemical-materials.view",
      }),
    component: RouteComponent,
    head: () => pageHead("Manajemen Bahan Kimia"),
  },
);

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    data: chemicalMaterials,
    isLoading,
    error,
  } = useQuery({
    ...trpc.pengujian.chemicalMaterial.getPaginated.queryOptions(params),
    placeholderData: keepPreviousData,
  });

  const [showDeleted, setShowDeleted] = useState(params.showDeleted);
  
  const { selectedRow, isActionsOpen, setIsActionsOpen, handleRowClick } = useCrudRowActions<ChemicalMaterial>();

  const columns = useMemo(
    () =>
      getChemicalMaterialsColumns({
        currentPage: params.page,
        perPage: params.perPage,
      }),
    [params.page, params.perPage],
  );

  const { table } = useDataTableRouter({
    data: (chemicalMaterials?.data ?? []) as ChemicalMaterial[],
    columns,
    pageCount: chemicalMaterials?.pageCount ?? 0,
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
      <ChemicalSummaryCard />
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex flex-row gap-2 items-center">
          <SoftDeleteToggle
            checked={showDeleted ?? false}
            onCheckedChange={(checked) => {
              navigate({
                to: "/back-office/chemical-materials",
                search: {
                  ...params,
                  showDeleted: Boolean(checked),
                },
              });
              setShowDeleted(Boolean(checked));
            }}
          />
        </div>
        <PermissionGate permission="chemical-materials.create">
          <Button
            onClick={() =>
              navigate({ to: "/back-office/chemical-materials/create" })
            }
          >
            <PlusCircle className="size-4" />
            Tambah Bahan Kimia
          </Button>
        </PermissionGate>
      </div>
      <DataTable
        table={table}
        isLoading={isLoading}
        error={error}
        emptyMessage="Tidak ada bahan kimia yang ditemukan"
        emptyDescription="Coba sesuaikan filter atau kata kunci pencarian Anda."
        onRowClick={handleRowClick}
      >
        <DataTableToolbar table={table}>
          <DataTableFilterMenu table={table} />
          <DataTableSortList table={table} />
        </DataTableToolbar>
      </DataTable>
      
      <CrudRowActionsModal
        config={chemicalMaterialActionConfig}
        row={selectedRow}
        open={isActionsOpen}
        onOpenChange={setIsActionsOpen}
      />
    </div>
  );
}
