# @tepian-k3/constants

Shared constants, types, and type-safe utilities for the Tepian K3 application.

## Table of Contents

- [Type-Safe Permission System](#type-safe-permission-system)
- [Type-Safe Roles System](#type-safe-roles-system)
- [Usage Examples](#usage-examples)

## Type-Safe Permission System

This package provides a fully type-safe permission system that prevents typos and ensures consistency across the application.

### Core Concepts

**Permission Format:** `resource.action`

- **Resource:** The entity being accessed (e.g., `users`, `orders`, `documents`)
- **Action:** The operation being performed (e.g., `view`, `create`, `read`, `update`, `delete`)

### Available Actions

```typescript
type PermissionAction =
  | "view"    // List/dashboard access (no details)
  | "create"  // Create new records
  | "read"    // Read full record details
  | "update"  // Modify records
  | "delete"  // Delete records
```

### Action Hierarchy

Permissions follow a hierarchy from least to most privileged:

```
view < create/read < update < delete
```

- **view**: See lists, summaries, dashboards (no sensitive details)
- **read**: View full record details (includes view)
- **create**: Create new records (includes view)
- **update**: Modify existing records (includes view + read)
- **delete**: Delete records (includes view + read)

### Resources (33 Total)

The system supports permissions for these resources:

**Authentication & Authorization:**
- `users`, `roles`, `permissions`, `role-permissions`, `user-permissions`

**Testing Configuration:**
- `tools`, `clusters`, `parameter-categories`, `parameters`, `parameter-tool`

**Geography:**
- `provinces`, `regencies`, `districts`, `villages`, `kbli`

**Companies:**
- `user-company`, `user-company-testing-location`

**Shopping & Orders:**
- `cart`, `orders`, `order-items`, `order-status-history`

**Testing:**
- `testing`, `testing-item`

**Documents:**
- `documents`, `document-signatures`, `document-verifications`

**Employees & Worksheets:**
- `employees`, `worksheets`, `worksheet-items`, `worksheet-tools`, `worksheet-notes`, `worksheet-assignments`

**Audit:**
- `audits`

### Total Permissions

**33 resources × 5 actions = 165 permissions**

## Usage Examples

### 1. Type-Safe Permission Strings

```typescript
import type { Permission } from "@tepian-k3/constants";

// ✅ Valid - TypeScript autocompletes and validates
const permission: Permission = "users.read";

// ❌ TypeScript error - invalid resource
const invalid: Permission = "invalid.read";

// ❌ TypeScript error - invalid action
const invalid2: Permission = "users.invalid";
```

### 2. Creating Permissions Dynamically

```typescript
import { createPermission, type Resource, type PermissionAction } from "@tepian-k3/constants";

const resource: Resource = "documents";
const action: PermissionAction = "update";
const permission = createPermission(resource, action); // "documents.update"
```

### 3. Get All Permissions for a Resource

```typescript
import { getResourcePermissions } from "@tepian-k3/constants";

const userPermissions = getResourcePermissions("users");
// Returns: ["users.view", "users.create", "users.read", "users.update", "users.delete"]
```

### 4. Generate All Permissions

```typescript
import { getAllPermissions } from "@tepian-k3/constants";

const allPermissions = getAllPermissions();
// Returns all 165 permissions
```

### 5. Validate Permission Strings

```typescript
import { isValidPermission, parsePermission } from "@tepian-k3/constants";

// Validate a string
if (isValidPermission("users.read")) {
  // Safe to use as Permission type
}

// Parse permission into components
const parsed = parsePermission("users.read");
// Returns: { resource: "users", action: "read" }
```

### 6. Role-Based Permission Sets

```typescript
import { getResourcePermissions, type Permission } from "@tepian-k3/constants";

const ADMIN_PERMISSIONS = getAllPermissions(); // All 165 permissions

const USER_PERMISSIONS: Permission[] = [
  ...getResourcePermissions("user-company"),
  ...getResourcePermissions("cart"),
  "orders.view",
  "orders.create",
  "orders.read",
];

const LAB_TECH_PERMISSIONS: Permission[] = [
  "testing.view",
  "testing.read",
  "testing.update",
  ...getResourcePermissions("worksheets"),
];
```

### 7. Backend API Protection (tRPC)

```typescript
import { withPermission } from "@tepian-k3/auth/middleware";
import type { Permission } from "@tepian-k3/constants";

export const userRouter = createTRPCRouter({
  // Only users with "users.view" can access
  getAll: withPermission("users.view" as Permission)
    .query(async () => {
      return await db.query.users.findMany();
    }),

  // Only users with "users.create" can access
  create: withPermission("users.create" as Permission)
    .input(createUserSchema)
    .mutation(async ({ input }) => {
      return await db.insert(users).values(input);
    }),
});
```

### 8. Frontend Route Protection (React)

```typescript
import { requirePermission } from "@/utils/require-permission";
import type { Permission } from "@tepian-k3/constants";

export const Route = createFileRoute("/(core)/back-office/users/")({
  beforeLoad: async ({ context }) => {
    // Type-safe permission check
    await requirePermission(context, {
      permission: "users.read" as Permission
    });
  },
});
```

### 9. Custom Permission Checks

```typescript
import type { Permission } from "@tepian-k3/constants";

function hasPermission(
  userPermissions: Permission[],
  required: Permission
): boolean {
  return userPermissions.includes(required);
}

function hasAnyPermission(
  userPermissions: Permission[],
  required: Permission[]
): boolean {
  return required.some(perm => userPermissions.includes(perm));
}

function hasAllPermissions(
  userPermissions: Permission[],
  required: Permission[]
): boolean {
  return required.every(perm => userPermissions.includes(perm));
}
```

---

## Type-Safe Roles System

This package also provides a type-safe roles system that integrates with the permission system.

### Available Roles (7 Total)

```typescript
type Role =
  | "super_admin"      // All system permissions
  | "admin"            // Full access to most features
  | "user"             // Regular user (company management, orders)
  | "employee"         // Basic employee access
  | "lab_technician"   // Laboratory technician (testing operations)
  | "lab_manager"      // Laboratory manager (full testing management)
  | "viewer"           // Read-only access
```

### Role Descriptions

Each role has a predefined set of permissions:

- **super_admin**: All 165 permissions - complete system access
- **admin**: All 165 permissions - administrative access
- **user**: Company management, cart, orders, view parameters/documents (54 permissions)
- **employee**: Basic viewing permissions for orders, testing, documents (5 permissions)
- **lab_technician**: Testing operations, worksheet management, tool/parameter viewing (44 permissions)
- **lab_manager**: Full testing management, employee management, document creation (77 permissions)
- **viewer**: View-only access to most resources (18 permissions)

### Role Usage Examples

```typescript
import type { Role } from "@tepian-k3/constants";

// ✅ Type-safe - autocompletes and validates
const role: Role = "lab_technician";

// ❌ TypeScript error - invalid role
const invalid: Role = "invalid_role"; // Compile error!

// Check if a role has a permission
import { hasRolePermission } from "@tepian-k3/constants";

const userRoles: Role[] = ["lab_technician"];
const canUpdate = hasRolePermission(userRoles, "testing.update"); // true

// Get all permissions for user's roles
import { getCombinedRolePermissions } from "@tepian-k3/constants";

const roles: Role[] = ["user", "lab_technician"];
const allPermissions = getCombinedRolePermissions(roles);
// Returns deduplicated array of all permissions from both roles

// Get role metadata
import { getRoleMetadata } from "@tepian-k3/constants";

const metadata = getRoleMetadata("lab_manager");
// Returns: { name, description, permissions[] }
```

### Role Validation

```typescript
import { isValidRole } from "@tepian-k3/constants";

function validateRole(role: string): Role | null {
  if (isValidRole(role)) {
    return role; // Now typed as Role
  }
  return null;
}
```

## Database Seeding

Both permissions and roles are automatically generated and used in database seeding:

```typescript
import {
  generatePermissionsList,
  generateRolesList,
  ROLE_PERMISSIONS,
} from "@tepian-k3/constants";

// Generate all 165 permissions
const permissionsList = generatePermissionsList();

// Generate all 7 roles with descriptions
const rolesList = generateRolesList();

// Assign permissions to roles
for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
  // Assign permissions to role...
}
```

## Benefits of Type-Safe System

### Permissions & Roles

1. **Autocomplete**: IDE suggests valid permissions and roles as you type
2. **Compile-time Safety**: Catch typos before runtime
3. **Refactoring**: Rename resources/roles across the entire codebase safely
4. **Documentation**: Type system serves as living documentation
5. **Consistency**: Single source of truth for all permissions and roles
6. **Maintainability**: Add new resources/roles in one place

## Adding New Resources

To add a new resource with permissions:

1. **Add to RESOURCES array** in `packages/constants/src/resources.ts`:
   ```typescript
   export const RESOURCES = [
     // ... existing resources
     "my-new-resource",
   ] as const;
   ```

2. **Run seeder** to add permissions to database:
   ```bash
   pnpm db:seed
   ```

3. **Use in code** with full type safety:
   ```typescript
   const permission: Permission = "my-new-resource.read";
   ```

## Adding New Roles

To add a new role:

1. **Add to ROLES array** in `packages/constants/src/roles.ts`:
   ```typescript
   export const ROLES = [
     // ... existing roles
     "my-new-role",
   ] as const;
   ```

2. **Add description** in `ROLE_DESCRIPTIONS`:
   ```typescript
   export const ROLE_DESCRIPTIONS: Record<Role, string> = {
     // ... existing descriptions
     my_new_role: "Description of the new role",
   };
   ```

3. **Define permissions** in `ROLE_PERMISSIONS`:
   ```typescript
   export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
     // ... existing role permissions
     my_new_role: [
       "users.view",
       "orders.view",
       // ... other permissions
     ],
   };
   ```

4. **Run seeder** to add role to database:
   ```bash
   pnpm db:seed
   ```

5. **Use in code** with full type safety:
   ```typescript
   const role: Role = "my_new_role";
   ```

## Related Documentation

- See [permissions.example.ts](./src/permissions.example.ts) for comprehensive permission usage examples
- See [roles.example.ts](./src/roles.example.ts) for comprehensive role usage examples
- See [CLAUDE.md](../../CLAUDE.md) for system architecture overview
