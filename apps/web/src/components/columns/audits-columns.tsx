import type { ColumnDef } from "@tanstack/react-table";
import type { Audit } from "@tepian-k3/types/platform/audit.types";
import { AUDIT_ENTITY_TYPE_LABELS } from "@tepian-k3/constants";
import {
  createActionColumn,
  createCompactDateColumn,
  createNumberColumn,
  createTextColumn,
} from "@/lib/column-helpers";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Eye } from "lucide-react";

interface AuditsColumnsProps {
  currentPage: number;
  perPage: number;
}

/**
 * Column definitions for the audit logs table.
 */
export default function getAuditsColumns({
  currentPage,
  perPage,
}: AuditsColumnsProps): ColumnDef<Audit>[] {
  return [
    createNumberColumn<Audit>(currentPage, perPage),
    {
      id: "entityType",
      accessorKey: "entityType",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Tipe / ID Entitas"
          label="Tipe / ID Entitas"
        />
      ),
      cell: ({ row }) => {
        const entityType = row.getValue("entityType") as string;
        const entityId = row.original.entityId;
        const label =
          (AUDIT_ENTITY_TYPE_LABELS as Record<string, string>)[entityType] ??
          entityType;
        return (
          <div className="flex flex-col gap-1 w-40">
            <Badge variant="secondary" className="w-fit">{label}</Badge>
            <span className="text-xs text-muted-foreground truncate" title={entityId}>{entityId}</span>
          </div>
        );
      },
      meta: { label: "Tipe / ID Entitas" },
    },
    createTextColumn<Audit>("userEmail", "Email Pengguna", {
      width: "w-52",
    }),
    createTextColumn<Audit>("description", "Deskripsi", { width: "w-72" }),
    createCompactDateColumn<Audit>("createdAt", "Waktu", {
      format: "dd MMM yy HH:mm",
    }),
    createActionColumn<Audit>(({ row }) => (
      <Link
        to="/back-office/audits/$auditId"
        params={{ auditId: row.original.id }}
      >
        <Button variant="ghost" size="icon" title="Lihat Detail">
          <Eye className="size-4" />
        </Button>
      </Link>
    )),
  ];
}
