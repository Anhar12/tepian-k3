import getSurveyQuestionColumns from "@/components/columns/survey-question-columns";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useDataTable } from "@/hooks/use-data-table";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import surveySchema from "@tepian-k3/schema/survey.schema";
import { PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/(core)/back-office/survey-questions/")({
  validateSearch: surveySchema.getAllSurveyQuestionsSchema,
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "survey-questions.view" }),
  component: RouteComponent,
  head: () => pageHead("Pertanyaan Survei"),
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    data: questions,
    isLoading,
    error,
  } = useQuery(trpc.survey.getPaginatedQuestions.queryOptions(params));

  const [showDeleted, setShowDeleted] = useState(params.showDeleted);
  const [showInactive, setShowInactive] = useState(params.showInactive);

  const columns = useMemo(
    () =>
      getSurveyQuestionColumns({
        currentPage: params.page,
        perPage: params.perPage,
      }),
    [params.page, params.perPage],
  );

  const { table } = useDataTable({
    data: questions?.data ?? [],
    columns,
    pageCount: questions?.pageCount ?? 0,
    initialState: {
      sorting: [{ id: "order", desc: false }],
      pagination: {
        pageSize: params.perPage,
        pageIndex: params.page - 1,
      },
    },
    getRowId: (row) => row.id,
  });

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex flex-row gap-4">
          <div className="flex flex-row gap-2">
            <Checkbox
              id="show-deleted"
              checked={showDeleted}
              onCheckedChange={(checked) => {
                navigate({
                  to: "/back-office/survey-questions",
                  search: {
                    ...params,
                    showDeleted: Boolean(checked),
                  },
                });
                setShowDeleted(Boolean(checked));
              }}
            />
            <Label htmlFor="show-deleted">Pertanyaan Dihapus</Label>
          </div>
          <div className="flex flex-row gap-2">
            <Checkbox
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={(checked) => {
                navigate({
                  to: "/back-office/survey-questions",
                  search: {
                    ...params,
                    showInactive: Boolean(checked),
                  },
                });
                setShowInactive(Boolean(checked));
              }}
            />
            <Label htmlFor="show-inactive">Pertanyaan Nonaktif</Label>
          </div>
        </div>
        <PermissionGate permission="survey-questions.create">
          <Button
            onClick={() =>
              navigate({ to: "/back-office/survey-questions/create" })
            }
          >
            <PlusCircle className="size-4" />
            Tambah Pertanyaan
          </Button>
        </PermissionGate>
      </div>
      <DataTable
        table={table}
        isLoading={isLoading}
        error={error}
        emptyMessage="Tidak ada pertanyaan survey ditemukan."
        emptyDescription="Buat pertanyaan survey baru untuk memulai."
      >
        <DataTableToolbar table={table}>
          <DataTableFilterMenu table={table} />
          <DataTableSortList table={table} />
        </DataTableToolbar>
      </DataTable>
    </div>
  );
}
