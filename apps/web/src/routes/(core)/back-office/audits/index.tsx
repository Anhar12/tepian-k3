import getAuditsColumns from "@/components/columns/audits-columns";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { useDataTableRouter } from "@/hooks/use-data-table-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AUDIT_ACTIONS,
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_TYPES,
  AUDIT_ENTITY_TYPE_LABELS,
} from "@tepian-k3/constants";
import { z } from "zod";
import { useMemo } from "react";

const auditSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sort: z
    .array(z.object({ id: z.string(), desc: z.boolean() }))
    .default([{ id: "createdAt", desc: true }]),
  filters: z.array(z.any()).default([]),
  joinOperator: z.enum(["and", "or"]).default("and"),
  entityType: z.enum(AUDIT_ENTITY_TYPES).optional(),
  action: z.enum(AUDIT_ACTIONS).optional(),
  userId: z.string().optional(),
});

export const Route = createFileRoute("/(core)/back-office/audits/")({
  validateSearch: auditSearchSchema,
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "audits.view" }),
  component: RouteComponent,
  head: () => pageHead("Log Audit"),
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading, error } = useQuery(
    trpc.platform.audit.getAuditLogs.queryOptions({
      entityType: params.entityType,
      action: params.action,
      userId: params.userId,
      page: params.page,
      limit: params.perPage,
    }),
  );

  const columns = useMemo(
    () =>
      getAuditsColumns({
        currentPage: params.page,
        perPage: params.perPage,
      }),
    [params.page, params.perPage],
  );

  const { table } = useDataTableRouter({
    data: data?.logs ?? [],
    columns,
    pageCount: Math.ceil((data?.total ?? 0) / params.perPage),
    search: params,
    navigate: ({ search: updater }) => navigate({ search: updater }),
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
    },
    getRowId: (row) => row.id,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={params.entityType ?? "all"}
          onValueChange={(value) =>
            navigate({
              to: "/back-office/audits",
              search: {
                ...params,
                entityType:
                  value === "all"
                    ? undefined
                    : (value as (typeof AUDIT_ENTITY_TYPES)[number]),
                page: 1,
              },
            })
          }
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Semua Tipe Entitas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe Entitas</SelectItem>
            {AUDIT_ENTITY_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {AUDIT_ENTITY_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={params.action ?? "all"}
          onValueChange={(value) =>
            navigate({
              to: "/back-office/audits",
              search: {
                ...params,
                action:
                  value === "all"
                    ? undefined
                    : (value as (typeof AUDIT_ACTIONS)[number]),
                page: 1,
              },
            })
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Semua Aksi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Aksi</SelectItem>
            {AUDIT_ACTIONS.map((action) => (
              <SelectItem key={action} value={action}>
                {AUDIT_ACTION_LABELS[action]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(params.entityType || params.action) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate({
                to: "/back-office/audits",
                search: {
                  ...params,
                  entityType: undefined,
                  action: undefined,
                  page: 1,
                },
              })
            }
          >
            Reset Filter
          </Button>
        )}
      </div>

      <DataTable
        table={table}
        isLoading={isLoading}
        error={error}
        emptyMessage="Tidak ada log audit yang ditemukan."
        emptyDescription="Coba sesuaikan filter untuk melihat log audit."
      >
        <DataTableToolbar table={table}>
          <DataTableSortList table={table} />
        </DataTableToolbar>
      </DataTable>
    </div>
  );
}
