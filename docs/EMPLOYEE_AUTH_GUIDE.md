# Employee Authentication Implementation Guide

## Overview
This guide explains how to implement employee login using the unified authentication system that links employees to the users table.

## Database Schema Changes

### Updated Employees Table
The `employees` table now includes:
- `userId`: Foreign key linking to `users.id` (unique, cascade on delete)
- `email`: Employee email address (unique)
- Indexes for efficient lookups on `userId` and `email`

## Implementation Steps

### 1. Database Migration

You'll need to create a migration to update your existing employees table. If you're using Drizzle migrations:

```bash
# Generate migration
npm run db:generate

# Review the migration file, then apply it
npm run db:migrate
```

**Important**: If you have existing employees in the database, you'll need to:
1. Create user accounts for each existing employee first
2. Update the employees table to link to those user accounts
3. Then apply the schema changes

### 2. Create Employee Roles

Create specific roles for employees in your database:

```typescript
// Example seed or migration script
const employeeRoles = [
  {
    name: 'Lab Technician',
    description: 'Performs testing and lab work'
  },
  {
    name: 'Lab Manager',
    description: 'Manages lab operations and staff'
  },
  {
    name: 'Admin Staff',
    description: 'Administrative support staff'
  }
];

// Insert these roles and assign appropriate permissions
```

### 3. Employee Registration Flow

When creating a new employee:

```typescript
// Pseudo-code example
async function createEmployee(data: {
  name: string;
  email: string;
  password: string;
  position: string;
  status: string;
}) {
  // 1. Create user account
  const user = await db.insert(users).values({
    email: data.email,
    password: await hashPassword(data.password),
    name: data.name,
    address: '', // Or collect from employee
    phone: '', // Or collect from employee
    emailVerified: false,
  }).returning();

  // 2. Assign employee role
  const employeeRole = await db.select()
    .from(roles)
    .where(eq(roles.name, 'Employee'))
    .limit(1);

  await db.insert(userRoles).values({
    userId: user.id,
    roleId: employeeRole.id,
  });

  // 3. Create employee record
  const employee = await db.insert(employees).values({
    userId: user.id,
    name: data.name,
    email: data.email,
    position: data.position,
    status: data.status || 'siap',
  }).returning();

  return { user, employee };
}
```

### 4. Employee Login Flow

Employees use the **same login endpoint** as regular users:

```typescript
// Your existing login endpoint
POST /api/auth/login
{
  "email": "employee@example.com",
  "password": "password123"
}

// After authentication, check if user is an employee
async function getUserWithRole(userId: string) {
  const user = await db.select()
    .from(users)
    .leftJoin(employees, eq(users.id, employees.userId))
    .leftJoin(userRoles, eq(users.id, userRoles.userId))
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(users.id, userId));

  return {
    ...user,
    isEmployee: !!user.employees,
    employeeData: user.employees,
    roles: user.roles,
  };
}
```

### 5. Authorization Checks

Use your existing permission system to control employee access:

```typescript
// Example middleware
async function requireEmployeeRole(userId: string) {
  const userRoles = await db.select()
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const hasEmployeeRole = userRoles.some(ur =>
    ur.roles.name.includes('Employee') ||
    ur.roles.name.includes('Lab') ||
    ur.roles.name.includes('Admin Staff')
  );

  if (!hasEmployeeRole) {
    throw new Error('Access denied: Employee role required');
  }
}
```

### 6. Employee-Specific Permissions

Create permissions for employee actions:

```typescript
// Example permissions to seed
const employeePermissions = [
  {
    name: 'testing.perform',
    description: 'Perform laboratory testing',
    resource: 'testing',
    action: 'create'
  },
  {
    name: 'testing.view',
    description: 'View testing records',
    resource: 'testing',
    action: 'read'
  },
  {
    name: 'testing.update',
    description: 'Update testing results',
    resource: 'testing',
    action: 'update'
  },
  {
    name: 'tools.view',
    description: 'View laboratory tools',
    resource: 'tools',
    action: 'read'
  },
  {
    name: 'tools.manage',
    description: 'Manage laboratory tools',
    resource: 'tools',
    action: 'update'
  }
];
```

## Frontend Implementation

### 1. Single Login Page

Use one login page for both users and employees:

```typescript
// components/LoginForm.tsx
async function handleLogin(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const { user, token } = await response.json();

  // Store token
  localStorage.setItem('authToken', token);

  // Redirect based on user type
  if (user.isEmployee) {
    router.push('/employee/dashboard');
  } else {
    router.push('/dashboard');
  }
}
```

### 2. Route Protection

Protect employee routes:

```typescript
// middleware.ts or route guard
function employeeRouteGuard(user: User) {
  if (!user.isEmployee) {
    redirect('/access-denied');
  }
}
```

### 3. Employee Dashboard

Create employee-specific views:

```
/employee/dashboard - Employee overview
/employee/testing - Testing queue and management
/employee/tools - Tool management
/employee/profile - Employee profile
```

## Database Queries Examples

### Get Employee with User Data

```typescript
const employeeWithUser = await db.select()
  .from(employees)
  .innerJoin(users, eq(employees.userId, users.id))
  .where(eq(employees.id, employeeId));
```

### Get All Active Employees

```typescript
const activeEmployees = await db.select()
  .from(employees)
  .innerJoin(users, eq(employees.userId, users.id))
  .where(eq(employees.status, 'siap'))
  .orderBy(employees.name);
```

### Check if User is Employee

```typescript
const isEmployee = await db.select()
  .from(employees)
  .where(eq(employees.userId, userId))
  .limit(1);

return !!isEmployee.length;
```

## Benefits of This Approach

1. **Unified Authentication**: One login system for all user types
2. **Reuse Existing Code**: Leverage your current auth infrastructure
3. **Role-Based Access**: Use your existing permission system
4. **Data Integrity**: Foreign key constraints ensure data consistency
5. **Flexibility**: Easy to add more employee types or roles
6. **Audit Trail**: Employee actions tracked through user audit system

## Migration Strategy for Existing Data

If you have existing employees without user accounts:

```sql
-- 1. Add columns as nullable first
ALTER TABLE employees ADD COLUMN user_id UUID;
ALTER TABLE employees ADD COLUMN email VARCHAR(250);

-- 2. Create user accounts for each employee
-- (Do this in your application code or migration script)

-- 3. Update employees with user_id
-- (Link employees to newly created users)

-- 4. Make columns NOT NULL and add constraints
ALTER TABLE employees ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE employees ALTER COLUMN email SET NOT NULL;
ALTER TABLE employees ADD CONSTRAINT employees_user_id_unique UNIQUE (user_id);
ALTER TABLE employees ADD CONSTRAINT employees_email_unique UNIQUE (email);
```

## Next Steps

1. Generate and review the migration
2. Create employee roles and permissions (seed data)
3. Update your authentication logic to handle employee users
4. Create employee-specific UI routes and components
5. Test the login flow for both regular users and employees
6. Implement employee-specific features based on their roles

## Questions to Consider

- What employee roles do you need? (Lab Technician, Manager, etc.)
- What permissions should each employee role have?
- Should employees have access to the regular user interface or only employee-specific pages?
- Do employees need different authentication methods (e.g., SSO, MFA)?
- How should employee status changes affect their login access?
