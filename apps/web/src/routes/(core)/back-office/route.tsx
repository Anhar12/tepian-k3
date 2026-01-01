import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { trpc } from "@/utils/trpc";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(core)/back-office")({
  beforeLoad: async ({ context }) => {
    // Attempt to fetch user data
    const user = await context.queryClient.ensureQueryData({
      ...trpc.auth.me.queryOptions(),
      // 5 minutes cache
      staleTime: 1000 * 60 * 5,
      // Keep in cache for 30 minutes (even if unused)
      gcTime: 1000 * 60 * 30,
    });

    if (!user) {
      throw redirect({ to: "/login" });
    }

    if (user && !user.emailVerified) {
      throw redirect({
        to: "/verify-email",
        search: {
          email: user.email,
        },
      });
    }

    // Prevent regular users from accessing back office
    const hasUserRole = user.roles.some((role) => role.name === "user");
    if (hasUserRole) {
      throw redirect({ to: "/dashboard" });
    }

    return null;
  },
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      ...trpc.auth.me.queryOptions(),
      // 5 minutes cache
      staleTime: 1000 * 60 * 5,
      // Keep in cache for 30 minutes (even if unused)
      gcTime: 1000 * 60 * 30,
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
