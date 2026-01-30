/\*\*

- Type-Safe Roles System Examples
-
- This file demonstrates how to use the type-safe roles system
- throughout the application.
  \*/

import type { Role, Permission } from "../index";
import {
ROLES,
ROLE_DESCRIPTIONS,
ROLE_PERMISSIONS,
isValidRole,
getRoleMetadata,
getAllRolesMetadata,
hasRolePermission,
getCombinedRolePermissions,
} from "../roles";

// ============================================================
// 1. BASIC USAGE - Type-Safe Role Strings
// ============================================================

// ✅ Type-safe: TypeScript will autocomplete and validate
const adminRole: Role = "admin";
const userRole: Role = "user";
const labTechRole: Role = "lab_technician";

// ❌ TypeScript error: invalid role
// const invalid: Role = "invalid_role";

// ============================================================
// 2. ROLE VALIDATION
// ============================================================

function validateRole(role: string): Role | null {
if (isValidRole(role)) {
return role; // Now typed as Role
}
console.error(`Invalid role: ${role}`);
return null;
}

// Usage with user input
const userInputRole = "admin";
const validated = validateRole(userInputRole);
if (validated) {
console.log(`Valid role: ${validated}`);
}

// ============================================================
// 3. GETTING ROLE INFORMATION
// ============================================================

// Get single role metadata
const adminMetadata = getRoleMetadata("admin");
console.log(adminMetadata.name); // "admin"
console.log(adminMetadata.description); // "Administrator with full access to most features"
console.log(adminMetadata.permissions.length); // Number of permissions

// Get all roles with metadata
const allRoles = getAllRolesMetadata();
allRoles.forEach((role) => {
console.log(`${role.name}: ${role.description}`);
console.log(`  Permissions: ${role.permissions.length}`);
});

// ============================================================
// 4. CHECKING ROLE PERMISSIONS
// ============================================================

// Check if a role has a specific permission
const userRoles: Role[] = ["lab_technician"];
const canUpdateTesting = hasRolePermission(userRoles, "testing.update");
console.log(canUpdateTesting); // true

const canDeleteUsers = hasRolePermission(userRoles, "users.delete");
console.log(canDeleteUsers); // false

// ============================================================
// 5. COMBINING PERMISSIONS FROM MULTIPLE ROLES
// ============================================================

// User with multiple roles gets combined permissions
const multiRoleUser: Role[] = ["user", "lab_technician"];
const allPermissions = getCombinedRolePermissions(multiRoleUser);
console.log(`Total permissions: ${allPermissions.length}`);

// Check if user has permission from any of their roles
const hasPermission = (permission: Permission): boolean => {
return allPermissions.includes(permission);
};

console.log(hasPermission("testing.update")); // true (from lab_technician)
console.log(hasPermission("cart.create")); // true (from user)

// ============================================================
// 6. ROLE-BASED UI RENDERING
// ============================================================

// React component example (pseudo-code)
/\*
function AdminPanel() {
const { user } = useAuth();
const userRoles = user.roles as Role[];

// Check if user has admin role
const isAdmin = userRoles.includes("admin") || userRoles.includes("super_admin");

if (!isAdmin) {
return <UnauthorizedPage />;
}

return (
<div>
<h1>Admin Panel</h1>
{userRoles.includes("super_admin") && <SuperAdminSection />}
{hasRolePermission(userRoles, "users.create") && <CreateUserButton />}
</div>
);
}
\*/

// ============================================================
// 7. BACKEND ROLE CHECKING
// ============================================================

// Middleware for role-based access control
function requireRole(allowedRoles: Role[]) {
return (userRoles: Role[]): boolean => {
return allowedRoles.some((role) => userRoles.includes(role));
};
}

// Usage in API routes
const userRolesExample: Role[] = ["lab_manager"];

const canAccessLabManagement = requireRole([
"lab_manager",
"admin",
"super_admin",
])(userRolesExample);
console.log(canAccessLabManagement); // true

const canAccessSuperAdmin = requireRole(["super_admin"])(userRolesExample);
console.log(canAccessSuperAdmin); // false

// ============================================================
// 8. ROLE HIERARCHY CHECKING
// ============================================================

// Define role hierarchy (higher number = more privileged)
const ROLE_HIERARCHY: Record<Role, number> = {
viewer: 1,
employee: 2,
user: 3,
lab_technician: 4,
lab_manager: 5,
admin: 6,
super_admin: 7,
};

function hasHigherRole(userRoles: Role[], requiredRole: Role): boolean {
const requiredLevel = ROLE_HIERARCHY[requiredRole];
return userRoles.some((role) => ROLE_HIERARCHY[role] >= requiredLevel);
}

// Usage
const exampleRoles: Role[] = ["lab_manager"];
console.log(hasHigherRole(exampleRoles, "lab_technician")); // true (lab_manager > lab_technician)
console.log(hasHigherRole(exampleRoles, "admin")); // false (lab_manager < admin)

// ============================================================
// 9. DISPLAYING ROLE INFORMATION IN UI
// ============================================================

function RoleSelector() {
return (
<>
{ROLES.map((role) => (
<option key={role} value={role}>
{ROLE_DESCRIPTIONS[role]}
</option>
))}
</>
);
}

// ============================================================
// 10. PERMISSION SUMMARY BY ROLE
// ============================================================

function displayRolePermissions(role: Role) {
const permissions = ROLE_PERMISSIONS[role];
const grouped: Record<string, string[]> = {};

// Group by resource
permissions.forEach((perm) => {
const [resource, action] = perm.split(".");
if (!grouped[resource]) {
grouped[resource] = [];
}
grouped[resource].push(action);
});

console.log(`\n${role} (${permissions.length} permissions):`);
console.log(`Description: ${ROLE_DESCRIPTIONS[role]}\n`);

Object.entries(grouped).forEach(([resource, actions]) => {
console.log(`  ${resource}: ${actions.join(", ")}`);
});
}

// Display all roles
ROLES.forEach((role) => displayRolePermissions(role));

// ============================================================
// 11. DYNAMIC ROLE ASSIGNMENT
// ============================================================

interface UserRoleAssignment {
userId: string;
roles: Role[];
}

function assignRolesToUser(userId: string, roles: Role[]): UserRoleAssignment {
// Validate all roles
const validRoles = roles.filter((role) => {
if (!isValidRole(role)) {
console.warn(`Invalid role '${role}' skipped for user ${userId}`);
return false;
}
return true;
});

return {
userId,
roles: validRoles,
};
}

// Usage
const assignment = assignRolesToUser("user-123", ["user", "lab_technician"]);
console.log(assignment);

// ============================================================
// 12. ROLE-BASED FEATURE FLAGS
// ============================================================

const FEATURE_FLAGS: Record<string, Role[]> = {
testing_module: ["lab_technician", "lab_manager", "admin", "super_admin"],
employee_management: ["lab_manager", "admin", "super_admin"],
system_settings: ["admin", "super_admin"],
audit_logs: ["super_admin"],
};

function hasFeatureAccess(userRoles: Role[], feature: string): boolean {
const allowedRoles = FEATURE_FLAGS[feature];
if (!allowedRoles) return false;

return userRoles.some((role) => allowedRoles.includes(role));
}

// Usage
const technicianRoles: Role[] = ["lab_technician"];
console.log(hasFeatureAccess(technicianRoles, "testing_module")); // true
console.log(hasFeatureAccess(technicianRoles, "system_settings")); // false

// ============================================================
// 13. ROLE MIGRATION HELPER
// ============================================================

// Helper to migrate old role names to new ones
const ROLE_MIGRATION_MAP: Record<string, Role> = {
technician: "lab_technician",
manager: "lab_manager",
regular_user: "user",
};

function migrateRole(oldRole: string): Role | null {
// Check if it's already a valid role
if (isValidRole(oldRole)) {
return oldRole;
}

// Check migration map
const newRole = ROLE_MIGRATION_MAP[oldRole];
if (newRole) {
console.log(`Migrated role: ${oldRole} -> ${newRole}`);
return newRole;
}

console.error(`Cannot migrate unknown role: ${oldRole}`);
return null;
}

// ============================================================
// 14. ROLE COMPARISON
// ============================================================

function compareRoles(role1: Role, role2: Role): number {
const level1 = ROLE_HIERARCHY[role1];
const level2 = ROLE_HIERARCHY[role2];
return level1 - level2;
}

function getHighestRole(roles: Role[]): Role | null {
if (roles.length === 0) return null;

return roles.reduce((highest, current) => {
return compareRoles(current, highest) > 0 ? current : highest;
});
}

// Usage
const userMultipleRoles: Role[] = ["user", "lab_technician", "viewer"];
const highestRole = getHighestRole(userMultipleRoles);
console.log(highestRole); // "lab_technician"

// ============================================================
// EXPORT FOR USE IN OTHER MODULES
// ============================================================

export {
requireRole,
hasHigherRole,
hasFeatureAccess,
migrateRole,
compareRoles,
getHighestRole,
ROLE_HIERARCHY,
FEATURE_FLAGS,
};
