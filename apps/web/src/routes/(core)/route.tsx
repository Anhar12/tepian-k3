import { AppSidebar } from "@/components/app-sidebar";
import MainHeader from "@/components/main-header";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { trpc } from "@/utils/trpc";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(core)")({
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

    return null;
  },
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(trpc.auth.profile.queryOptions()),
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
      <SidebarInset>
        <SiteHeader />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
