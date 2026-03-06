import { redirect } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@tepian-k3/api/root";
import type { Role } from "@tepian-k3/constants";

interface RequireRolesOptions {
  /** Single role or array of roles to check */
  role: Role | Role[];
  /** If true, user must have ALL roles. If false, user needs at least ONE role */
  requireAll?: boolean;
  /** Redirect path if role check fails (defaults to /unauthorized) */
  redirectTo?: string;
}

interface RouteContext {
  queryClient: QueryClient;
  trpc: TRPCOptionsProxy<AppRouter>;
}

/**
 * Check if user has required role(s) in route beforeLoad.
 * Throws a redirect if role check fails.
 *
 * @example
 * beforeLoad: async ({ context }) => {
 *   await requireRoles(context, { role: "equipment_officer" });
 * }
 *
 * @example Multiple roles (need at least one)
 * beforeLoad: async ({ context }) => {
 *   await requireRoles(context, { role: ["equipment_officer", "lab_manager"] });
 * }
 *
 * @example Multiple roles (need all)
 * beforeLoad: async ({ context }) => {
 *   await requireRoles(context, {
 *     role: ["equipment_officer", "employee"],
 *     requireAll: true
 *   });
 * }
 */
export async function requireRoles(
  context: RouteContext,
  options: RequireRolesOptions,
): Promise<void> {
  const { role, requireAll = false, redirectTo = "/unauthorized" } = options;

  const profile = await context.queryClient.ensureQueryData({
    ...context.trpc.platform.auth.profile.queryOptions(),
    // 5 minutes cache
    staleTime: 1000 * 60 * 5,
    // Keep in cache for 30 minutes (even if unused)
    gcTime: 1000 * 60 * 30,
  });

  const roles = Array.isArray(role) ? role : [role];

  const hasRole = requireAll
    ? roles.every((r) => profile.roles.some((pr) => pr.name === r))
    : roles.some((r) => profile.roles.some((pr) => pr.name === r));

  if (!hasRole) {
    throw redirect({ to: redirectTo });
  }
}
