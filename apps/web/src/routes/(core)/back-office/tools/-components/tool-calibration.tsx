import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { PermissionGate } from "@/components/permission-gate";
import getToolCalibrationColumns from "@/components/columns/tool-calibrations-columns";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useDataTableRouter } from "@/hooks/use-data-table-router";

interface ToolCalibrationProps {
  toolId: string;
}

export default function ToolCalibration({ toolId }: { toolId: string }) {
  const params = useSearch({
    from: "/(core)/back-office/tools/$toolId/calibration/",
  });
  const navigate = useNavigate({
    from: "/back-office/tools/$toolId/calibration",
  });

  const {
    data: calibrations,
    isLoading,
    error,
  } = useQuery(
    trpc.pengujian.tool.getPaginatedCalibrations.queryOptions({
      toolId,
      ...params,
    }),
  );

  const [showDeleted, setShowDeleted] = useState(params.showDeleted);

  const columns = useMemo(
    () =>
      getToolCalibrationColumns({
        currentPage: params.page,
        perPage: params.perPage,
      }),
    [params.page, params.perPage],
  );

  const { table } = useDataTableRouter({
    data: calibrations?.data ?? [],
    columns,
    pageCount: calibrations?.pageCount ?? 0,
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
          <CardTitle>Kalibrasi Alat</CardTitle>
          <CardDescription>
            Kelola data kalibrasi alat Anda di sini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex flex-row gap-2">
              <Checkbox
                id="show-deleted-calibrations"
                checked={showDeleted}
                onCheckedChange={(checked) => {
                  navigate({
                    to: "/back-office/tools/$toolId/calibration",
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
              <Label>Deleted Calibrations</Label>
            </div>
            <PermissionGate permission="tool-calibrations.create">
              <Button
                onClick={() =>
                  navigate({
                    to: "/back-office/tools/$toolId/calibration/create",
                    params: { toolId },
                  })
                }
              >
                <PlusCircle className="size-4" />
                Tambah Kalibrasi
              </Button>
            </PermissionGate>
          </div>
          <DataTable
            table={table}
            isLoading={isLoading}
            error={error}
            emptyMessage="Tidak ada kalibrasi ditemukan."
            emptyDescription="Coba sesuaikan filter atau kata kunci pencarian Anda."
          >
            <DataTableToolbar table={table}>
              <DataTableFilterMenu table={table} />
              <DataTableSortList table={table} />
            </DataTableToolbar>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  );
}
