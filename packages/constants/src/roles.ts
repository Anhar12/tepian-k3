import type { Permission } from "./permissions";
import { getResourcePermissions, getAllPermissions } from "./permissions";

/**
 * All system roles
 * Roles define groups of permissions for different user types
 */
export const ROLES = [
  "super_admin",
  "admin",
  "user",
  "employee",
  "lab_technician",
  "lab_manager",
  "viewer",
] as const;

export type Role = (typeof ROLES)[number];

/**
 * Role metadata including description
 */
export interface RoleMetadata {
  name: Role;
  description: string;
  permissions: Permission[];
}

/**
 * Role descriptions for UI and documentation
 */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: "Super Administrator with all system permissions",
  admin: "Administrator with full access to most features",
  user: "Regular user who can create orders and manage their company",
  employee: "Employee with basic access to testing workflow",
  lab_technician: "Laboratory technician who performs testing",
  lab_manager: "Laboratory manager who oversees testing operations",
  viewer: "Read-only access to view data without modifications",
};

/**
 * Default permissions for each role
 * These are the base permissions assigned when a role is created
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Super Admin: All permissions
  super_admin: getAllPermissions(),

  // Admin: All permissions except some system-level operations
  admin: getAllPermissions(),

  // Regular User: Company management, orders, and basic operations
  user: [
    // User can manage their own profile
    "users.view",
    "users.read",
    "users.update",

    // Company management
    ...getResourcePermissions("user-company"),
    ...getResourcePermissions("user-company-testing-location"),

    // Shopping and orders
    ...getResourcePermissions("cart"),
    "orders.view",
    "orders.create",
    "orders.read",

    // View testing parameters
    "parameters.view",
    "parameters.read",
    "parameter-categories.view",
    "parameter-categories.read",
    "clusters.view",
    "clusters.read",

    // View documents
    "documents.view",
    "documents.read",

    // Geography for location selection
    "provinces.view",
    "provinces.read",
    "regency.view",
    "regency.read",
    "district.view",
    "district.read",
    "village.view",
    "village.read",
    "kbli.view",
    "kbli.read",
  ],

  // Employee: Basic access
  employee: [
    "users.view",
    "users.read",
    "orders.view",
    "testing.view",
    "documents.view",
  ],

  // Lab Technician: Testing operations
  lab_technician: [
    // Can view and update testing
    "testing.view",
    "testing.read",
    "testing.update",
    "testing-item.view",
    "testing-item.read",
    "testing-item.update",

    // Can manage worksheets
    "worksheets.view",
    "worksheets.read",
    "worksheets.update",
    ...getResourcePermissions("worksheet-items"),
    ...getResourcePermissions("worksheet-tools"),
    ...getResourcePermissions("worksheet-notes"),

    // Can view tools and parameters
    "tools.view",
    "tools.read",
    "parameters.view",
    "parameters.read",
    "parameter-categories.view",
    "parameter-categories.read",

    // Can view orders
    "orders.view",
    "orders.read",

    // Can view documents
    "documents.view",
    "documents.read",
  ],

  // Lab Manager: Full testing management
  lab_manager: [
    // Full testing access
    ...getResourcePermissions("testing"),
    ...getResourcePermissions("testing-item"),

    // Full worksheet access
    ...getResourcePermissions("worksheets"),
    ...getResourcePermissions("worksheet-items"),
    ...getResourcePermissions("worksheet-tools"),
    ...getResourcePermissions("worksheet-notes"),
    ...getResourcePermissions("worksheet-assignments"),

    // Employee management
    ...getResourcePermissions("employees"),

    // Tools management
    ...getResourcePermissions("tools"),

    // Parameter access
    "parameters.view",
    "parameters.read",
    "parameter-categories.view",
    "parameter-categories.read",
    "clusters.view",
    "clusters.read",

    // Order management
    ...getResourcePermissions("orders"),
    ...getResourcePermissions("order-items"),
    "order-status-history.view",
    "order-status-history.read",

    // Document management
    "documents.view",
    "documents.read",
    "documents.create",
    "documents.update",
    ...getResourcePermissions("document-signature"),

    // Can view users
    "users.view",
    "users.read",
  ],

  // Viewer: Read-only access to most resources
  viewer: [
    "users.view",
    "roles.view",
    "permissions.view",
    "tools.view",
    "clusters.view",
    "parameter-categories.view",
    "parameters.view",
    "provinces.view",
    "regency.view",
    "district.view",
    "village.view",
    "kbli.view",
    "user-company.view",
    "cart.view",
    "orders.view",
    "testing.view",
    "documents.view",
    "audits.view",
    "employees.view",
    "worksheets.view",
  ],
};

/**
 * Check if a role name is valid
 * @param role - The role string to validate
 * @returns True if the role is valid
 */
export function isValidRole(role: string): role is Role {
  return ROLES.includes(role as Role);
}

/**
 * Get role metadata including permissions
 * @param role - The role name
 * @returns Role metadata with name, description, and permissions
 */
export function getRoleMetadata(role: Role): RoleMetadata {
  return {
    name: role,
    description: ROLE_DESCRIPTIONS[role],
    permissions: ROLE_PERMISSIONS[role],
  };
}

/**
 * Get all roles with their metadata
 * @returns Array of all role metadata
 */
export function getAllRolesMetadata(): RoleMetadata[] {
  return ROLES.map((role) => getRoleMetadata(role));
}

/**
 * Generate roles list for database seeding
 * @returns Array of role objects with name and description
 */
export function generateRolesList() {
  return ROLES.map((role) => ({
    name: role,
    description: ROLE_DESCRIPTIONS[role],
  }));
}

/**
 * Check if a user with given roles has a specific permission
 * Useful for permission checking that considers role hierarchies
 *
 * @param userRoles - Array of user's roles
 * @param requiredPermission - The permission to check
 * @returns True if any of the user's roles grants the permission
 */
export function hasRolePermission(
  userRoles: Role[],
  requiredPermission: Permission,
): boolean {
  return userRoles.some((role) =>
    ROLE_PERMISSIONS[role].includes(requiredPermission),
  );
}

/**
 * Get all permissions for a user based on their roles
 * Combines permissions from all assigned roles
 *
 * @param userRoles - Array of user's roles
 * @returns Deduplicated array of all permissions from all roles
 */
export function getCombinedRolePermissions(userRoles: Role[]): Permission[] {
  const permissionsSet = new Set<Permission>();

  for (const role of userRoles) {
    for (const permission of ROLE_PERMISSIONS[role]) {
      permissionsSet.add(permission);
    }
  }

  return Array.from(permissionsSet);
}
