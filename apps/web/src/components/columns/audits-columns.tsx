import type { ColumnDef } from "@tanstack/react-table";
import type { Audit } from "@tepian-k3/types/platform/audit.types";
import { AUDIT_ENTITY_TYPE_LABELS } from "@tepian-k3/constants";
import {
  createActionColumn,
  createDateColumn,
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
          title="Tipe Entitas"
          label="Tipe Entitas"
        />
      ),
      cell: ({ row }) => {
        const entityType = row.getValue("entityType") as string;
        const label =
          (AUDIT_ENTITY_TYPE_LABELS as Record<string, string>)[entityType] ??
          entityType;
        return (
          <div className="w-40">
            <Badge variant="secondary">{label}</Badge>
          </div>
        );
      },
      meta: { label: "Tipe Entitas" },
    },
    createTextColumn<Audit>("entityId", "ID Entitas", { width: "w-32" }),
    createTextColumn<Audit>("userEmail", "Email Pengguna", {
      width: "w-52",
    }),
    createTextColumn<Audit>("description", "Deskripsi", { width: "w-72" }),
    createDateColumn<Audit>("createdAt", "Waktu", {
      format: "dd/MM/yyyy HH:mm",
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
