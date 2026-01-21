import type { ColumnDef } from "@tanstack/react-table";
import {
  createActionColumn,
  createDateColumn,
  createNumberColumn,
  createTextColumn,
} from "@/lib/column-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { PaginatedOrder } from "@tepian-k3/types/order.types";
import { PermissionGate } from "@/components/permission-gate";

interface OrdersColumnsProps {
  currentPage: number;
  perPage: number;
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    approved: "bg-green-100 text-green-800 hover:bg-green-100",
    rejected: "bg-red-100 text-red-800 hover:bg-red-100",
    in_progress: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    completed: "bg-purple-100 text-purple-800 hover:bg-purple-100",
    cancelled: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  };
  return colors[status] || "bg-gray-100 text-gray-800 hover:bg-gray-100";
};

const getPaymentStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    unpaid: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    paid: "bg-green-100 text-green-800 hover:bg-green-100",
    refunded: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    failed: "bg-red-100 text-red-800 hover:bg-red-100",
  };
  return colors[status] || "bg-gray-100 text-gray-800 hover:bg-gray-100";
};

const getApprovalStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    approved: "bg-green-100 text-green-800 hover:bg-green-100",
    rejected: "bg-red-100 text-red-800 hover:bg-red-100",
  };
  return colors[status] || "bg-gray-100 text-gray-800 hover:bg-gray-100";
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: "Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
    in_progress: "Dalam Proses",
    completed: "Selesai",
    cancelled: "Dibatalkan",
    unpaid: "Belum Bayar",
    paid: "Lunas",
    refunded: "Dikembalikan",
    failed: "Gagal",
  };
  return labels[status] || status;
};

export default function getOrdersColumns({
  currentPage,
  perPage,
}: OrdersColumnsProps): ColumnDef<PaginatedOrder>[] {
  return [
    createNumberColumn<PaginatedOrder>(currentPage, perPage),
    createTextColumn<PaginatedOrder>("orderNumber", "Nomor Order", {
      width: "w-40",
      enableFilter: true,
      placeholder: "Cari nomor order...",
    }),
    {
      accessorKey: "company.name",
      header: "Perusahaan",
      cell: ({ row }) => (
        <div className="w-48 truncate">{row.original.company.name}</div>
      ),
    },
    {
      accessorKey: "user.name",
      header: "Customer",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.user.name}</span>
          <span className="text-sm text-muted-foreground">
            {row.original.user.email}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={cn(getStatusColor(row.original.status))}>
          {getStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      accessorKey: "approvalStatus",
      header: "Approval",
      cell: ({ row }) => (
        <Badge
          className={cn(getApprovalStatusColor(row.original.approvalStatus))}
        >
          {getStatusLabel(row.original.approvalStatus)}
        </Badge>
      ),
    },
    {
      accessorKey: "paymentStatus",
      header: "Pembayaran",
      cell: ({ row }) => (
        <Badge
          className={cn(getPaymentStatusColor(row.original.paymentStatus))}
        >
          {getStatusLabel(row.original.paymentStatus)}
        </Badge>
      ),
    },
    {
      accessorKey: "testing",
      header: "Testing",
      cell: ({ row }) => {
        if (!row.original.testing) {
          return (
            <Badge variant="outline" className="text-muted-foreground">
              Belum dibuat
            </Badge>
          );
        }
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {row.original.testing.testingNumber}
            </span>
            <Badge
              className={cn(
                "mt-1 w-fit",
                getStatusColor(row.original.testing.status),
              )}
            >
              {getStatusLabel(row.original.testing.status)}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "totalAmount",
      header: "Total",
      cell: ({ row }) => (
        <div className="text-right font-medium">
          Rp {row.original.totalAmount.toLocaleString("id-ID")}
        </div>
      ),
    },
    createDateColumn<PaginatedOrder>("createdAt", "Tanggal Order"),
    createActionColumn<PaginatedOrder>(({ row }) => (
      <PermissionGate permission="orders.read">
        <Link
          to="/back-office/orders/$orderId/detail"
          params={{ orderId: row.original.id }}
        >
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
      </PermissionGate>
    )),
  ];
}
