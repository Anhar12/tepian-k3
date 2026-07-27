import type { ColumnDef } from "@tanstack/react-table";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@tepian-k3/api/root";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { createCompactDateColumn, createNumberColumn } from "@/lib/column-helpers";

type RouterOutput = inferRouterOutputs<AppRouter>;
export type PelatihanEnrollment =
  RouterOutput["pelatihan"]["order"]["getAllEnrollments"]["data"][number];

interface EnrollmentColumnsProps {
  currentPage: number;
  perPage: number;
}

/**
 * Returns status badge variant and label for enrollment status.
 */
function getEnrollmentStatusBadge(status: string) {
  const map: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    enrolled: { label: "Terdaftar", variant: "secondary" },
    in_progress: { label: "Sedang Berjalan", variant: "default" },
    completed: { label: "Selesai", variant: "default" },
    failed: { label: "Gagal", variant: "destructive" },
    expired: { label: "Kadaluarsa", variant: "outline" },
  };
  return map[status] ?? { label: status, variant: "secondary" };
}

/**
 * Columns definition for the Enrollment data table.
 *
 * @param currentPage - Current page number for row numbering
 * @param perPage - Items per page for row numbering
 */
export default function getEnrollmentColumns({
  currentPage,
  perPage,
}: EnrollmentColumnsProps): ColumnDef<PelatihanEnrollment>[] {
  return [
    createNumberColumn<PelatihanEnrollment>(currentPage, perPage),
    {
      accessorKey: "userName",
      header: "Peserta",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.userName}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.userEmail}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "pelatihanTitle",
      header: "Pelatihan",
      cell: ({ row }) => {
        const { label, variant } = getEnrollmentStatusBadge(row.original.status);
        return (
          <div className="flex flex-col gap-1.5 w-64">
            <span className="line-clamp-1 font-medium leading-tight">
              {row.original.pelatihanTitle}
            </span>
            <div className="flex gap-2 items-center mt-1">
              <Badge variant={variant} className="text-[10px] px-1.5 py-0 h-4 leading-none">{label}</Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 capitalize leading-none">
                {row.original.pelatihanLevel}
              </Badge>
            </div>
          </div>
        );
      },
    },
    {
      id: "progres_nilai",
      header: "Progres & Nilai",
      cell: ({ row }) => {
        const score = row.original.finalScore;
        const scoreNode = score !== null ? (
          <span className={score >= 70 ? "font-medium text-green-600" : "font-medium text-red-600"}>
            {score}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );

        return (
          <div className="flex flex-col gap-1 w-32">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progres</span>
              <span>{row.original.progressPercentage}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-primary transition-all"
                style={{ width: `${row.original.progressPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-muted-foreground">Nilai:</span>
              {scoreNode}
            </div>
          </div>
        );
      },
    },
    createCompactDateColumn<PelatihanEnrollment>("enrolledAt", "Tanggal Daftar"),
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const orderId = row.original.orderId;
        if (!orderId) {
          return (
            <span className="text-xs text-muted-foreground italic">
              Tanpa Order
            </span>
          );
        }
        return (
          <Button variant="ghost" size="sm" asChild>
            <Link
              to="/back-office/order-pelatihan/$orderId"
              params={{ orderId }}
            >
              <Eye className="mr-1 h-4 w-4" />
              Detail
            </Link>
          </Button>
        );
      },
    },
  ];
}
