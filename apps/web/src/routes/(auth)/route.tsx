import { trpc } from "@/utils/trpc";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)")({
  beforeLoad: async ({ context }) => {
    // Attempt to fetch user data
    const user = await context.queryClient.ensureQueryData({
      ...trpc.auth.me.queryOptions(),
      // 5 minutes cache
      staleTime: 1000 * 60 * 5,
    });

    if (user) {
      throw redirect({ to: "/dashboard" });
    }

    return null;
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
