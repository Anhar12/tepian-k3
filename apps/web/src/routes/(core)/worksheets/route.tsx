import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { WorksheetHeader } from "@/components/worksheet-header";
import { WorksheetSidebar } from "@/components/worksheet-sidebar";
import { requirePermission } from "@/utils/require-permission";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import z from "zod";

export const Route = createFileRoute("/(core)/worksheets")({
  validateSearch: z.object({
    worksheetId: z.uuidv7(),
    tabs: z
      .enum(["parameter", "jadwal-personil", "detail-transaksi"])
      .default("parameter"),
  }),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: "worksheets.view",
    }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <WorksheetSidebar variant="inset" />
      <SidebarInset className="overflow-hidden contain-inline-size">
        <WorksheetHeader />
        <div className="overflow-y-auto p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
