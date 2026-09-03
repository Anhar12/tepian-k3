import { OrderListSkeleton } from "@/components/order-card-skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pageHead } from "@/utils/page-head";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  ORDER_STATUS,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@tepian-k3/constants";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import z from "zod";

export const Route = createFileRoute("/(core)/pengujian/transaksi")({
  validateSearch: z.object({
    tabs: z.enum(["all", ...ORDER_STATUS]).default("all"),
  }),
  head: () => pageHead("Pengujian - Transaksi"),
  component: RouteComponent,
});

const statusFilters: { label: string; value: OrderStatus | "all" }[] = [
  { label: "Semua", value: "all" },
  { label: "Menunggu", value: "pending" },
  { label: "Kaji Ulang", value: "kaji_ulang" },
  { label: "Penawaran", value: "penawaran_diterbitkan" },
  { label: "Persetujuan", value: "persetujuan_disetujui" },
  { label: "Pembayaran", value: "proses_validasi_pembayaran" },
  { label: "Pengujian", value: "proses_pengambilan_sampel" },
  { label: "Selesai", value: "completed" },
  { label: "Dibatalkan", value: "cancelled" },
];

function RouteComponent() {
  const { tabs } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: orders, isLoading } = useQuery(
    trpc.pengujian.order.getAllOrders.queryOptions({
      status: tabs,
    }),
  );

  return (
    <div className="mx-auto w-full px-4">
      {/* Header */}
      <div className="mb-2 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <h1 className="mb-1 text-xl font-bold text-foreground sm:text-2xl">
          Pesanan Aktif
        </h1>
        <p className="text-sm text-muted-foreground">
          Status pengujian yang sedang berjalan
        </p>
      </div>

      {/* Filters */}
      <Tabs
        value={tabs}
        onValueChange={(value) => {
          navigate({
            to: "/pengujian/transaksi",
            search: { tabs: value as OrderStatus | "all" },
          });
        }}
        className="mb-2 rounded-2xl border bg-white p-2 shadow-sm"
      >
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="flex w-full justify-between bg-white">
            {statusFilters.map((s) => (
              <TabsTrigger
                key={s.value}
                value={s.value}
                className="rounded-xl py-4 text-xs whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm sm:text-sm"
              >
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {/* Order List */}
      {isLoading ? (
        <OrderListSkeleton count={4} />
      ) : (
        <div className="rounded-2xl border bg-white px-5 shadow-sm sm:px-6">
          {!orders || orders?.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Tidak ada pesanan ditemukan
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-3 border-b border-slate-200 py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-bold text-foreground">
                    {order.orderNumber}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pesanan layanan pengujian
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span
                    className={cn(
                      "rounded-lg px-4 py-2 text-center text-xs font-semibold",
                      ORDER_STATUS_COLORS[order.status],
                    )}
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      navigate({
                        to: "/pengujian/status",
                        search: { orderId: order.id },
                      })
                    }
                    className="h-9 gap-2 border-primary px-3 text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    Cek Status <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
