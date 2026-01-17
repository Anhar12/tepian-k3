import { WorksheetHeaderCard } from "@/components/worksheet-header-card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(core)/worksheets/detail-transaksi")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-4">
      <WorksheetHeaderCard
        title="Detail Transaksi"
        subtitle="Rincian biaya parameter dan operasional pengujian"
      />
    </div>
  );
}
