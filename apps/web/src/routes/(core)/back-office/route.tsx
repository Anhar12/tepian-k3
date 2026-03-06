import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireRoles } from "@/utils/require-roles";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BACK_OFFICE_ROLES, EMPLOYEE_ROLES } from "@tepian-k3/constants";

// Auth + email verification is handled by parent (core) route
export const Route = createFileRoute("/(core)/back-office")({
  beforeLoad: async ({ context }) => {
    await requireRoles(context, {
      role: [...BACK_OFFICE_ROLES, ...EMPLOYEE_ROLES],
    });
  },
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
      <AppSidebar variant="inset" />
      <SidebarInset className="overflow-hidden contain-inline-size">
        <SiteHeader />
        <div className="overflow-y-auto p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
