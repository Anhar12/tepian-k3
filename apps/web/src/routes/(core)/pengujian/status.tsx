import { OrderDetailSkeleton } from "@/components/order-detail-skeleton";
import { OrderTimeline } from "@/components/order-timeline";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Download, FileText } from "lucide-react";
import z from "zod";

export const Route = createFileRoute("/(core)/pengujian/status")({
  beforeLoad: async ({ search }) => {
    // check if orderId exists
    if (!search.orderId) {
      throw redirect({
        to: "/pengujian",
      });
    }
  },
  validateSearch: z.object({
    orderId: z.uuidv7(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { orderId } = Route.useSearch();

  const { data: orderDetail, isLoading } = useQuery(
    trpc.order.getOrderById.queryOptions({
      orderId,
    }),
  );

  if (isLoading || !orderDetail) {
    return <OrderDetailSkeleton />;
  }

  return (
    <Card className="container min-h-[calc(100vh-8rem)] pt-0">
      {/* Header Badge */}
      <div>
        <span className="inline-block rounded-md rounded-tr-none rounded-bl-none bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white">
          Layanan Pengujian
        </span>
      </div>

      {/* Main Content Grid */}
      <div className="flex gap-6 px-6">
        {/* Timeline Section - Left Side */}
        <OrderTimeline history={orderDetail?.statusHistory ?? []} />

        {/* Content Card - Right Side */}
        <Card className="flex-1 rounded-2xl p-6 shadow-sm">
          <div className="flex h-full flex-col">
            {/* Card Content */}
            <div className="flex-1">
              <h2 className="mb-2 text-xl font-semibold text-foreground">
                Penawaran diterbitkan
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Penawaran telah diterbitkan, disetujui penawaran untuk
                melanjutkan ke tahap pembayaran.
              </p>

              {/* Document Download Card */}
              <div className="inline-flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <span className="min-w-30 font-medium text-foreground">
                  Dokumen
                </span>
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-lg bg-blue-500 hover:bg-blue-600"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons - Bottom Right */}
            <div className="mt-8 flex justify-end gap-3 pt-6">
              <Button
                variant="outline"
                className="min-w-30 border-red-400 bg-red-50 text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                batal
              </Button>
              <Button
                variant="outline"
                className="min-w-30 border-amber-400 bg-amber-50 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
              >
                Revisi
              </Button>
              <Button className="min-w-30 bg-amber-400 text-white hover:bg-amber-500">
                Setuju
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Card>
  );
}
