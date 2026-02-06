import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { authMeQueryOptions } from "@/utils/auth-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

// Auth + email verification is handled by parent (core) route
export const Route = createFileRoute("/(core)/back-office")({
  beforeLoad: async ({ context }) => {
    // User is guaranteed authenticated by parent route, just check role
    const user =
      await context.queryClient.ensureQueryData(authMeQueryOptions());

    // Prevent regular users from accessing back office
    const hasUserRole = user?.roles.some((role) => role.name === "user");
    if (hasUserRole) {
      throw redirect({ to: "/unauthorized" });
    }

    return null;
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
