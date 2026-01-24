import { trpc } from "@/utils/trpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { Permission } from "@tepian-k3/constants";
import type { ReactNode } from "react";

interface ShowForProps {
  /** Show only for authenticated users */
  authenticated?: boolean;
  /** Show only for guest users */
  guest?: boolean;
  /** Required permissions (optional) */
  permission?: Permission | Permission[];
  /** If true, requires all permissions */
  requireAll?: boolean;
  /** Content to render */
  children: ReactNode;
  /** Fallback content */
  fallback?: ReactNode;
}

/**
 * Unified component for auth and permission-based rendering.
 * @example
 * ```tsx
 * <ShowFor authenticated>
 *   <UserMenu />
 * </ShowFor>
 *
 * <ShowFor guest>
 *   <LoginButton />
 * </ShowFor>
 *
 * <ShowFor authenticated permission="admin.access">
 *   <AdminPanel />
 * </ShowFor>
 * ```
 */
export function ShowFor({
  authenticated,
  guest,
  permission,
  requireAll = false,
  children,
  fallback = null,
}: ShowForProps) {
  const { data: profile } = useSuspenseQuery(trpc.auth.profile.queryOptions());

  const isAuthenticated = !!profile;

  // Check authentication requirement
  if (authenticated && !isAuthenticated) return fallback;
  if (guest && isAuthenticated) return fallback;

  // Check permissions if specified
  if (permission && isAuthenticated) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    const hasPermission = requireAll
      ? permissions.every((p) => profile.permissions.includes(p))
      : permissions.some((p) => profile.permissions.includes(p));

    if (!hasPermission) return fallback;
  }

  return children;
}
