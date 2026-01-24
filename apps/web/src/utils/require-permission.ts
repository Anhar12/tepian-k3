import { redirect } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@tepian-k3/api/root";
import type { Permission } from "@tepian-k3/constants";

interface RequirePermissionOptions {
  /** Single permission or array of permissions to check */
  permission: Permission | Permission[];
  /** If true, user must have ALL permissions. If false, user needs at least ONE permission */
  requireAll?: boolean;
  /** Redirect path if permission check fails (defaults to /unauthorized) */
  redirectTo?: string;
}

interface RouteContext {
  queryClient: QueryClient;
  trpc: TRPCOptionsProxy<AppRouter>;
}

/**
 * Check if user has required permission(s) in route beforeLoad
 * Throws a redirect if permission check fails
 *
 * @example
 * beforeLoad: async ({ context }) => {
 *   await requirePermission(context, { permission: "user.create" });
 * }
 *
 * @example Multiple permissions (need at least one)
 * beforeLoad: async ({ context }) => {
 *   await requirePermission(context, { permission: ["user.create", "user.update"] });
 * }
 *
 * @example Multiple permissions (need all)
 * beforeLoad: async ({ context }) => {
 *   await requirePermission(context, {
 *     permission: ["user.create", "admin.access"],
 *     requireAll: true
 *   });
 * }
 */
export async function requirePermission(
  context: RouteContext,
  options: RequirePermissionOptions,
): Promise<void> {
  const {
    permission,
    requireAll = false,
    redirectTo = "/unauthorized",
  } = options;

  const profile = await context.queryClient.ensureQueryData({
    ...context.trpc.auth.profile.queryOptions(),
    // 5 minutes cache
    staleTime: 1000 * 60 * 5,
    // Keep in cache for 30 minutes (even if unused)
    gcTime: 1000 * 60 * 30,
  });

  const permissions = Array.isArray(permission) ? permission : [permission];

  const hasPermission = requireAll
    ? permissions.every((p) => profile.permissions.includes(p))
    : permissions.some((p) => profile.permissions.includes(p));

  if (!hasPermission) {
    throw redirect({ to: redirectTo });
  }
}
