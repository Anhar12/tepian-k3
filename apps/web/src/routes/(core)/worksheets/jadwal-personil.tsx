import { WorksheetHeaderCard } from "@/components/worksheet-header-card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(core)/worksheets/jadwal-personil")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-4">
      <WorksheetHeaderCard
        title="Jadwal Personil"
        subtitle="Penjadwalan dan penugasan personel pengujian"
      />
    </div>
  );
}
