import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { PermissionGate } from "@/components/permission-gate";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SoftDeleteToggle } from "@/components/soft-delete-toggle";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useDataTableRouter } from "@/hooks/use-data-table-router";
import getToolCheckColumns, { getToolCheckActionConfig } from "@/components/columns/tool-check-columns";
import { useCrudRowActions, CrudRowActionsModal } from "@/components/crud-row-actions";
import type { ToolCheck as ToolCheckType } from "@tepian-k3/types/pengujian/tool-check.types";

interface ToolStatusProps {
  toolId: string;
}

export default function ToolStatus({ toolId }: { toolId: string }) {
  const params = useSearch({
    from: "/(core)/back-office/tools/$toolId/status/",
  });
  const navigate = useNavigate({
    from: "/back-office/tools/$toolId/status",
  });

  const {
    data: toolChecks,
    isLoading,
    error,
  } = useQuery(
    trpc.pengujian.tool.getPaginatedChecks.queryOptions({
      toolId,
      ...params,
    }),
  );

  const [showDeleted, setShowDeleted] = useState(params.showDeleted);
  
  const { selectedRow, isActionsOpen, setIsActionsOpen, handleRowClick } = useCrudRowActions<ToolCheckType>();
  
  const actionConfig = useMemo(() => getToolCheckActionConfig(toolId), [toolId]);

  const columns = useMemo(
    () =>
      getToolCheckColumns({
        currentPage: params.page,
        perPage: params.perPage,
      }),
    [params.page, params.perPage],
  );

  const { table } = useDataTableRouter({
    data: (toolChecks?.data ?? []) as ToolCheckType[],
    columns,
    pageCount: toolChecks?.pageCount ?? 0,
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
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Status Alat</CardTitle>
          <CardDescription>
            Pantau dan kelola status alat Anda di sini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex flex-row gap-2 items-center">
              <SoftDeleteToggle
                checked={showDeleted ?? false}
                onCheckedChange={(checked) => {
                  navigate({
                    to: "/back-office/tools/$toolId/status",
                    params: {
                      toolId,
                    },
                    search: (prev) => ({
                      ...prev,
                      showDeleted: Boolean(checked),
                    }),
                  });
                  setShowDeleted(Boolean(checked));
                }}
              />
            </div>
            <PermissionGate permission="tool-checks.create">
              <Button
                onClick={() =>
                  navigate({
                    to: "/back-office/tools/$toolId/status/create",
                    params: { toolId },
                  })
                }
              >
                <PlusCircle className="size-4" />
                Tambah Status
              </Button>
            </PermissionGate>
          </div>
          <DataTable
            table={table}
            isLoading={isLoading}
            error={error}
            emptyMessage="Tidak ada status ditemukan."
            emptyDescription="Coba sesuaikan filter atau kata kunci pencarian Anda."
            onRowClick={handleRowClick}
          >
            <DataTableToolbar table={table}>
              <DataTableFilterMenu table={table} />
              <DataTableSortList table={table} />
            </DataTableToolbar>
          </DataTable>
          
          <CrudRowActionsModal
            config={actionConfig}
            row={selectedRow}
            open={isActionsOpen}
            onOpenChange={setIsActionsOpen}
          />
        </CardContent>
      </Card>
    </div>
  );
}
