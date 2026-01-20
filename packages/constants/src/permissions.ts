import type { Resource } from "./resources";
import { RESOURCES } from "./resources";

// Define PERMISSION_ACTION locally to avoid circular imports
export const PERMISSION_ACTION = [
  "view",
  "create",
  "read",
  "update",
  "delete",
  "review",
] as const;

export type PermissionAction = (typeof PERMISSION_ACTION)[number];

/**
 * Type-safe permission string in the format "resource.action"
 * Examples: "users.read", "orders.create", "documents.update"
 */
export type Permission = `${Resource}.${PermissionAction}`;

/**
 * Generate all possible permissions for a given resource
 * @param resource - The resource name
 * @returns Array of all permissions for that resource
 */
export function getResourcePermissions(resource: Resource): Permission[] {
  return PERMISSION_ACTION.map(
    (action) => `${resource}.${action}` as Permission,
  );
}

/**
 * Generate all possible permissions for all resources
 * @returns Array of all 165 permissions (33 resources × 5 actions)
 */
export function getAllPermissions(): Permission[] {
  return RESOURCES.flatMap((resource) => getResourcePermissions(resource));
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
  return (
    RESOURCES.includes(resource as Resource) &&
    PERMISSION_ACTION.includes(action as PermissionAction)
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
 * Type-safe permission list for seeding (lazy-loaded to avoid initialization issues)
 * Each resource has: view, create, read, update, delete
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
    PERMISSION_ACTION.map((action) => ({
      name: `${resource}.${action}` as Permission,
      resource,
      action,
    })),
  );
}
