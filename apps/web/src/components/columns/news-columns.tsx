import type { ColumnDef } from "@tanstack/react-table";
import type { News } from "@tepian-k3/types/platform/news.types";
import { trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/back-office/news";
import {
  createBadgeColumn,
  createNumberColumn,
  createTextColumn,
  createDateColumn,
  createActionColumn,
} from "@/lib/column-helpers";
import { createCrudActionCell } from "@/lib/create-crud-action-cell";

interface NewsColumnsProps {
  currentPage: number;
  perPage: number;
}

const ActionCell = createCrudActionCell<
  News,
  (typeof Route)["types"]["searchSchema"]
>({
  resourceName: "news",
  resourcePath: "news",
  permissionPrefix: "news",
  deleteMutation: trpc.platform.news.deleteNews,
  restoreMutation: trpc.platform.news.restoreNews,
  hardDeleteMutation: trpc.platform.news.hardDeleteNews,
  getQueryOptions: (params) =>
    trpc.platform.news.getPaginatedNews.queryOptions(params),
  useSearchParams: () => Route.useSearch(),
});

export default function getNewsColumns({
  currentPage,
  perPage,
}: NewsColumnsProps): ColumnDef<News>[] {
  return [
    createNumberColumn<News>(currentPage, perPage),
    createTextColumn<News>("title", "Judul", {
      width: "w-32",
      enableFilter: true,
    }),
    createDateColumn<News>("publishedAt", "Diterbitkan", {
      nullable: true,
    }),
    createBadgeColumn<News>("isPublished", "Dipublikasikan", {
      valueIsBoolean: true,
    }),
    createDateColumn<News>("createdAt", "Dibuat"),
    createDateColumn<News>("updatedAt", "Diubah", {
      nullable: true,
    }),
    createActionColumn<News>(({ row }) => <ActionCell row={row} />),
  ];
}
