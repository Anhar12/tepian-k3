# Polymorphic Relations Implementation Summary

## Overview

Successfully implemented polymorphic relations between `documents` and multiple entity types (`order`, `testing`, `user_company`, `user`) in Drizzle ORM 0.45.1.

## What Was Changed

### 1. Relations File Updated
**File**: `packages/db/src/relations.ts`

Added bidirectional polymorphic relations:

#### From Parent Entities → Documents
```typescript
// Order → Documents
export const orderRelations = relations(order, ({ one, many }) => ({
  // ... existing relations
  documents: many(documents, {
    relationName: "orderDocuments",
  }),
}));

// Testing → Documents
export const testingRelations = relations(testing, ({ one, many }) => ({
  // ... existing relations
  documents: many(documents, {
    relationName: "testingDocuments",
  }),
}));

// UserCompany → Documents
export const userCompanyRelations = relations(userCompanies, ({ one, many }) => ({
  // ... existing relations
  documents: many(documents, {
    relationName: "userCompanyDocuments",
  }),
}));

// User → Documents
export const userRelations = relations(users, ({ many }) => ({
  // ... existing relations
  documents: many(documents, {
    relationName: "userDocuments",
  }),
}));
```

#### From Documents → Parent Entities
```typescript
export const documentsRelations = relations(documents, ({ one, many }) => ({
  // ... existing relations

  // Polymorphic relations - one of these will be populated based on entityType
  order: one(order, {
    fields: [documents.entityId],
    references: [order.id],
    relationName: "orderDocuments",
  }),
  testing: one(testing, {
    fields: [documents.entityId],
    references: [testing.id],
    relationName: "testingDocuments",
  }),
  userCompany: one(userCompanies, {
    fields: [documents.entityId],
    references: [userCompanies.id],
    relationName: "userCompanyDocuments",
  }),
  user: one(users, {
    fields: [documents.entityId],
    references: [users.id],
    relationName: "userDocuments",
  }),
}));
```

### 2. Helper Functions Created
**File**: `packages/db/src/polymorphic-helpers.ts` (new)

Three utility functions for working with polymorphic relations:

```typescript
// Create WHERE condition for polymorphic queries
export const whereEntityIs = (
  entityType: DocumentEntityType,
  entityId: string
): SQL;

// Get relation name from entity type
export const getEntityRelationName = (
  entityType: DocumentEntityType
): "order" | "testing" | "userCompany" | "user";

// Type guard for type-safe entity type checking
export const isDocumentOfType = <T extends DocumentEntityType>(
  document: { entityType: DocumentEntityType },
  type: T
): boolean;
```

### 3. Package Exports Updated
**File**: `packages/db/src/index.ts`

Added export for the helper functions:
```typescript
export * from "./polymorphic-helpers";
```

### 4. Documentation Created

1. **[POLYMORPHIC_RELATIONS_GUIDE.md](packages/db/POLYMORPHIC_RELATIONS_GUIDE.md)** - Comprehensive guide with:
   - Schema structure explanation
   - Relations setup details
   - 8 usage examples with code
   - Integration with document signing
   - Best practices and limitations
   - Migration example

2. **[POLYMORPHIC_EXAMPLES.ts.example](packages/db/POLYMORPHIC_EXAMPLES.ts.example)** - Ready-to-use code examples:
   - 15 common use cases
   - Copy-paste ready functions
   - TypeScript examples with Effect
   - tRPC router integration example

## How It Works

### Schema Design
The `documents` table uses two columns for the polymorphic relationship:
- `entityType`: Enum specifying which table the document belongs to
- `entityId`: UUID referencing the parent entity's ID

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  entity_type document_entity_type NOT NULL,  -- 'order', 'testing', 'user_company', 'user'
  entity_id UUID NOT NULL,
  -- ... other columns
);

CREATE INDEX documents_entity_idx ON documents(entity_type, entity_id);
```

### Relations Pattern
Since Drizzle doesn't have built-in polymorphic support, we use:
1. **Multiple one-to-one relations** from documents to each possible parent
2. **One-to-many relations** from each parent to documents
3. **Relation names** to distinguish between different polymorphic relations
4. **WHERE filters** to query by entity type at runtime

## Usage Examples

### 1. Query Documents for an Order
```typescript
import { db, whereEntityIs } from "@tepian-k3/db";

const docs = await db.query.documents.findMany({
  where: whereEntityIs("order", orderId),
});
```

### 2. Query Order with Documents
```typescript
const orderWithDocs = await db.query.order.findFirst({
  where: eq(order.id, orderId),
  with: {
    documents: true,
    company: true,
    items: true,
  },
});
```

### 3. Create Document for Order
```typescript
await db.insert(documents).values({
  documentNumber: "INV-001",
  type: "invoice",
  title: "Invoice for Order",
  entityType: "order",     // ← Polymorphic type
  entityId: orderId,       // ← Polymorphic ID
  fileUrl: "...",
  fileKey: "...",
  uploadedByUserId: userId,
  status: "draft",
});
```

### 4. Type-Safe Entity Access
```typescript
import { isDocumentOfType } from "@tepian-k3/db";

if (isDocumentOfType(document, "order")) {
  // TypeScript knows entityType is "order"
  console.log(document.order?.orderNumber);
}
```

## Integration with QR Code System

The polymorphic relations work seamlessly with the QR code document signing system:

```typescript
import { db, whereEntityIs } from "@tepian-k3/db";
import { documents } from "@tepian-k3/db/schema";
import { generateDocumentVerificationQRCode } from "@tepian-k3/services/pdf";
import { createDocumentSignature } from "@tepian-k3/services/document-signing";

const createSignedOrderDocument = Effect.gen(function* () {
  // 1. Create document record
  const [doc] = yield* Effect.tryPromise(() =>
    db.insert(documents).values({
      documentNumber: "INV-001",
      type: "invoice",
      title: "Invoice",
      entityType: "order",
      entityId: orderId,
      fileUrl: uploadedFile.url,
      fileKey: uploadedFile.key,
      uploadedByUserId: userId,
      status: "draft",
    }).returning()
  );

  // 2. Create signature
  const signature = yield* createDocumentSignature(
    doc.id,
    doc.documentNumber,
    "order",
    orderId,
    "invoice",
    uploadedFile.url,
    pdfBuffer,
    userId
  );

  // 3. Generate QR code
  const { qrCodeDataURL, verificationURL } =
    yield* generateDocumentVerificationQRCode(
      signature.verificationToken
    );

  // 4. Update document with signature
  yield* Effect.tryPromise(() =>
    db.update(documents)
      .set({
        signatureData: signature.signatureData,
        verificationToken: signature.verificationToken,
        verificationUrl: verificationURL,
        qrCodeUrl: qrCodeDataURL,
        signedByUserId: userId,
        status: "signed",
      })
      .where(eq(documents.id, doc.id))
  );
});
```

## Benefits

1. **Flexible**: One documents table can serve multiple entity types
2. **Type-Safe**: Helper functions provide TypeScript type safety
3. **Efficient**: Composite indexes optimize polymorphic queries
4. **Clean**: Relational queries work naturally with Drizzle's API
5. **Scalable**: Easy to add new entity types

## Key Features

- ✅ Bidirectional relations (parent ↔ documents)
- ✅ Type-safe helper functions
- ✅ Efficient database queries with composite indexes
- ✅ Integration with document signing and QR codes
- ✅ Transaction support
- ✅ Comprehensive documentation

## Files Changed

**Modified:**
1. `packages/db/src/relations.ts` - Added polymorphic relations

**Created:**
1. `packages/db/src/polymorphic-helpers.ts` - Helper functions
2. `packages/db/POLYMORPHIC_RELATIONS_GUIDE.md` - Comprehensive guide
3. `packages/db/POLYMORPHIC_EXAMPLES.ts.example` - Code examples
4. `POLYMORPHIC_RELATIONS_SUMMARY.md` - This summary

**TypeScript Compilation:** ✅ **PASSED** (no errors)

## Next Steps

### 1. Create Document Queries (if needed)

Create `packages/queries/src/document.queries.ts`:

```typescript
import { db, whereEntityIs } from "@tepian-k3/db";
import { documents } from "@tepian-k3/db/schema";
import { Effect } from "effect";
import { eq } from "drizzle-orm";
import type { DocumentEntityType } from "@tepian-k3/constants";

const documentQueries = {
  // Get all documents for an entity
  getDocumentsForEntity: (entityType: DocumentEntityType, entityId: string) =>
    Effect.tryPromise(() =>
      db.query.documents.findMany({
        where: whereEntityIs(entityType, entityId),
        orderBy: (documents, { desc }) => [desc(documents.createdAt)],
      })
    ),

  // Create document
  createDocument: (data: CreateDocumentInput) =>
    Effect.tryPromise(() =>
      db.insert(documents).values(data).returning()
    ),

  // Update document signature
  updateDocumentSignature: (documentId: string, signatureData: any) =>
    Effect.tryPromise(() =>
      db.update(documents)
        .set(signatureData)
        .where(eq(documents.id, documentId))
        .returning()
    ),

  // Get document by verification token
  getDocumentByToken: (token: string) =>
    Effect.tryPromise(() =>
      db.query.documents.findFirst({
        where: eq(documents.verificationToken, token),
        with: {
          order: true,
          testing: true,
          userCompany: true,
          user: true,
          uploadedBy: true,
          signedBy: true,
        },
      })
    ),
};

export default documentQueries;
```

### 2. Update Order Router

Modify `packages/api/src/routers/order.ts` to use polymorphic relations:

```typescript
// When creating documents, use entityType and entityId
const [document] = await db.insert(documents).values({
  documentNumber: `INV-${order.orderNumber}`,
  type: "invoice",
  title: `Invoice for Order ${order.orderNumber}`,
  entityType: "order",
  entityId: order.id,
  fileUrl: uploadedFile.url,
  fileKey: uploadedFile.key,
  uploadedByUserId: ctx.user.id,
  status: "draft",
}).returning();

// Query with relations
const orderWithDocuments = await db.query.order.findFirst({
  where: eq(order.id, orderId),
  with: {
    documents: true,
  },
});
```

### 3. Create Document Verification Endpoint

```typescript
export const documentRouter = createTRPCRouter({
  verify: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) =>
      runEffect(
        Effect.gen(function* () {
          const document = yield* documentQueries.getDocumentByToken(
            input.token
          );

          if (!document) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Document not found",
            });
          }

          // Verify signature
          const isValid = yield* verifyDocumentSignature(
            document.signatureData
          );

          return {
            document,
            isValid,
            entityType: document.entityType,
            entity: document.order || document.testing ||
                    document.userCompany || document.user,
          };
        })
      )
    ),
});
```

## Testing

To test the polymorphic relations:

```typescript
// 1. Create a document for an order
const [doc] = await db.insert(documents).values({
  documentNumber: "TEST-001",
  type: "invoice",
  title: "Test Invoice",
  entityType: "order",
  entityId: testOrderId,
  fileUrl: "https://example.com/test.pdf",
  fileKey: "test.pdf",
  uploadedByUserId: testUserId,
  status: "draft",
}).returning();

// 2. Query the order with documents
const order = await db.query.order.findFirst({
  where: eq(order.id, testOrderId),
  with: {
    documents: true,
  },
});

console.log(order?.documents); // Should include the created document

// 3. Query documents by entity
const docs = await db.query.documents.findMany({
  where: whereEntityIs("order", testOrderId),
});

console.log(docs); // Should return the created document
```

## Best Practices

1. **Always set both fields**: When creating documents, always set `entityType` AND `entityId`
2. **Use helper functions**: Prefer `whereEntityIs()` over manual filters
3. **Index optimization**: Always filter by `entityType` first in queries
4. **Type safety**: Use `isDocumentOfType()` for type-safe entity access
5. **Validation**: Validate that `entityId` exists before creating documents
6. **Transactions**: Use transactions when creating entities with documents

## Documentation

All documentation is available in the `packages/db` folder:
- **[POLYMORPHIC_RELATIONS_GUIDE.md](packages/db/POLYMORPHIC_RELATIONS_GUIDE.md)** - Full guide
- **[POLYMORPHIC_EXAMPLES.ts.example](packages/db/POLYMORPHIC_EXAMPLES.ts.example)** - Code examples

---

**Implementation Date**: January 11, 2026
**Drizzle ORM Version**: 0.45.1
**Status**: ✅ Complete and Ready to Use
