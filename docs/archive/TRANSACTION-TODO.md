# Drizzle Transaction Refactoring TODO

## ✅ Already Using Transactions (Good!)

- [x] `users.queries.ts` - `getOffsetPaginatedUsers()` (line ~175)
- [x] `users.queries.ts` - `getOffsetPaginatedDeletedUsers()` (line ~233)
- [x] `users.queries.ts` - `adminCreateUser()` (line ~452)
- [x] `user-roles.queries.ts` - `replaceRoles()` (line ~147)

## ✅ Already Using Transactions (Good!)

- [x] `users.queries.ts` - `getOffsetPaginatedUsers()` (line ~175)
- [x] `users.queries.ts` - `getOffsetPaginatedDeletedUsers()` (line ~233)
- [x] `users.queries.ts` - `createUser()` (line ~327) - Role assignment is now inside transaction.
- [x] `users.queries.ts` - `updateUser()` (line ~518) - Roles deletion/addition and user updates are now atomic.
- [x] `users.queries.ts` - `updateUserAvatar()` (line ~692) - Uses asynchronous queue-based cleanup (BullMQ) to prevent orphaned files safely.
- [x] `users.queries.ts` - `adminCreateUser()` (line ~452) - Role assignment is inside the transaction.
- [x] `user-roles.queries.ts` - `replaceRoles()` (line ~147)
- [x] OTP Verification Flow - Disabled temporarily.
- [x] Password Reset Flow - Fully wrapped in transaction.

## 🔴 High Priority - Should Use Transactions

_(Semua isu prioritas tinggi telah selesai diperbaiki/diverifikasi)_

---

## 🟡 Medium Priority - Consider Transactions

_(Semua isu prioritas menengah telah selesai diperbaiki/diverifikasi)_

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
