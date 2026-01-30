import type { ColumnDef } from "@tanstack/react-table";
import type { SurveyQuestion } from "@tepian-k3/types/survey.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/back-office/survey-questions";
import {
  createNumberColumn,
  createTextColumn,
  createDateColumn,
  createActionColumn,
} from "@/lib/column-helpers";
import { createCrudActionCell } from "@/lib/create-crud-action-cell";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";

interface SurveyQuestionColumnsProps {
  currentPage: number;
  perPage: number;
}

const ActionCell = createCrudActionCell<
  SurveyQuestion,
  (typeof Route)["types"]["searchSchema"]
>({
  resourceName: "pertanyaan survey",
  resourcePath: "survey-questions",
  permissionPrefix: "survey-questions",
  deleteMutation: trpc.survey.deleteQuestion,
  restoreMutation: trpc.survey.restoreQuestion,
  getQueryOptions: (params) =>
    trpc.survey.getPaginatedQuestions.queryOptions(params),
  useSearchParams: () => Route.useSearch(),
});

export default function getSurveyQuestionColumns({
  currentPage,
  perPage,
}: SurveyQuestionColumnsProps): ColumnDef<SurveyQuestion>[] {
  return [
    createNumberColumn<SurveyQuestion>(currentPage, perPage),
    {
      id: "order",
      accessorKey: "order",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Urutan" label="Urutan" />
      ),
      cell: ({ row }) => (
        <div className="w-16 text-center">{row.getValue("order")}</div>
      ),
    },
    createTextColumn<SurveyQuestion>("questionText", "Pertanyaan", {
      width: "w-96",
      enableFilter: true,
      placeholder: "Cari pertanyaan...",
    }),
    {
      id: "isActive",
      accessorKey: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" label="Status" />
      ),
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Aktif" : "Nonaktif"}
          </Badge>
        );
      },
    },
    createDateColumn<SurveyQuestion>("createdAt", "Dibuat"),
    createDateColumn<SurveyQuestion>("updatedAt", "Diubah", { nullable: true }),
    createActionColumn<SurveyQuestion>(({ row }) => <ActionCell row={row} />),
  ];
}
