import type { Permission } from "@tepian-k3/constants";
import { useUserProfile } from "./use-user-profile";

/**
 * Returns helpers for checking the current user's permissions.
 *
 * Builds on top of {@link useUserProfile} so the underlying query is shared
 * and deduplicated across the component tree.
 *
 * @example
 * ```ts
 * const { hasPermission, hasAnyPermission } = usePermissions();
 *
 * if (hasPermission("worksheets-transaction-details.read")) {
 *   navigate({ to: "/worksheets/detail-transaksi", ... });
 * }
 * ```
 */
export function usePermissions() {
  const { profile, isLoading } = useUserProfile();
  const permissions = profile?.permissions ?? [];

  return {
    /** Raw permissions array from the JWT profile. */
    permissions,
    isLoading,
    /** Returns true if the user has the given permission. */
    hasPermission: (permission: Permission) => permissions.includes(permission),
    /** Returns true if the user has at least one of the given permissions. */
    hasAnyPermission: (perms: Permission[]) =>
      perms.some((p) => permissions.includes(p)),
    /** Returns true if the user has every one of the given permissions. */
    hasAllPermissions: (perms: Permission[]) =>
      perms.every((p) => permissions.includes(p)),
  };
}
