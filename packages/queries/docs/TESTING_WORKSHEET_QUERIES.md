# Testing and Worksheet Queries Documentation

## Overview

This document describes the implementation of testing and worksheet query functions with proper transaction handling. These queries are used to create and manage testing records and worksheets from orders.

## Files

- [`packages/queries/src/testing.queries.ts`](../src/testing.queries.ts) - Testing query functions
- [`packages/queries/src/worksheet.queries.ts`](../src/worksheet.queries.ts) - Worksheet query functions
- [`packages/queries/src/order.queries.ts`](../src/order.queries.ts) - Updated with `createTestingFromOrder`

## Testing Queries

### Location

`packages/queries/src/testing.queries.ts`

### Functions

#### 1. `getTestingById(testingId: string)`

Get a testing record by ID with all relations.

**Returns:**
- Testing with order, company, user, items, parameters, and locations

**Example:**
```typescript
import testingQueries from "@tepian-k3/queries/testing.queries";

const testing = await Effect.runPromise(
  testingQueries.getTestingById(testingId)
);
```

---

#### 2. `getAllTestings(page: number, limit: number, search?: string)`

Get all testings with pagination and optional search.

**Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Optional search by testing number

**Returns:**
```typescript
{
  data: Testing[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}
```

**Example:**
```typescript
const result = await Effect.runPromise(
  testingQueries.getAllTestings(1, 10, "TEST-2024")
);
```

---

#### 3. `createTestingFromOrder(orderId: string)` ⭐

**Main function** - Create testing record from an order with full transaction handling.

**Transaction Steps:**
1. Fetch order with items and validate:
   - Order must exist
   - Order must be approved (`approvalStatus = 'approved'`)
   - Order must be paid (`paymentStatus = 'paid'`)
   - Order must have items
   - Testing must not already exist for this order
2. Get testing type (category) from first order item
3. Generate testing number using sequence
4. Create testing record
5. Create testing items from order items
6. Update order status to `in_progress`
7. Create order status history entry
8. Log audit (deferred, non-blocking)

**Validations:**
- Order exists and is in valid state
- Order has items
- Testing doesn't already exist for the order

**Error Handling:**
- Returns `TRPCError` with appropriate code and message
- All operations are wrapped in a database transaction
- Transaction rolls back if any step fails

**Example:**
```typescript
import testingQueries from "@tepian-k3/queries/testing.queries";

const testing = await Effect.runPromise(
  testingQueries.createTestingFromOrder(orderId)
);

// Returns the created testing record
```

**Transaction Flow:**
```typescript
db.transaction(async (tx) => {
  // 1. Validate order
  const order = await tx.query.order.findFirst({...});

  // 2. Generate testing number
  const testingNumber = await generateTestingNumberWithSequence(tx, "TEST");

  // 3. Create testing
  const [testing] = await tx.insert(testing).values({...}).returning();

  // 4. Create testing items
  await tx.insert(testingItem).values([...]).returning();

  // 5. Update order status
  await tx.update(order).set({ status: "in_progress" });

  // 6. Create status history
  await Effect.runPromise(
    orderStatusHistoryQueries.createOrderStatusHistory(tx, ...)
  );

  return { testing, items, order };
});
```

---

#### 4. `updateTestingStatus(testingId, status, userId, note?)`

Update testing status with optional note.

**Parameters:**
- `testingId` - Testing ID
- `status` - New status (one of: `start_testing`, `sample_submission`, `sample_analysis`, `result_entry`, `completed`)
- `userId` - User making the update
- `note` - Optional note

**Example:**
```typescript
const updated = await Effect.runPromise(
  testingQueries.updateTestingStatus(
    testingId,
    "sample_analysis",
    userId,
    "Samples received"
  )
);
```

---

#### 5. `updateTestingItemResult(tx, itemId, result, note?)`

Update testing item result value (used within transactions).

**Parameters:**
- `tx` - Transaction object
- `itemId` - Testing item ID
- `result` - Result value as string
- `note` - Optional note

**Example:**
```typescript
await db.transaction(async (tx) => {
  await Effect.runPromise(
    testingQueries.updateTestingItemResult(
      tx,
      itemId,
      "95.5",
      "Within acceptable range"
    )
  );
});
```

---

## Worksheet Queries

### Location

`packages/queries/src/worksheet.queries.ts`

### Functions

#### 1. `getWorksheetById(worksheetId: string)`

Get worksheet by ID with all relations.

**Returns:**
- Worksheet with testing, order, items, tools, assignments, notes, supervisors

**Example:**
```typescript
import worksheetQueries from "@tepian-k3/queries/worksheet.queries";

const worksheet = await Effect.runPromise(
  worksheetQueries.getWorksheetById(worksheetId)
);
```

---

#### 2. `getAllWorksheets(page: number, limit: number, status?: string)`

Get all worksheets with pagination and optional status filter.

**Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `status` - Optional status filter (one of: `draft`, `in_progress`, `completed`, `approved`, `rejected`)

**Returns:**
```typescript
{
  data: Worksheet[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}
```

---

#### 3. `getWorksheetsByTestingId(testingId: string)`

Get all worksheets for a specific testing.

**Returns:**
- Array of worksheets with items and supervisors

**Example:**
```typescript
const worksheets = await Effect.runPromise(
  worksheetQueries.getWorksheetsByTestingId(testingId)
);
```

---

#### 4. `createWorksheetFromTesting(testingId, userId, startDate, mainSupervisorId?, accompanyingSupervisorId?)` ⭐

**Main function** - Create worksheet from testing with transaction handling.

**Transaction Steps:**
1. Fetch testing with items and validate
2. Create worksheet record
3. Create worksheet items from testing items
4. Log audit (deferred, non-blocking)

**Parameters:**
- `testingId` - Testing ID to create worksheet from
- `userId` - User creating the worksheet
- `startDate` - Start date (ISO string)
- `mainSupervisorId` - Optional main supervisor employee ID
- `accompanyingSupervisorId` - Optional accompanying supervisor employee ID

**Validations:**
- Testing must exist
- Testing must have items

**Example:**
```typescript
const worksheet = await Effect.runPromise(
  worksheetQueries.createWorksheetFromTesting(
    testingId,
    userId,
    new Date().toISOString(),
    mainSupervisorId,
    accompanyingSupervisorId
  )
);
```

**Transaction Flow:**
```typescript
db.transaction(async (tx) => {
  // 1. Validate testing
  const testing = await tx.query.testing.findFirst({...});

  // 2. Create worksheet
  const [worksheet] = await tx.insert(worksheets).values({...}).returning();

  // 3. Create worksheet items
  const items = await tx.insert(worksheetItems).values([...]).returning();

  return { worksheet, items, testing };
});
```

---

#### 5. `updateWorksheetStatus(worksheetId, status, userId, endDate?, result?)`

Update worksheet status with optional end date and result.

**Parameters:**
- `worksheetId` - Worksheet ID
- `status` - New status
- `userId` - User making the update
- `endDate` - Optional end date (ISO string)
- `result` - Optional result summary

**Logs audit automatically.**

**Example:**
```typescript
const updated = await Effect.runPromise(
  worksheetQueries.updateWorksheetStatus(
    worksheetId,
    "completed",
    userId,
    new Date().toISOString(),
    "All tests completed successfully"
  )
);
```

---

#### 6. `updateWorksheetItemValue(tx, itemId, value, note?, isReady?)`

Update worksheet item value (used within transactions).

**Parameters:**
- `tx` - Transaction object
- `itemId` - Worksheet item ID
- `value` - Value as number
- `note` - Optional note
- `isReady` - Optional ready status (boolean)

**Example:**
```typescript
await db.transaction(async (tx) => {
  await Effect.runPromise(
    worksheetQueries.updateWorksheetItemValue(
      tx,
      itemId,
      95.5,
      "Test completed",
      true
    )
  );
});
```

---

#### 7. `assignToolsToWorksheet(tx, worksheetId, toolIds)`

Assign tools to worksheet (replaces existing tools).

**Parameters:**
- `tx` - Transaction object
- `worksheetId` - Worksheet ID
- `toolIds` - Array of tool IDs

**Example:**
```typescript
await db.transaction(async (tx) => {
  await Effect.runPromise(
    worksheetQueries.assignToolsToWorksheet(
      tx,
      worksheetId,
      [toolId1, toolId2, toolId3]
    )
  );
});
```

---

#### 8. `assignEmployeesToWorksheet(tx, worksheetId, employeeIds, assignedBy)`

Assign employees to worksheet (replaces existing assignments).

**Parameters:**
- `tx` - Transaction object
- `worksheetId` - Worksheet ID
- `employeeIds` - Array of employee IDs
- `assignedBy` - User ID who is assigning

**Example:**
```typescript
await db.transaction(async (tx) => {
  await Effect.runPromise(
    worksheetQueries.assignEmployeesToWorksheet(
      tx,
      worksheetId,
      [employeeId1, employeeId2],
      userId
    )
  );
});
```

---

#### 9. `addWorksheetNote(tx, worksheetId, note, createdBy, severity)`

Add a note to worksheet (used within transactions).

**Parameters:**
- `tx` - Transaction object
- `worksheetId` - Worksheet ID
- `note` - Note text
- `createdBy` - User ID creating the note
- `severity` - Severity level (`info`, `warning`, `error`)

**Example:**
```typescript
await db.transaction(async (tx) => {
  await Effect.runPromise(
    worksheetQueries.addWorksheetNote(
      tx,
      worksheetId,
      "Equipment calibration needed",
      userId,
      "warning"
    )
  );
});
```

---

#### 10. `updateWorksheetSupervisors(worksheetId, mainSupervisorId?, accompanyingSupervisorId?, userId?)`

Update worksheet supervisors.

**Parameters:**
- `worksheetId` - Worksheet ID
- `mainSupervisorId` - Optional main supervisor employee ID
- `accompanyingSupervisorId` - Optional accompanying supervisor employee ID
- `userId` - Optional user ID for audit logging

**Logs audit if userId is provided.**

**Example:**
```typescript
const updated = await Effect.runPromise(
  worksheetQueries.updateWorksheetSupervisors(
    worksheetId,
    newMainSupervisorId,
    newAccompanyingSupervisorId,
    userId
  )
);
```

---

## Usage in tRPC Router

### Creating Testing from Order

In [`packages/api/src/routers/order.ts`](../../api/src/routers/order.ts):

```typescript
createTesting: withPermission("testing.create")
  .input(
    z.object({
      orderId: z.string(),
    })
  )
  .mutation(
    async ({ input, ctx }) =>
      await runEffect(
        Effect.gen(function* () {
          // Create testing record from order
          const testing = yield* orderQueries.createTestingFromOrder(
            input.orderId
          );

          if (!testing) {
            return yield* Effect.fail(
              new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal membuat testing record",
              })
            );
          }

          return testing;
        })
      )
  ),
```

### Creating Worksheet from Testing

Example router implementation:

```typescript
// In packages/api/src/routers/worksheet.ts
createWorksheet: withPermission("worksheets.create")
  .input(
    z.object({
      testingId: z.string(),
      startDate: z.string(),
      mainSupervisorId: z.string().optional(),
      accompanyingSupervisorId: z.string().optional(),
    })
  )
  .mutation(
    async ({ input, ctx }) =>
      await runEffect(
        worksheetQueries.createWorksheetFromTesting(
          input.testingId,
          ctx.user.id,
          input.startDate,
          input.mainSupervisorId,
          input.accompanyingSupervisorId
        )
      )
  ),
```

---

## Transaction Patterns

### Pattern 1: Single Operation Transaction

Used in `createTestingFromOrder` and `createWorksheetFromTesting`:

```typescript
return Effect.tryPromise({
  try: () =>
    db.transaction(async (tx) => {
      // All operations here
      const result1 = await tx.insert(...);
      const result2 = await tx.update(...);
      return { result1, result2 };
    }),
  catch: (error) => {
    // Error handling
  },
});
```

### Pattern 2: Multiple Operations Transaction

Used for complex workflows with multiple updates:

```typescript
await db.transaction(async (tx) => {
  // Update worksheet items
  for (const item of items) {
    await Effect.runPromise(
      worksheetQueries.updateWorksheetItemValue(tx, item.id, item.value)
    );
  }

  // Assign tools
  await Effect.runPromise(
    worksheetQueries.assignToolsToWorksheet(tx, worksheetId, toolIds)
  );

  // Add notes
  await Effect.runPromise(
    worksheetQueries.addWorksheetNote(tx, worksheetId, note, userId, "info")
  );
});
```

---

## Error Handling

All queries follow these error handling patterns:

1. **TRPCError Preservation**: If error is already a `TRPCError`, re-throw as-is
2. **Error Logging**: Log all errors with context using `logError`
3. **User-Friendly Messages**: Return Indonesian error messages
4. **Transaction Rollback**: Automatic rollback on any error in transaction

**Example:**
```typescript
try: async () => {
  // Operations
},
catch: (error) => {
  logError("functionName", "Description", { error, context });

  if (error instanceof TRPCError) {
    throw error;
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "User-friendly message in Indonesian",
  });
}
```

---

## Testing Status Flow

```
start_testing → sample_submission → sample_analysis → result_entry → completed
```

## Worksheet Status Flow

```
draft → in_progress → completed → approved
                              ↘ rejected
```

---

## Database Schema Reference

### Testing Table

```typescript
{
  id: uuid (PK)
  testingNumber: string (unique)
  orderId: uuid (FK → order)
  userId: uuid (FK → users)
  companyId: uuid (FK → userCompanies)
  testingType: uuid (FK → parameterCategories)
  status: enum (start_testing, sample_submission, sample_analysis, result_entry, completed)
  note: text
  ...timestamps
}
```

### Testing Item Table

```typescript
{
  id: uuid (PK)
  testingId: uuid (FK → testing)
  orderItemId: uuid (FK → orderItem)
  parameterId: uuid (FK → parameters)
  locationId: uuid (FK → userCompanyTestingLocation)
  quantity: integer
  price: integer
  subTotal: integer
  result: text (nullable)
  note: text (nullable)
  ...timestamps
}
```

### Worksheet Table

```typescript
{
  id: uuid (PK)
  testingId: uuid (FK → testing)
  status: enum (draft, in_progress, completed, approved, rejected)
  startDate: timestamp
  endDate: timestamp (nullable)
  mainSupervisorId: uuid (FK → employees, nullable)
  accompanyingSupervisorId: uuid (FK → employees, nullable)
  result: text (nullable)
  createdBy: uuid (FK → users)
  ...timestamps
}
```

### Worksheet Item Table

```typescript
{
  id: uuid (PK)
  worksheetId: uuid (FK → worksheets)
  parameterId: uuid (FK → parameters)
  locationId: uuid (FK → userCompanyTestingLocation)
  quantity: integer
  value: real (nullable)
  note: text (nullable)
  isReady: boolean (default: false)
  ...timestamps
}
```

---

## Complete Workflow Example

### Order → Testing → Worksheet

```typescript
// 1. Create testing from order
const testing = await Effect.runPromise(
  testingQueries.createTestingFromOrder(orderId)
);

// 2. Update testing status as it progresses
await Effect.runPromise(
  testingQueries.updateTestingStatus(
    testing.id,
    "sample_submission",
    userId
  )
);

// 3. Create worksheet from testing
const worksheet = await Effect.runPromise(
  worksheetQueries.createWorksheetFromTesting(
    testing.id,
    userId,
    new Date().toISOString(),
    mainSupervisorId
  )
);

// 4. Assign employees and tools to worksheet
await db.transaction(async (tx) => {
  await Effect.runPromise(
    worksheetQueries.assignEmployeesToWorksheet(
      tx,
      worksheet.id,
      [employeeId1, employeeId2],
      userId
    )
  );

  await Effect.runPromise(
    worksheetQueries.assignToolsToWorksheet(
      tx,
      worksheet.id,
      [toolId1, toolId2]
    )
  );
});

// 5. Update worksheet items with results
await db.transaction(async (tx) => {
  for (const item of items) {
    await Effect.runPromise(
      worksheetQueries.updateWorksheetItemValue(
        tx,
        item.id,
        item.value,
        item.note,
        true
      )
    );
  }
});

// 6. Complete worksheet
await Effect.runPromise(
  worksheetQueries.updateWorksheetStatus(
    worksheet.id,
    "completed",
    userId,
    new Date().toISOString(),
    "All tests completed successfully"
  )
);
```

---

## Notes

- All functions use Effect for composable error handling
- Transactions ensure data consistency
- Audit logging is deferred using `Effect.forkDaemon` to not block operations
- All error messages are in Indonesian
- Functions that accept `tx` parameter must be called within a transaction
- Functions without `tx` parameter handle their own transactions internally
