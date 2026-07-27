import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, type OrderStatus } from "@tepian-k3/constants";

interface RoleDashboardWidgetProps {
  roles?: any[];
  orders: any[];
}

export function RoleDashboardWidget({ roles = [], orders }: RoleDashboardWidgetProps) {
  // Determine widget config based on roles
  let widgetTitle = "Antrean Tindakan";
  let widgetDescription = "Pesanan yang membutuhkan perhatian Anda";
  let targetStatuses: OrderStatus[] = ["pending"];

  const roleNames = roles.map(r => typeof r === 'string' ? r : r.name || r.roleName);

  if (roleNames.includes("admin") || roleNames.includes("super_admin")) {
    widgetTitle = "Antrean Verifikasi Administrasi";
    targetStatuses = ["pending", "upload_surat_persetujuan", "proses_validasi_pembayaran"];
  } else if (roleNames.includes("kaji_ulang")) {
    widgetTitle = "Antrean Kaji Ulang";
    targetStatuses = ["kaji_ulang"];
  } else if (roleNames.includes("koordinator_pengujian")) {
    widgetTitle = "Verifikasi Hasil Kaji Ulang";
    targetStatuses = ["kaji_ulang_disetujui"];
  } else if (roleNames.includes("koordinator_administrasi")) {
    widgetTitle = "Penerbitan Penawaran & SPK";
    targetStatuses = ["penawaran_diterbitkan", "persetujuan_disetujui"];
  } else if (roleNames.includes("bendahara")) {
    widgetTitle = "Validasi Pembayaran";
    targetStatuses = ["proses_validasi_pembayaran"];
  } else if (roleNames.includes("tim_penjadwalan")) {
    widgetTitle = "Penjadwalan & Personel";
    targetStatuses = ["pembayaran_diterima", "menunggu_penerbitan_spt_jadwal"];
  } else if (roleNames.includes("petugas_koding")) {
    widgetTitle = "Input Kode Billing";
    targetStatuses = ["persetujuan_disetujui"];
  } else if (roleNames.includes("kepala_balai")) {
    widgetTitle = "Persetujuan Surat Penawaran";
    widgetDescription = "Surat penawaran yang membutuhkan persetujuan/approval Kepala Balai";
    targetStatuses = ["penawaran_review"];
  } else if (roleNames.includes("koordinator_mutu")) {
    widgetTitle = "Supervisi Mutu Laboratorium";
    targetStatuses = ["pending"]; // koordinator_mutu needs to track worksheets rather than orders natively in this widget or we map to pending for layout
  } else if (roleNames.includes("viewer")) {
    widgetTitle = "Pantauan Seluruh Pengujian";
    targetStatuses = ["pending", "proses_pengambilan_sampel", "menunggu_penerbitan_spt_jadwal"];
  } else {
    // Default fallback
    targetStatuses = ["pending", "kaji_ulang"];
  }

  // Filter orders
  const pendingOrders = orders.filter((o) => targetStatuses.includes(o.status));

  // If we have actual orders, use them. Otherwise fallback to mock data for layout preview if empty.
  // We'll show empty state instead of mock if it's genuinely empty.
  const displayedQueue = pendingOrders.slice(0, 5);

  return (
    <Card className="mb-8 overflow-hidden border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-neutral-800">
            {widgetTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{widgetDescription}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white font-['Poppins'] font-medium text-neutral-600 shadow-sm hover:bg-slate-50"
          >
            <Link
              to="/back-office/orders"
              search={{
                page: 1,
                perPage: 10,
                sort: [{ id: "createdAt" as const, desc: true }],
                createdAt: [],
                filters: [],
                joinOperator: "and" as const,
                showDeleted: false,
                search: "",
                status: targetStatuses[0] as OrderStatus,
              }}
            >
              Lihat semua
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 12L10 8L6 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </Button>
        </div>
      </div>

      <CardContent className="overflow-x-auto p-0">
        {displayedQueue.length > 0 ? (
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-sm font-semibold text-neutral-600">
                  Nomor Order
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-neutral-600">
                  Perusahaan
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-neutral-600">
                  Tanggal Order
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-neutral-600">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-600">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedQueue.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-slate-50/50"
                >
                  <td className="px-6 py-4 text-xs font-semibold whitespace-nowrap text-neutral-600">
                    {row.orderNumber}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium whitespace-nowrap text-neutral-500">
                    {row.company?.name || "-"}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium whitespace-nowrap text-neutral-500">
                    {new Date(row.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      className={cn(
                        "px-2.5 py-0.5 text-[10px] font-semibold",
                        ORDER_STATUS_COLORS[row.status as OrderStatus] ||
                          "bg-gray-100 text-gray-800"
                      )}
                    >
                      {ORDER_STATUS_LABELS[row.status as OrderStatus] ||
                        row.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="hover:text-primary-focus cursor-pointer text-primary"
                    >
                      <Link
                        to="/back-office/orders/$orderId/detail"
                        params={{ orderId: row.id }}
                      >
                        Proses
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 rounded-full bg-slate-100 p-3">
              <svg
                className="h-6 w-6 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-500">Tidak ada antrean tugas saat ini.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
