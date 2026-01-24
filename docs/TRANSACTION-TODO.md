# Drizzle Transaction Refactoring TODO

## ✅ Already Using Transactions (Good!)

- [x] `users.queries.ts` - `getOffsetPaginatedUsers()` (line ~175)
- [x] `users.queries.ts` - `getOffsetPaginatedDeletedUsers()` (line ~233)
- [x] `users.queries.ts` - `adminCreateUser()` (line ~452)
- [x] `user-roles.queries.ts` - `replaceRoles()` (line ~147)

## 🔴 High Priority - Should Use Transactions

### 1. `users.queries.ts` - `createUser()` (line ~327)

**Current Issue:** User creation and default role assignment are separate operations. If role assignment fails, you'll have a user without any role.

**Operations to wrap:**

1. Insert user
2. Get default role
3. Assign role to user

**Suggested Implementation:**

```typescript
const user =
  yield *
  Effect.tryPromise({
    try: () =>
      db.transaction(async (tx) => {
        // Insert user
        const [newUser] = await tx
          .insert(users)
          .values({
            ...data,
            password: hashedPassword,
          })
          .returning();

        // Get default role
        const defaultRole = await tx.query.roles.findFirst({
          where: eq(roles.name, "user"),
        });

        if (!defaultRole) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Default role not found.",
          });
        }

        // Assign role
        await tx.insert(userRoles).values({
          userId: newUser.id,
          roleId: defaultRole.id,
        });

        return newUser;
      }),
    catch: (error) => {
      /* ... */
    },
  });
```

---

### 2. `users.queries.ts` - `updateUser()` (line ~518)

**Current Issue:** Three separate operations (delete roles, add roles, update user). If any fails mid-way, data integrity is broken.

**Operations to wrap:**

1. Delete removed roles
2. Insert new roles
3. Update user data

**Suggested Implementation:**

```typescript
const user =
  yield *
  Effect.tryPromise({
    try: () =>
      db.transaction(async (tx) => {
        // Remove deleted roles
        if (data.deletedRoleIds && data.deletedRoleIds.length > 0) {
          await tx
            .delete(userRoles)
            .where(
              and(
                eq(userRoles.userId, id),
                inArray(userRoles.roleId, data.deletedRoleIds)
              )
            );
        }

        // Add new roles
        if (data.newRoleIds && data.newRoleIds.length > 0) {
          await tx
            .insert(userRoles)
            .values(data.newRoleIds.map((roleId) => ({ userId: id, roleId })))
            .onConflictDoNothing();
        }

        // Update user
        const [updatedUser] = await tx
          .update(users)
          .set({
            ...restData,
            emailVerified: data.emailVerified
              ? data.emailVerified
              : existingUser.emailVerified,
            password: data.password ? hashedPassword : existingUser.password,
            emailVerifiedAt: emailVerifiedAt
              ? emailVerifiedAt.toISOString()
              : existingUser.emailVerifiedAt,
          })
          .where(eq(users.id, id))
          .returning();

        return updatedUser;
      }),
    catch: (error) => {
      /* ... */
    },
  });
```

---

### 3. `users.queries.ts` - `updateUserAvatar()` (line ~692)

**Current Issue:** Deletes file from storage then updates DB. If DB update fails, file is deleted but DB still references old file.

**Note:** This is tricky because storage deletion is external. Consider two approaches:

**Option A - Delete file AFTER DB update:**

```typescript
// 1. Update DB first
const [updatedUser] =
  yield *
  Effect.tryPromise({
    try: () =>
      db
        .update(users)
        .set({
          profilePictureFileName: filename,
          profilePictureUrl: url,
        })
        .where(eq(users.id, id))
        .returning(),
    catch: (error) => {
      /* ... */
    },
  });

// 2. Only delete old file if DB update succeeded
if (user.profilePictureFileName && user.profilePictureUrl) {
  yield * storageService.delete(`avatars/${user.profilePictureFileName}`);
}
```

**Option B - Keep old file reference for rollback:**
Store the old file info, update DB, delete file, and if anything fails, restore old file.

---

## 🟡 Medium Priority - Consider Transactions

### 4. OTP Verification Flow (Router/Service Level)

**Location:** Should be implemented in your auth router/service, not in queries

**Operations to wrap:**

- `invalidateOTPsByEmail()` - Mark old OTPs as verified
- `createOTP()` - Create new OTP

**Note:** When user verifies OTP and confirms email:

- `markOTPAsVerified()`
- `usersQueries.markUserEmailAsVerified()`

Should be atomic.

---

### 5. Password Reset Flow (Router/Service Level)

**Location:** Should be implemented in your auth router/service

**Operations to wrap:**

- `validateResetToken()` - Check token validity
- `markTokenAsUsed()` - Mark token as used
- `usersQueries.updateUserPassword()` - Update password

Should all succeed or all fail together.

---

### 6. `users.queries.ts` - `adminCreateUser()` (line ~407)

**Current Issue:** User is created in transaction (good!), but role assignment happens outside transaction.

**Fix needed:**
Move role assignment INSIDE the existing transaction:

```typescript
const newUser =
  yield *
  Effect.tryPromise({
    try: () =>
      db.transaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({
            /* ... */
          })
          .returning();

        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal membuat pengguna.`,
          });
        }

        // ⚠️ Move role assignment HERE, inside transaction
        if (data.roleId && data.roleId.length > 0) {
          await tx.insert(userRoles).values(
            data.roleId.map((roleId) => ({
              userId: user.id,
              roleId,
            }))
          );
        }

        return user;
      }),
    catch: (error) => {
      /* ... */
    },
  });

// ❌ Remove the Effect.all role assignment that happens outside transaction
```

---

## 🟢 Low Priority / Future Considerations

### 7. User Deletion Cascade

When implementing user deletion, consider if you need to:

- Soft-delete user
- Soft-delete user's companies
- Remove user's roles
- Invalidate user's OTPs
- Invalidate user's password reset tokens

All in one transaction.

---

### 8. Company Operations with Related Data

If you have operations that create/update companies along with:

- Company locations
- Company testing locations
- Company parameters

Consider wrapping them in transactions.

---

## 📋 Transaction Best Practices

### ✅ DO:

- Keep transactions **short** and focused
- Bundle related writes (INSERT/UPDATE/DELETE)
- Handle errors properly (throw to rollback)
- Use for operations that must succeed/fail together

### ❌ DON'T:

- Include external API calls in transactions
- Include file operations in transactions
- Include CPU-intensive tasks (hashing, encryption) in transactions
- Use for read-only operations (unless you need specific isolation)

### 💡 Pattern:

```typescript
// 1. Prepare data OUTSIDE transaction
const hashedPassword = yield* hashPassword(password);
const validated = yield* validateData(data);

// 2. Execute writes INSIDE transaction
const result = yield* Effect.tryPromise({
  try: () =>
    db.transaction(async (tx) => {
      const step1 = await tx.insert(...);
      const step2 = await tx.update(...);
      const step3 = await tx.delete(...);
      return { step1, step2, step3 };
    }),
  catch: (error) => { /* ... */ }
});

// 3. Post-processing OUTSIDE transaction
yield* sendEmail(result);
yield* deleteFile(oldFile);
```

---

## 📝 Notes

- **Effect.all() for role assignment** (line ~483 in `adminCreateUser`): This runs role assignments in parallel but NOT in the same transaction as user creation. Consider moving inside the transaction.
- **Check your auth routers**: The OTP and password reset flows likely need transaction handling at the router/service level, not in individual query functions.

- **user-companies.queries.ts**: Review if company operations need transaction handling, especially if they involve related data like testing locations.

---

## 🔍 Review Checklist

Before implementing each transaction:

- [ ] Are these operations related and must succeed together?
- [ ] Have I moved CPU-intensive work outside the transaction?
- [ ] Have I moved external calls (storage, email) outside the transaction?
- [ ] Does my error handling properly rollback on failure?
- [ ] Have I tested rollback behavior?

---

**Last Updated:** January 1, 2026
