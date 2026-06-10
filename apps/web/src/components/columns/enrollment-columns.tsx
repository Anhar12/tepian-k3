import type { ColumnDef } from "@tanstack/react-table";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@tepian-k3/api/root";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { createDateColumn, createNumberColumn } from "@/lib/column-helpers";

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
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="line-clamp-1 font-medium">
            {row.original.pelatihanTitle}
          </span>
          <Badge variant="outline" className="mt-1 w-fit text-xs capitalize">
            {row.original.pelatihanLevel}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const { label, variant } = getEnrollmentStatusBadge(
          row.original.status,
        );
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      accessorKey: "progressPercentage",
      header: "Progres",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-2 w-20 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${row.original.progressPercentage}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {row.original.progressPercentage}%
          </span>
        </div>
      ),
    },
    {
      accessorKey: "finalScore",
      header: "Nilai Akhir",
      cell: ({ row }) => {
        const score = row.original.finalScore;
        return score !== null ? (
          <span
            className={
              score >= 70
                ? "font-medium text-green-600"
                : "font-medium text-red-600"
            }
          >
            {score}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    createDateColumn<PelatihanEnrollment>("enrolledAt", "Tanggal Daftar"),
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
