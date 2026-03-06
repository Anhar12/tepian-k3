import type { ColumnDef } from "@tanstack/react-table";
import type { Document } from "@tepian-k3/types/platform/document.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/employee/spt";
import {
  createBadgeColumn,
  createNumberColumn,
  createTextColumn,
  createDateColumn,
  createActionColumn,
} from "@/lib/column-helpers";
import { createCrudActionCell } from "@/lib/create-crud-action-cell";
import { ExternalLink } from "lucide-react";
import { getPublicUrl } from "@/utils/url";

interface SPTColumnsProps {
  currentPage: number;
  perPage: number;
}

const ActionCell = createCrudActionCell<
  Document,
  (typeof Route)["types"]["searchSchema"]
>({
  resourceName: "document",
  resourcePath: "documents",
  permissionPrefix: "documents",
  getQueryOptions: (params) =>
    trpc.pengujian.document.getMyAssignmentDocuments.queryOptions(params),
  useSearchParams: () => Route.useSearch(),
  customActions: (row) => [
    {
      icon: <ExternalLink className="mr-4 size-4" />,
      text: "Lihat Dokumen",
      action: () => window.open(getPublicUrl(row.fileUrl), "_blank"),
    },
  ],
});

export default function getSPTColumns({
  currentPage,
  perPage,
}: SPTColumnsProps): ColumnDef<Document>[] {
  return [
    createNumberColumn<Document>(currentPage, perPage),
    createTextColumn<Document>("title", "Judul", {
      width: "w-32",
      enableFilter: true,
    }),
    createBadgeColumn<Document>("entityType", "Aktif", {
      valueIsBoolean: true,
    }),
    createDateColumn<Document>("createdAt", "Dibuat"),
    createDateColumn<Document>("updatedAt", "Diubah", {
      nullable: true,
    }),
    createActionColumn<Document>(({ row }) => <ActionCell row={row} />),
  ];
}
