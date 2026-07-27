# Polymorphic Relations Guide - Drizzle ORM 0.45.1

This guide explains how to work with polymorphic relations between `documents` and other entities (`order`, `testing`, `user_company`, `user`) in Drizzle ORM.

## Schema Structure

The `documents` table uses a polymorphic pattern with two columns:
- `entityType`: An enum that specifies which table the document belongs to (`"order"`, `"testing"`, `"user_company"`, or `"user"`)
- `entityId`: A UUID that references the ID of the parent entity

```typescript
// In schema.ts
export const documents = createTable("documents", {
  // ... other fields
  entityType: documentEntityTypeEnum("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  // ... other fields
});
```

## Relations Setup

The relations are set up in `relations.ts`:

```typescript
// Order can have many documents
export const orderRelations = relations(order, ({ one, many }) => ({
  // ... other relations
  documents: many(documents, {
    relationName: "orderDocuments",
  }),
}));

// Document belongs to one of: order, testing, userCompany, or user
export const documentsRelations = relations(documents, ({ one, many }) => ({
  // ... other relations
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

## Usage Examples

### 1. Query Documents for a Specific Order

```typescript
import { db, whereEntityIs } from "@tepian-k3/db";

// Get all documents for an order
const orderDocuments = await db.query.documents.findMany({
  where: whereEntityIs("order", orderId),
});

// Get documents with related data
const documentsWithOrder = await db.query.documents.findMany({
  where: whereEntityIs("order", orderId),
  with: {
    order: true,
    uploadedBy: true,
    signedBy: true,
  },
});
```

### 2. Query Order with All Its Documents

```typescript
import { db } from "@tepian-k3/db";
import { order } from "@tepian-k3/db/schema";
import { eq } from "drizzle-orm";

// Get order with all related documents
const orderWithDocuments = await db.query.order.findFirst({
  where: eq(order.id, orderId),
  with: {
    documents: true,
    company: true,
    items: true,
  },
});

// Access documents
console.log(orderWithDocuments?.documents);
```

### 3. Create a Document for an Order

```typescript
import { db } from "@tepian-k3/db/client";
import { documents } from "@tepian-k3/db/schema";
import { Effect } from "effect";

const createOrderDocument = (orderId: string, data: DocumentData) =>
  Effect.gen(function* () {
    const [document] = yield* Effect.tryPromise(() =>
      db
        .insert(documents)
        .values({
          documentNumber: data.documentNumber,
          type: data.type,
          title: data.title,
          entityType: "order", // ← Polymorphic type
          entityId: orderId,   // ← Polymorphic ID
          fileUrl: data.fileUrl,
          fileKey: data.fileKey,
          uploadedByUserId: data.userId,
          status: "draft",
        })
        .returning()
    );

    return document;
  });
```

### 4. Query with Conditional Include Based on Entity Type

```typescript
import { db, getEntityRelationName } from "@tepian-k3/db";

const getDocumentWithEntity = async (documentId: string) => {
  const document = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
  });

  if (!document) return null;

  // Fetch with the correct relation
  const relationName = getEntityRelationName(document.entityType);

  const documentWithEntity = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
    with: {
      [relationName]: true,
      uploadedBy: true,
      signedBy: true,
    },
  });

  return documentWithEntity;
};
```

### 5. Filter Documents by Type and Entity

```typescript
import { db } from "@tepian-k3/db/client";
import { documents } from "@tepian-k3/db/schema";
import { and, eq } from "drizzle-orm";

// Get all invoices for an order
const invoices = await db
  .select()
  .from(documents)
  .where(
    and(
      eq(documents.entityType, "order"),
      eq(documents.entityId, orderId),
      eq(documents.type, "invoice")
    )
  );

// Get all testing reports for a testing session
const reports = await db.query.documents.findMany({
  where: and(
    eq(documents.entityType, "testing"),
    eq(documents.entityId, testingId),
    eq(documents.type, "testing_report")
  ),
});
```

### 6. Type-Safe Polymorphic Queries

```typescript
import { db, isDocumentOfType } from "@tepian-k3/db";

const document = await db.query.documents.findFirst({
  where: eq(documents.id, documentId),
  with: {
    order: true,
    testing: true,
  },
});

if (!document) return null;

// Type-safe access based on entityType
if (isDocumentOfType(document, "order")) {
  // TypeScript knows document.order might be populated
  console.log(document.order?.orderNumber);
} else if (isDocumentOfType(document, "testing")) {
  // TypeScript knows document.testing might be populated
  console.log(document.testing?.testingNumber);
}
```

### 7. Bulk Query Documents for Multiple Orders

```typescript
import { db } from "@tepian-k3/db/client";
import { documents, order } from "@tepian-k3/db/schema";
import { eq, inArray } from "drizzle-orm";

const orderIds = ["order-1", "order-2", "order-3"];

const allOrderDocuments = await db
  .select()
  .from(documents)
  .where(
    and(
      eq(documents.entityType, "order"),
      inArray(documents.entityId, orderIds)
    )
  );
```

### 8. Complex Query with Joins

```typescript
import { db } from "@tepian-k3/db/client";
import { documents, order, users } from "@tepian-k3/db/schema";
import { eq, and } from "drizzle-orm";

// Get documents with order and user info
const result = await db
  .select({
    document: documents,
    order: order,
    uploadedBy: users,
  })
  .from(documents)
  .leftJoin(
    order,
    and(
      eq(documents.entityType, "order"),
      eq(documents.entityId, order.id)
    )
  )
  .leftJoin(users, eq(documents.uploadedByUserId, users.id))
  .where(eq(documents.entityType, "order"));
```

## Helper Functions

### whereEntityIs

Creates a WHERE condition for polymorphic queries:

```typescript
import { whereEntityIs } from "@tepian-k3/db";

const docs = await db.query.documents.findMany({
  where: whereEntityIs("order", orderId),
});
```

### getEntityRelationName

Gets the correct relation name for dynamic includes:

```typescript
import { getEntityRelationName } from "@tepian-k3/db";

const relationName = getEntityRelationName("order"); // Returns "order"
const relationName = getEntityRelationName("user_company"); // Returns "userCompany"
```

### isDocumentOfType

Type guard for type-safe entity type checking:

```typescript
import { isDocumentOfType } from "@tepian-k3/db";

if (isDocumentOfType(document, "order")) {
  // TypeScript knows document.entityType is "order"
}
```

## Integration with Document Signing

Here's a complete example integrating with the document signing service:

```typescript
import { db, whereEntityIs } from "@tepian-k3/db";
import { documents } from "@tepian-k3/db/schema";
import {
  createDocumentSignature,
  generateDocumentVerificationQRCode,
} from "@tepian-k3/services/document-signing";
import { generateInvoicePdf } from "@tepian-k3/services/pdf";
import { storageService } from "@tepian-k3/services/storage";
import { Effect } from "effect";
import { eq } from "drizzle-orm";

const generateSignedInvoice = (orderId: string, userId: string) =>
  Effect.gen(function* () {
    // 1. Get order data
    const order = yield* getOrderWithDetails(orderId);

    // 2. Generate initial PDF
    const pdfBuffer = yield* Effect.tryPromise(() =>
      generateInvoicePdf({
        order,
        invoiceNumber: `INV-${order.orderNumber}`,
      })
    );

    // 3. Upload to storage
    const uploadedFile = yield* storageService.upload(pdfBuffer, {
      filename: `invoice-${order.orderNumber}.pdf`,
      folder: "invoices",
    });

    // 4. Create document record with polymorphic relation
    const [document] = yield* Effect.tryPromise(() =>
      db
        .insert(documents)
        .values({
          documentNumber: `INV-${order.orderNumber}`,
          type: "invoice",
          title: `Invoice for Order ${order.orderNumber}`,
          entityType: "order", // ← Polymorphic type
          entityId: orderId,   // ← Polymorphic ID
          fileUrl: uploadedFile.url,
          fileKey: uploadedFile.key,
          uploadedByUserId: userId,
          status: "draft",
        })
        .returning()
    );

    // 5. Create signature
    const signature = yield* createDocumentSignature(
      document.id,
      document.documentNumber,
      "order",
      orderId,
      "invoice",
      uploadedFile.url,
      pdfBuffer,
      userId
    );

    // 6. Generate QR code
    const { qrCodeDataURL, verificationURL } =
      yield* generateDocumentVerificationQRCode(
        signature.verificationToken
      );

    // 7. Update document with signature
    const [updatedDocument] = yield* Effect.tryPromise(() =>
      db
        .update(documents)
        .set({
          signatureData: signature.signatureData,
          verificationToken: signature.verificationToken,
          verificationUrl: verificationURL,
          signedByUserId: userId,
          status: "signed",
        })
        .where(eq(documents.id, document.id))
        .returning()
    );

    // 8. Regenerate PDF with QR code
    const finalPdfBuffer = yield* Effect.tryPromise(() =>
      generateInvoicePdf({
        order,
        invoiceNumber: `INV-${order.orderNumber}`,
        qrCodeDataURL,
        verificationURL,
      })
    );

    // 9. Update storage
    yield* storageService.upload(finalPdfBuffer, {
      filename: `invoice-${order.orderNumber}.pdf`,
      folder: "invoices",
    });

    return updatedDocument;
  });
```

## Query All Documents for an Order

```typescript
// In your order queries file
import { db, whereEntityIs } from "@tepian-k3/db";

export const getOrderWithAllDocuments = (orderId: string) =>
  Effect.gen(function* () {
    const order = yield* Effect.tryPromise(() =>
      db.query.order.findFirst({
        where: eq(order.id, orderId),
        with: {
          company: true,
          items: {
            with: {
              parameter: true,
            },
          },
          documents: {
            with: {
              uploadedBy: true,
              signedBy: true,
            },
          },
        },
      })
    );

    return order;
  });

// Alternative: Using whereEntityIs
export const getDocumentsForOrder = (orderId: string) =>
  Effect.tryPromise(() =>
    db.query.documents.findMany({
      where: whereEntityIs("order", orderId),
      orderBy: (documents, { desc }) => [desc(documents.createdAt)],
    })
  );
```

## Best Practices

1. **Always Specify Entity Type**: When creating documents, always set both `entityType` and `entityId`
2. **Use Helper Functions**: Use `whereEntityIs()` for cleaner queries
3. **Type Safety**: Use `isDocumentOfType()` for type-safe access to polymorphic relations
4. **Indexing**: The schema includes composite indexes on `(entityType, entityId)` for performance
5. **Validation**: Always validate that the entityId exists in the target table before creating a document
6. **Queries**: When querying documents, always filter by `entityType` first for optimal index usage

## Limitations

Since Drizzle doesn't have built-in polymorphic support:
- You need to manually filter by `entityType` when querying
- All possible relations are defined, but only one will have data
- TypeScript won't enforce that only the correct relation is populated
- Use the helper functions and type guards to maintain type safety

## Migration Example

If you're adding this to an existing database:

```sql
-- The schema should already have these columns
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS entity_type document_entity_type NOT NULL DEFAULT 'order',
  ADD COLUMN IF NOT EXISTS entity_id UUID NOT NULL;

-- Add composite index for polymorphic queries
CREATE INDEX IF NOT EXISTS documents_entity_idx
  ON documents(entity_type, entity_id);

-- Add check constraint to ensure entityId references valid entity
-- Note: This is optional and depends on your requirements
ALTER TABLE documents
  ADD CONSTRAINT documents_entity_check
  CHECK (
    (entity_type = 'order' AND entity_id IN (SELECT id FROM "order"))
    OR (entity_type = 'testing' AND entity_id IN (SELECT id FROM testing))
    OR (entity_type = 'user_company' AND entity_id IN (SELECT id FROM user_companies))
    OR (entity_type = 'user' AND entity_id IN (SELECT id FROM users))
  );
```

## Summary

Polymorphic relations in Drizzle 0.45.1 work by:
1. Defining `entityType` and `entityId` columns in the polymorphic table
2. Setting up relations for all possible parent tables
3. Using WHERE filters to query by entity type
4. Using helper functions for type safety and cleaner code

The implementation provides flexibility while maintaining referential integrity through the database schema and application-level validation.
