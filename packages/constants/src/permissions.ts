import type { Resource, ResourceConfig } from "./resources";
import { RESOURCES } from "./resources";

/**
 * Base actions available on every resource (standard CRUD).
 */
export const PERMISSION_BASE_ACTION = [
  "view",
  "create",
  "read",
  "update",
  "delete",
] as const;

/**
 * Approval / workflow actions. These are opt-in per resource via the
 * `approvalActions` field on each entry in {@link RESOURCES} — a resource only
 * receives these permissions when it explicitly enables them.
 */
export const PERMISSION_APPROVAL_ACTION = [
  "review",
  "verify",
  "approve",
  "reject",
] as const;

/**
 * Full, flat list of every permission action (base + approval).
 *
 * Kept as a single tuple so the database `action` pgEnum and the
 * {@link PermissionAction} type continue to cover all possible actions,
 * regardless of which resources actually enable each approval action.
 */
export const PERMISSION_ACTION = [
  ...PERMISSION_BASE_ACTION,
  ...PERMISSION_APPROVAL_ACTION,
] as const;

export type PermissionAction = (typeof PERMISSION_ACTION)[number];
export type PermissionBaseAction = (typeof PERMISSION_BASE_ACTION)[number];
export type PermissionApprovalAction =
  (typeof PERMISSION_APPROVAL_ACTION)[number];

/**
 * Resolve the approval actions enabled for a given resource.
 *
 * @param resource - The resource key
 * @returns The approval actions enabled for that resource (empty when none,
 *   the full approval list when the resource is configured with `"all"`)
 */
export function getResourceApprovalActions(
  resource: Resource,
): readonly PermissionApprovalAction[] {
  const config: ResourceConfig | undefined = RESOURCES.find(
    (r) => r.key === resource,
  );
  if (!config || !config.approvalActions) return [];
  return config.approvalActions === "all"
    ? PERMISSION_APPROVAL_ACTION
    : config.approvalActions;
}

/**
 * Get every action enabled for a resource: the base CRUD actions plus any
 * approval actions the resource opts into.
 *
 * @param resource - The resource key
 * @returns The actions enabled for that resource
 */
export function getResourceActions(resource: Resource): PermissionAction[] {
  return [...PERMISSION_BASE_ACTION, ...getResourceApprovalActions(resource)];
}

/**
 * Type-safe permission string in the format "resource.action"
 * Examples: "users.read", "orders.create", "documents.update"
 */
export type Permission = `${Resource}.${PermissionAction}`;

/**
 * Generate all permissions enabled for a given resource (base actions plus any
 * approval actions the resource opts into).
 * @param resource - The resource name
 * @returns Array of all permissions for that resource
 */
export function getResourcePermissions(resource: Resource): Permission[] {
  return getResourceActions(resource).map(
    (action) => `${resource}.${action}` as Permission,
  );
}

/**
 * Generate all permissions for every resource.
 *
 * Each resource contributes its base CRUD actions plus the approval actions it
 * enables via {@link RESOURCES}, so the total count depends on per-resource
 * configuration rather than a fixed multiplier.
 * @returns Array of all permissions across every resource
 */
export function getAllPermissions(): Permission[] {
  return RESOURCES.flatMap((resource) => getResourcePermissions(resource.key));
}

/**
 * Check if a permission string is valid
 * @param permission - The permission string to validate
 * @returns True if the permission is valid
 */
export function isValidPermission(
  permission: string,
): permission is Permission {
  const [resource, action] = permission.split(".") as [string, string];
  const config = RESOURCES.find((r) => r.key === resource);
  if (!config) return false;
  return getResourceActions(resource as Resource).includes(
    action as PermissionAction,
  );
}

/**
 * Parse a permission string into its resource and action components
 * @param permission - The permission string
 * @returns Object with resource and action, or null if invalid
 */
export function parsePermission(permission: Permission): {
  resource: Resource;
  action: PermissionAction;
} | null {
  const [resource, action] = permission.split(".") as [
    Resource,
    PermissionAction,
  ];
  if (!isValidPermission(permission)) {
    return null;
  }
  return { resource, action };
}

/**
 * Create a permission string from resource and action
 * @param resource - The resource name
 * @param action - The action name
 * @returns The permission string
 */
export function createPermission(
  resource: Resource,
  action: PermissionAction,
): Permission {
  return `${resource}.${action}`;
}

/**
 * Type-safe permission list for seeding (lazy-loaded to avoid initialization issues).
 * Each resource contributes its base CRUD actions plus the approval actions it
 * enables via {@link RESOURCES}.
 *
 * Note: Use getAllPermissions() function instead of importing this constant
 * to avoid circular dependency issues during module initialization.
 */

/**
 * Generate permission objects for database seeding
 * @returns Array of permission objects with name, resource, and action
 */
export function generatePermissionsList() {
  return RESOURCES.flatMap((resource) =>
    getResourceActions(resource.key).map((action) => ({
      name: `${resource.key}.${action}` as Permission,
      resource: resource.key,
      action,
    })),
  );
}
