import MainHeader from "@/components/main-header";
import { trpc } from "@/utils/trpc";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(core)")({
  beforeLoad: async ({ context }) => {
    // Attempt to fetch user data
    const user = await context.queryClient.ensureQueryData({
      ...trpc.auth.me.queryOptions(),
      // 5 minutes cache
      staleTime: 1000 * 60 * 5,
    });

    if (!user) {
      throw redirect({ to: "/login" });
    }

    if (user && !user.emailVerified) {
      throw redirect({ to: "/verify-email" });
    }

    return null;
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <Outlet />
    </>
  );
}
