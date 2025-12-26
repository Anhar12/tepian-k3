import { trpc } from "@/utils/trpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

interface PermissionGateProps {
  /** Single permission or array of permissions to check */
  permission: string | string[];
  /** If true, user must have ALL permissions. If false, user needs at least ONE permission */
  requireAll?: boolean;
  /** Content to render if user has permission */
  children: ReactNode;
  /** Optional fallback content if user doesn't have permission */
  fallback?: ReactNode;
}

export function PermissionGate({
  permission,
  requireAll = false,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { data: profile } = useSuspenseQuery(trpc.auth.profile.queryOptions());

  const permissions = Array.isArray(permission) ? permission : [permission];

  const hasPermission = requireAll
    ? permissions.every((p) => profile.permissions.includes(p))
    : permissions.some((p) => profile.permissions.includes(p));

  if (!hasPermission) {
    return fallback;
  }

  return children;
}
