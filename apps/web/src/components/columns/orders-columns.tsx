import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MaskedText } from "@/components/ui/masked-text";
import {
  createCompactDateColumn,
  createNumberColumn,
  createTextColumn,
} from "@/lib/column-helpers";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { PaginatedOrder } from "@tepian-k3/types/pengujian/order.types";
import { Clock, FileSpreadsheet, FileArchive } from "lucide-react";

interface OrdersColumnsProps {
  currentPage: number;
  perPage: number;
  onOpenAuditModal?: (orderId: string) => void;
  onDownloadExcel?: (orderId: string) => void;
  onDownloadZip?: (orderId: string) => void;
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
  onOpenAuditModal,
  onDownloadExcel,
  onDownloadZip,
}: OrdersColumnsProps): ColumnDef<PaginatedOrder>[] {
  return [
    createNumberColumn<PaginatedOrder>(currentPage, perPage),
    createTextColumn<PaginatedOrder>("orderNumber", "Nomor Order", {
      width: "w-40",
      enableFilter: true,
      placeholder: "Cari nomor order...",
      cellRenderer: (_, row) => (
        <Link
          className="hover:underline"
          to="/back-office/orders/$orderId/detail"
          params={{ orderId: row.original.id }}
        >
          <Button
            variant="link"
            size="sm"
            className="p-0 text-primary hover:cursor-pointer"
          >
            {row.original.orderNumber}
          </Button>
        </Link>
      ),
    }),
    {
      id: "company_customer",
      header: "Perusahaan / Customer",
      cell: ({ row }) => {
        const companyName = row.original.company?.name;
        const userName = row.original.user.name;
        const userEmail = row.original.user.email;

        return (
          <div className="flex w-48 min-w-0 flex-col">
            <span
              className="truncate font-medium"
              title={companyName || userName}
            >
              {companyName || userName}
            </span>
            <MaskedText
              value={companyName ? userName : userEmail}
              maskType={companyName ? "name" : "email"}
              className="w-full text-xs text-muted-foreground"
            />
          </div>
        );
      },
    },
    {
      id: "status_lengkap",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex w-32 flex-col gap-1">
          <Badge
            className={cn(
              getStatusColor(row.original.status),
              "w-fit px-1.5 py-0 text-[10px] tracking-wider uppercase",
            )}
          >
            {getStatusLabel(row.original.status)}
          </Badge>
          <Badge
            className={cn(
              getApprovalStatusColor(row.original.approvalStatus),
              "w-fit px-1.5 py-0 text-[10px] tracking-wider uppercase",
            )}
          >
            APRV: {getStatusLabel(row.original.approvalStatus)}
          </Badge>
          <Badge
            className={cn(
              getPaymentStatusColor(row.original.paymentStatus),
              "w-fit px-1.5 py-0 text-[10px] tracking-wider uppercase",
            )}
          >
            PAY: {getStatusLabel(row.original.paymentStatus)}
          </Badge>
        </div>
      ),
    },
    // {
    //   accessorKey: "testing",
    //   header: "Testing",
    //   cell: ({ row }) => {
    //     if (!row.original.testing) {
    //       return (
    //         <Badge variant="outline" className="text-muted-foreground">
    //           Belum dibuat
    //         </Badge>
    //       );
    //     }
    //     return (
    //       <div className="flex flex-col">
    //         <span className="text-sm font-medium">
    //           {row.original.testing.testingNumber}
    //         </span>
    //         <Badge
    //           className={cn(
    //             "mt-1 w-fit",
    //             getStatusColor(row.original.testing.status),
    //           )}
    //         >
    //           {getStatusLabel(row.original.testing.status)}
    //         </Badge>
    //       </div>
    //     );
    //   },
    // },
    {
      accessorKey: "totalAmount",
      header: "Total",
      cell: ({ row }) => (
        <div className="text-right font-medium">
          Rp {row.original.totalAmount.toLocaleString("id-ID")}
        </div>
      ),
    },
    createCompactDateColumn<PaginatedOrder>("createdAt", "Tanggal Order"),
    {
      id: "audit_actions",
      header: () => <div className="text-center">Audit &amp; Export</div>,
      cell: ({ row }) => {
        const orderId = row.original.id;
        return (
          <div className="flex items-center justify-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              title="Preview Audit Trail & Durasi"
              onClick={() => onOpenAuditModal?.(orderId)}
            >
              <Clock className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              title="Export Rekap Excel (.xlsx)"
              onClick={() => onDownloadExcel?.(orderId)}
            >
              <FileSpreadsheet className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
              title="Download Bundle Dokumen (.zip)"
              onClick={() => onDownloadZip?.(orderId)}
            >
              <FileArchive className="size-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}
