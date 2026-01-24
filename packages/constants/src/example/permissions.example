/**
 * Type-Safe Permission System Examples
 *
 * This file demonstrates how to use the type-safe permission system
 * throughout the application.
 */

import type { Permission, Resource, PermissionAction } from "./index";
import {
  createPermission,
  getResourcePermissions,
  getAllPermissions,
  isValidPermission,
  parsePermission,
} from "./permissions";

// ============================================================
// 1. BASIC USAGE - Creating Permissions
// ============================================================

// ✅ Type-safe: TypeScript will autocomplete and validate
const userReadPermission: Permission = "users.read";
const orderCreatePermission: Permission = "orders.create";

// ❌ TypeScript error: invalid resource
// const invalid: Permission = "invalid-resource.read";

// ❌ TypeScript error: invalid action
// const invalid2: Permission = "users.invalid-action";

// ============================================================
// 2. DYNAMIC PERMISSION CREATION
// ============================================================

// Create permission dynamically with full type safety
const resource: Resource = "documents";
const action: PermissionAction = "update";
const dynamicPermission = createPermission(resource, action); // "documents.update"

// ============================================================
// 3. CHECKING PERMISSIONS IN MIDDLEWARE
// ============================================================

function hasPermission(
  userPermissions: string[],
  requiredPermission: Permission
): boolean {
  return userPermissions.includes(requiredPermission);
}

// Usage in route protection
const userPerms = ["users.view", "users.read", "orders.view"];
const canReadUsers = hasPermission(userPerms, "users.read"); // true
const canDeleteUsers = hasPermission(userPerms, "users.delete"); // false

// ============================================================
// 4. PERMISSION GROUPS FOR ROLES
// ============================================================

// Get all permissions for a resource
const allUserPermissions = getResourcePermissions("users");
// Returns: ["users.view", "users.create", "users.read", "users.update", "users.delete"]

const allOrderPermissions = getResourcePermissions("orders");
// Returns: ["orders.view", "orders.create", "orders.read", "orders.update", "orders.delete"]

// ============================================================
// 5. ROLE-BASED PERMISSION ASSIGNMENT
// ============================================================

// Define role permission sets
const ROLE_PERMISSIONS = {
  admin: getAllPermissions(), // All 165 permissions

  user: [
    ...getResourcePermissions("user-company"),
    ...getResourcePermissions("user-company-testing-location"),
    ...getResourcePermissions("cart"),
    "orders.view",
    "orders.create",
    "orders.read",
    "documents.view",
    "documents.read",
  ] as Permission[],

  lab_technician: [
    "testing.view",
    "testing.read",
    "testing.update",
    "testing-item.view",
    "testing-item.read",
    "testing-item.update",
    "worksheets.view",
    "worksheets.read",
    "worksheets.update",
    ...getResourcePermissions("worksheet-items"),
    ...getResourcePermissions("worksheet-tools"),
    ...getResourcePermissions("worksheet-notes"),
  ] as Permission[],

  lab_manager: [
    ...getResourcePermissions("testing"),
    ...getResourcePermissions("testing-item"),
    ...getResourcePermissions("worksheets"),
    ...getResourcePermissions("worksheet-items"),
    ...getResourcePermissions("worksheet-tools"),
    ...getResourcePermissions("worksheet-notes"),
    ...getResourcePermissions("worksheet-assignments"),
    ...getResourcePermissions("employees"),
    ...getResourcePermissions("tools"),
    "documents.view",
    "documents.read",
    "documents.create",
    "documents.update",
  ] as Permission[],

  viewer: [
    "users.view",
    "orders.view",
    "testing.view",
    "documents.view",
    "worksheets.view",
    "employees.view",
  ] as Permission[],
};

// ============================================================
// 6. VALIDATING PERMISSIONS AT RUNTIME
// ============================================================

function validatePermissionString(permission: string): Permission | null {
  if (isValidPermission(permission)) {
    return permission; // Now typed as Permission
  }
  console.error(`Invalid permission: ${permission}`);
  return null;
}

// Usage with user input or database values
const userInputPermission = "users.read";
const validated = validatePermissionString(userInputPermission);
if (validated) {
  // Safe to use as Permission type
  console.log(`Valid permission: ${validated}`);
}

// ============================================================
// 7. PARSING PERMISSIONS
// ============================================================

function logPermissionDetails(permission: Permission) {
  const parsed = parsePermission(permission);
  if (parsed) {
    console.log(`Resource: ${parsed.resource}, Action: ${parsed.action}`);
  }
}

logPermissionDetails("users.create");
// Output: Resource: users, Action: create

// ============================================================
// 8. PERMISSION HIERARCHIES
// ============================================================

// Define permission hierarchies (higher level includes lower levels)
const PERMISSION_HIERARCHY: Record<PermissionAction, PermissionAction[]> = {
  view: ["view"],
  read: ["view", "read"],
  create: ["view", "create"],
  update: ["view", "read", "update"],
  delete: ["view", "read", "delete"],
};

function hasEffectivePermission(
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean {
  const parsed = parsePermission(requiredPermission);
  if (!parsed) return false;

  const { resource, action } = parsed;
  const allowedActions = PERMISSION_HIERARCHY[action];

  return userPermissions.some((perm) => {
    const permParsed = parsePermission(perm);
    if (!permParsed) return false;
    return (
      permParsed.resource === resource &&
      allowedActions.includes(permParsed.action)
    );
  });
}

// Example: User has "users.update" which includes "users.view"
const userHasPermissions: Permission[] = ["users.update"];
console.log(hasEffectivePermission(userHasPermissions, "users.view")); // true
console.log(hasEffectivePermission(userHasPermissions, "users.read")); // true
console.log(hasEffectivePermission(userHasPermissions, "users.delete")); // false

// ============================================================
// 9. FRONTEND PERMISSION CHECKING
// ============================================================

// React hook example (pseudo-code)
/*
function usePermission(permission: Permission): boolean {
  const { user } = useAuth();
  return user?.permissions.includes(permission) ?? false;
}

// Usage in component
function UserManagement() {
  const canCreateUsers = usePermission("users.create");
  const canDeleteUsers = usePermission("users.delete");

  return (
    <div>
      {canCreateUsers && <CreateUserButton />}
      {canDeleteUsers && <DeleteUserButton />}
    </div>
  );
}
*/

// ============================================================
// 10. BACKEND API ROUTE PROTECTION
// ============================================================

// tRPC procedure example (pseudo-code)
/*
import { withPermission } from "@tepian-k3/auth/middleware";

export const userRouter = createTRPCRouter({
  getAll: withPermission("users.view")
    .query(async () => {
      // Only users with "users.view" permission can access
      return await getAllUsers();
    }),

  create: withPermission("users.create")
    .input(createUserSchema)
    .mutation(async ({ input }) => {
      // Only users with "users.create" permission can access
      return await createUser(input);
    }),

  delete: withPermission("users.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // Only users with "users.delete" permission can access
      return await deleteUser(input.id);
    }),
});
*/

// ============================================================
// 11. GENERATING PERMISSION DOCUMENTATION
// ============================================================

function generatePermissionDocs() {
  const allPermissions = getAllPermissions();

  console.log(`Total Permissions: ${allPermissions.length}`);
  console.log("\nPermissions by Resource:");

  // Group by resource
  const grouped = allPermissions.reduce((acc, perm) => {
    const parsed = parsePermission(perm);
    if (parsed) {
      if (!acc[parsed.resource]) {
        acc[parsed.resource] = [];
      }
      acc[parsed.resource].push(parsed.action);
    }
    return acc;
  }, {} as Record<string, PermissionAction[]>);

  Object.entries(grouped).forEach(([resource, actions]) => {
    console.log(`\n${resource}:`);
    actions.forEach((action) => {
      console.log(`  - ${resource}.${action}`);
    });
  });
}

// ============================================================
// 12. CUSTOM PERMISSION CHECKS
// ============================================================

// Check if user has any of the required permissions
function hasAnyPermission(
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.some((perm) => userPermissions.includes(perm));
}

// Check if user has all required permissions
function hasAllPermissions(
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.every((perm) => userPermissions.includes(perm));
}

// Usage
const myPermissions: Permission[] = ["users.read", "users.update", "orders.view"];

const canDoEither = hasAnyPermission(myPermissions, [
  "users.delete",
  "users.update",
]); // true (has users.update)

const canDoBoth = hasAllPermissions(myPermissions, [
  "users.read",
  "users.update",
]); // true (has both)

// ============================================================
// EXPORT FOR USE IN OTHER MODULES
// ============================================================

export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasEffectivePermission,
  ROLE_PERMISSIONS,
  PERMISSION_HIERARCHY,
};
