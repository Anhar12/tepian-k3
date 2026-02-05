import { OrderCard } from "@/components/order-card";
import { OrderListSkeleton } from "@/components/order-card-skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ORDER_STATUS, type OrderStatus } from "@tepian-k3/constants";
import z from "zod";

export const Route = createFileRoute("/(core)/pengujian/transaksi")({
  validateSearch: z.object({
    tabs: z.enum(["all", ...ORDER_STATUS]).default("all"),
  }),
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
    trpc.order.getAllOrders.queryOptions({
      status: tabs,
    }),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-1 text-xl font-bold text-foreground sm:text-2xl">
          Pesanan Saya
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola dan pantau status pesanan layanan pengujian Anda
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
        className="mb-6"
      >
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-max bg-white sm:w-auto">
            {statusFilters.map((s) => (
              <TabsTrigger
                key={s.value}
                value={s.value}
                className="text-xs whitespace-nowrap sm:text-sm"
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
        <div className="flex flex-col gap-3">
          {!orders || orders?.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Tidak ada pesanan ditemukan
            </div>
          ) : (
            orders.map((order) => <OrderCard key={order.id} order={order} />)
          )}
        </div>
      )}
    </div>
  );
}
