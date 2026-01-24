import { trpc } from "@/utils/trpc";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(core)")({
  beforeLoad: async ({ context }) => {
    try {
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

      if (!user.emailVerified) {
        throw redirect({
          to: "/verify-email",
          search: {
            email: user.email,
          },
        });
      }

      return null;
    } catch (error) {
      // If it's already a redirect, re-throw it
      if (error && typeof error === "object" && "isRedirect" in error) {
        throw error;
      }

      // If auth.me fails (even after token refresh attempt), redirect to login
      throw redirect({ to: "/login" });
    }
  },
  component: () => <Outlet />,
});
