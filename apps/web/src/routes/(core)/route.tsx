import { authMeQueryOptions } from "@/utils/auth-query";
import { useOnOrderStatusChangedSubscription } from "@/hooks/use-notification-subscription";
import { trpc } from "@/utils/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(core)")({
  beforeLoad: async ({ context }) => {
    try {
      // Attempt to fetch user data
      const user =
        await context.queryClient.ensureQueryData(authMeQueryOptions());

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
  component: CoreLayout,
});

/**
 * Root layout for all authenticated (core) routes.
 * Runs a single order-status subscription for the entire authenticated session,
 * so notifications and query invalidations fire exactly once regardless of how
 * many navbar instances are rendered.
 */
function CoreLayout() {
  const queryClient = useQueryClient();

  useOnOrderStatusChangedSubscription({
    showToast: true,
    onNotification: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.platform.notifications.getUnreadCount.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.platform.notifications.getAll.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.pengujian.order.getAllOrders.queryKey(),
      });
    },
  });

  return <Outlet />;
}
