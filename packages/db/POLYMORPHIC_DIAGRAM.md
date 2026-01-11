# Polymorphic Relations Diagram

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCUMENTS TABLE                          │
│  (Polymorphic - belongs to one of many entity types)       │
├─────────────────────────────────────────────────────────────┤
│  id: uuid (PK)                                              │
│  documentNumber: string                                     │
│  type: enum (invoice, offering_document, etc.)             │
│  title: string                                              │
│  entityType: enum ('order', 'testing', 'user_company', ... )│ ◄─┐
│  entityId: uuid (polymorphic foreign key)                  │ ◄─┤
│  fileUrl: string                                            │   │
│  fileKey: string                                            │   │
│  signatureData: string                                      │   │
│  verificationToken: string                                  │   │
│  verificationUrl: string                                    │   │
│  qrCodeUrl: string                                          │   │
│  uploadedByUserId: uuid → users.id                         │   │
│  signedByUserId: uuid → users.id                           │   │
│  status: enum (draft, signed, verified)                    │   │
│  createdAt: timestamp                                       │   │
│  updatedAt: timestamp                                       │   │
└─────────────────────────────────────────────────────────────┘   │
                                                                   │
                        Polymorphic Relationship                  │
                    (based on entityType + entityId)              │
                                                                   │
    ┌──────────────────────┬──────────────────┬──────────────────┘
    │                      │                  │
    │ entityType='order'   │ entityType=      │ entityType=
    │                      │ 'testing'        │ 'user_company'
    ▼                      ▼                  ▼
┌─────────┐         ┌──────────┐       ┌────────────────┐
│  ORDER  │         │  TESTING │       │ USER_COMPANIES │
├─────────┤         ├──────────┤       ├────────────────┤
│ id (PK) │         │ id (PK)  │       │ id (PK)        │
│ ...     │         │ ...      │       │ ...            │
└─────────┘         └──────────┘       └────────────────┘
    ▲                    ▲                    ▲
    │                    │                    │
    │                    │                    │
    └────────────────────┴────────────────────┘
            documents relation (many)
```

## Bidirectional Relations

### From Parent Entity → Documents (One-to-Many)

```typescript
// ORDER → DOCUMENTS
┌──────────────┐
│    ORDER     │
│    (id)      │
└──────────────┘
       │
       │ has many
       ▼
┌──────────────┐
│  DOCUMENTS   │
│  where       │
│  entityType  │
│  = 'order'   │
│  AND         │
│  entityId    │
│  = order.id  │
└──────────────┘

order.documents ──> documents[]
```

### From Documents → Parent Entity (Many-to-One)

```typescript
// DOCUMENTS → ORDER
┌──────────────┐
│  DOCUMENTS   │
│  (entityId)  │
│  entityType  │
│  = 'order'   │
└──────────────┘
       │
       │ belongs to
       ▼
┌──────────────┐
│    ORDER     │
│    (id)      │
└──────────────┘

document.order ──> order | null
```

## Query Flow

### 1. Get Order with Documents

```
User Query
    │
    ▼
db.query.order.findFirst({
  where: eq(order.id, orderId),
  with: { documents: true }
})
    │
    ▼
┌─────────────────────────────────────┐
│  Drizzle ORM                        │
│  1. SELECT * FROM order             │
│     WHERE id = orderId              │
│                                     │
│  2. SELECT * FROM documents         │
│     WHERE entityType = 'order'      │
│     AND entityId = orderId          │
└─────────────────────────────────────┘
    │
    ▼
{
  id: "...",
  orderNumber: "...",
  documents: [
    { id: "...", type: "invoice", ... },
    { id: "...", type: "offering_document", ... }
  ]
}
```

### 2. Get Documents for Order

```
User Query
    │
    ▼
db.query.documents.findMany({
  where: whereEntityIs("order", orderId)
})
    │
    ▼
┌─────────────────────────────────────┐
│  whereEntityIs() helper             │
│  = and(                             │
│      eq(documents.entityType, 'order'),│
│      eq(documents.entityId, orderId)│
│    )                                │
└─────────────────────────────────────┘
    │
    ▼
SELECT * FROM documents
WHERE entity_type = 'order'
AND entity_id = orderId
    │
    ▼
[
  { id: "...", type: "invoice", ... },
  { id: "...", type: "offering_document", ... }
]
```

### 3. Get Document with Parent Entity

```
User Query
    │
    ▼
const doc = db.query.documents.findFirst({
  where: eq(documents.id, docId)
})
    │
    ▼
Determine entityType
    │
    ├─ 'order' ──────────┐
    ├─ 'testing' ────────┤
    ├─ 'user_company' ───┤
    └─ 'user' ───────────┘
                         │
                         ▼
db.query.documents.findFirst({
  where: eq(documents.id, docId),
  with: {
    [getEntityRelationName(doc.entityType)]: true
  }
})
    │
    ▼
{
  id: "...",
  entityType: "order",
  entityId: "...",
  order: {
    id: "...",
    orderNumber: "..."
  }
}
```

## Database Indexes

```sql
-- Composite index for polymorphic queries
CREATE INDEX documents_entity_idx
  ON documents(entity_type, entity_id);

-- This index optimizes queries like:
-- WHERE entity_type = 'order' AND entity_id = ?
```

## Relationship Summary

```
┌─────────────────────────────────────────────────────────────┐
│                  POLYMORPHIC PATTERN                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ONE documents table can reference MANY entity types       │
│                                                             │
│  ┌─────────────┐                                           │
│  │  documents  │                                           │
│  │             │   entityType = 'order'                    │
│  │ entityType  ├──────────────────────► ORDER             │
│  │ entityId    │                                           │
│  │             │   entityType = 'testing'                  │
│  │             ├──────────────────────► TESTING           │
│  │             │                                           │
│  │             │   entityType = 'user_company'             │
│  │             ├──────────────────────► USER_COMPANIES    │
│  │             │                                           │
│  │             │   entityType = 'user'                     │
│  │             └──────────────────────► USERS             │
│  └─────────────┘                                           │
│                                                             │
│  Each document belongs to exactly ONE entity               │
│  Each entity can have MANY documents                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Integration with Document Signing & QR Codes

```
┌───────────────────────────────────────────────────────────────┐
│              COMPLETE DOCUMENT FLOW                           │
└───────────────────────────────────────────────────────────────┘

1. Create Order
   ┌──────────┐
   │  ORDER   │
   └──────────┘
        │
        ▼

2. Generate PDF
   ┌──────────┐
   │   PDF    │
   │  Buffer  │
   └──────────┘
        │
        ▼

3. Upload to Storage
   ┌──────────┐
   │ Storage  │
   │ (S3/etc) │
   └──────────┘
        │
        ▼

4. Create Document Record (Polymorphic)
   ┌─────────────────────┐
   │   documents table   │
   │  entityType='order' │
   │  entityId=order.id  │
   │  status='draft'     │
   └─────────────────────┘
        │
        ▼

5. Generate Signature (JWT + Hash)
   ┌─────────────────────┐
   │  signatureData      │
   │  verificationToken  │
   │  fileHash           │
   └─────────────────────┘
        │
        ▼

6. Generate QR Code
   ┌─────────────────────┐
   │  QR Code DataURL    │
   │  verificationURL    │
   └─────────────────────┘
        │
        ▼

7. Update Document Record
   ┌─────────────────────┐
   │   documents table   │
   │  + signatureData    │
   │  + verificationToken│
   │  + verificationUrl  │
   │  status='signed'    │
   └─────────────────────┘
        │
        ▼

8. Regenerate PDF with QR Code
   ┌──────────────────┐
   │ Final PDF with   │
   │  embedded QR     │
   └──────────────────┘
        │
        ▼

9. Update Storage
   ✓ Complete
```

## Type Safety Flow

```typescript
// TypeScript ensures proper usage

┌─────────────────────────────────────────┐
│  Compile Time (TypeScript)              │
├─────────────────────────────────────────┤
│                                         │
│  entityType must be:                    │
│  - 'order'                              │
│  - 'testing'                            │
│  - 'user_company'                       │
│  - 'user'                               │
│                                         │
│  Helper functions enforce types         │
│  whereEntityIs(type, id) → SQL          │
│  isDocumentOfType(doc, type) → boolean  │
│                                         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Runtime (Database + Drizzle)           │
├─────────────────────────────────────────┤
│                                         │
│  Database enforces:                     │
│  - entityType enum constraint           │
│  - NOT NULL constraints                 │
│  - Index optimization                   │
│                                         │
│  Drizzle ORM handles:                   │
│  - Relation resolution                  │
│  - Type inference                       │
│  - Query building                       │
│                                         │
└─────────────────────────────────────────┘
```

## Benefits Visualization

```
┌────────────────────────────────────────────────────────────┐
│  WITHOUT POLYMORPHIC                                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────┐                                      │
│  │ order_documents │ ──► one table per entity             │
│  └─────────────────┘                                      │
│  ┌───────────────────┐                                    │
│  │ testing_documents │ ──► code duplication               │
│  └───────────────────┘                                    │
│  ┌──────────────────────────┐                             │
│  │ user_company_documents   │ ──► hard to query all       │
│  └──────────────────────────┘                             │
│  ┌─────────────────┐                                      │
│  │ user_documents  │ ──► maintenance burden               │
│  └─────────────────┘                                      │
│                                                            │
└────────────────────────────────────────────────────────────┘

                          VS

┌────────────────────────────────────────────────────────────┐
│  WITH POLYMORPHIC                                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────┐                                         │
│  │  documents   │ ──► single unified table                │
│  │  (with       │ ──► consistent schema                   │
│  │  entityType  │ ──► easy to query                       │
│  │  & entityId) │ ──► less code                           │
│  └──────────────┘ ──► maintainable                        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```
