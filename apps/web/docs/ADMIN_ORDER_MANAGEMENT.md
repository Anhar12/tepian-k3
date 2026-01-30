# Admin Order Management - Implementation Guide

## Overview

This document describes the admin-side order management system implemented in `/back-office/orders/$orderId.detail.tsx`. The system focuses on **document uploading** rather than generation, allowing admins to upload pre-created billing documents.

## Workflow States

The order detail page displays different UI based on 6 workflow states:

### 1. Pending Approval (`approvalStatus === 'pending'`)

**What admin sees:**

- Complete order items table with parameters, clusters, quantities, and prices
- Customer information card
- Testing location card
- Action buttons: "Tolak Order" (Reject) and "Setujui Order" (Approve)

**Actions available:**

- Approve order → moves to state 2
- Reject order with reason → sends notification to customer

### 2. Approved - Upload Documents (`approvalStatus === 'approved' && !hasBothDocuments`)

**What admin sees:**

- Two document upload sections:
  - Surat Penawaran (Offering Letter)
  - Invoice
- Each section shows:
  - Document icon with title
  - Status badge (Sudah Diunggah / Belum Diunggah)
  - File input (PDF only) when not uploaded
  - Download button when uploaded
- "Kirim Dokumen ke Pelanggan" button (enabled when both documents uploaded)

**Actions available:**

- Upload offering letter PDF
- Upload invoice PDF
- Send documents to customer via email → moves to state 3

### 3. Awaiting Payment (`approvalStatus === 'approved' && hasBothDocuments && paymentStatus === 'unpaid'`)

**What admin sees:**

- Two document cards showing uploaded documents with download buttons
- Message: "Dokumen penagihan sudah dikirim. Menunggu pelanggan mengunggah bukti pembayaran."
- "Kirim Ulang Dokumen" button

**Actions available:**

- Download uploaded documents
- Resend documents to customer

### 4. Payment Verification (`paymentStatus === 'pending_verification'`)

**What admin sees:**

- Payment proof uploaded by customer (image or PDF)
- Upload timestamp
- Amount to be paid (formatted in IDR)
- Action buttons: "Tolak Pembayaran" (Reject) and "Verifikasi Pembayaran" (Verify)

**Actions available:**

- View payment proof (opens in new tab if PDF, or shows image)
- Verify payment → moves to state 5
- Reject payment with reason → sends notification to customer

### 5. Payment Verified - Create Testing (`paymentStatus === 'paid' && !testing`)

**What admin sees:**

- Payment confirmation card (green background) showing:
  - Amount paid
  - Payment date
- Testing items preview (first 5 items, with count if more)
- "Buat Testing Record" button

**Actions available:**

- Create testing record from order → moves to state 6

### 6. Testing Created (`testing exists`)

**What admin sees:**

- Testing information card showing:
  - Testing number
  - Status badge
  - Worksheet link (if created)
- Action buttons: "Lihat Detail Testing" and "Buat Worksheet" (if not created)

**Actions available:**

- Navigate to testing detail page
- Navigate to testing detail with worksheet creation prompt

## UI Components Used

### Cards

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Status Badges

```tsx
// Order status
<Badge className={getOrderStatusBadge(order.status)}>
  {order.status}
</Badge>

// Approval status
<Badge className={getApprovalStatusBadge(order.approvalStatus)}>
  {order.approvalStatus}
</Badge>

// Payment status
<Badge className={getPaymentStatusBadge(order.paymentStatus)}>
  {order.paymentStatus}
</Badge>
```

### Document Upload UI

```tsx
<div className="flex items-center gap-3">
  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
    <FileText className="h-5 w-5 text-blue-500" />
  </div>
  <div>
    <Label className="text-base font-medium">Surat Penawaran</Label>
    <p className="text-sm text-muted-foreground">Format: PDF</p>
  </div>
</div>

<Input
  type="file"
  accept=".pdf"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setOfferingLetterFile(file);
    }
  }}
/>

<Button onClick={handleUploadOfferingLetter} disabled={uploadingOffering}>
  {uploadingOffering ? (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  ) : (
    <Upload className="mr-2 h-4 w-4" />
  )}
  Upload
</Button>
```

## API Procedures

### New Admin Procedures Added to `orderRouter`

#### 1. `approveOrder`

- **Permission:** `orders.approve`
- **Input:** `{ orderId: string, note?: string }`
- **Action:** Sets `approvalStatus` to 'approved', sends email notification
- **Query to implement:** `orderQueries.approveOrder(orderId)`

#### 2. `rejectOrderApproval`

- **Permission:** `orders.approve`
- **Input:** `{ orderId: string, reason: string }` (min 10 chars)
- **Action:** Sets `approvalStatus` to 'rejected', stores reason, sends email
- **Query to implement:** `orderQueries.rejectOrderApproval(orderId, reason)`

#### 3. `verifyPayment`

- **Permission:** `orders.verify-payment`
- **Input:** `{ orderId: string, note?: string }`
- **Action:** Sets `paymentStatus` to 'paid', sets `paidAt` timestamp, sends email
- **Query to implement:** `orderQueries.verifyPayment(orderId)`

#### 4. `rejectPayment`

- **Permission:** `orders.verify-payment`
- **Input:** `{ orderId: string, reason: string }` (min 10 chars)
- **Action:** Sets `paymentStatus` to 'rejected', stores reason, sends email
- **Query to implement:** `orderQueries.rejectPayment(orderId, reason)`

#### 5. `notifyCustomer`

- **Permission:** `orders.notify`
- **Input:** `{ orderId: string }`
- **Action:** Sends email with document download links
- **Requires:** Both offering letter and invoice documents uploaded

#### 6. `createTesting`

- **Permission:** `orders.create-testing`
- **Input:** `{ orderId: string }`
- **Action:** Creates testing record with testing items from order items
- **Query to implement:** `orderQueries.createTestingFromOrder(orderId)`

### Existing Procedures Used

- `getOrderWithDocuments` - Gets order with all documents, testing, and related data
- Document upload uses `document.uploadDocument` (from document router)

## Database Queries to Implement

Create these query functions in `packages/queries/src/order.queries.ts`:

```typescript
// Approve order
export const approveOrder = (orderId: string) =>
  Effect.tryPromise({
    try: async () => {
      const [order] = await db
        .update(orders)
        .set({
          approvalStatus: "approved",
          approvedAt: sql`CURRENT_TIMESTAMP`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(orders.id, orderId))
        .returning();

      // Create status history entry
      await db.insert(orderStatusHistory).values({
        orderId: order.id,
        status: order.status,
        note: "Order disetujui oleh admin",
      });

      return order;
    },
    catch: (error) => error as TRPCError,
  });

// Reject order approval
export const rejectOrderApproval = (orderId: string, reason: string) =>
  Effect.tryPromise({
    try: async () => {
      const [order] = await db
        .update(orders)
        .set({
          approvalStatus: "rejected",
          approvalRejectReason: reason,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(orders.id, orderId))
        .returning();

      // Create status history entry
      await db.insert(orderStatusHistory).values({
        orderId: order.id,
        status: "rejected",
        note: `Order ditolak: ${reason}`,
      });

      return order;
    },
    catch: (error) => error as TRPCError,
  });

// Verify payment
export const verifyPayment = (orderId: string) =>
  Effect.tryPromise({
    try: async () => {
      const [order] = await db
        .update(orders)
        .set({
          paymentStatus: "paid",
          paidAt: sql`CURRENT_TIMESTAMP`,
          status: "confirmed",
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(orders.id, orderId))
        .returning();

      // Create status history entry
      await db.insert(orderStatusHistory).values({
        orderId: order.id,
        status: "confirmed",
        note: "Pembayaran terverifikasi",
      });

      return order;
    },
    catch: (error) => error as TRPCError,
  });

// Reject payment
export const rejectPayment = (orderId: string, reason: string) =>
  Effect.tryPromise({
    try: async () => {
      const [order] = await db
        .update(orders)
        .set({
          paymentStatus: "rejected",
          paymentRejectedReason: reason,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(orders.id, orderId))
        .returning();

      // Create status history entry
      await db.insert(orderStatusHistory).values({
        orderId: order.id,
        status: order.status,
        note: `Pembayaran ditolak: ${reason}`,
      });

      return order;
    },
    catch: (error) => error as TRPCError,
  });

// Create testing from order
export const createTestingFromOrder = (orderId: string) =>
  Effect.tryPromise({
    try: async () => {
      // Get order with items
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: {
          items: {
            with: {
              parameter: true,
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order tidak ditemukan",
        });
      }

      // Create testing record
      const [testing] = await db
        .insert(testings)
        .values({
          orderId: order.id,
          status: "pending",
          testingNumber: `TEST-${order.orderNumber}`,
        })
        .returning();

      // Create testing items from order items
      await db.insert(testingItems).values(
        order.items.map((item) => ({
          testingId: testing.id,
          parameterId: item.parameterId,
          quantity: item.quantity,
          status: "pending",
        }))
      );

      // Update order status
      await db
        .update(orders)
        .set({
          status: "in_progress",
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(orders.id, orderId));

      return testing;
    },
    catch: (error) => error as TRPCError,
  });
```

## Permissions Required

Add these permissions to the database:

```sql
INSERT INTO permissions (name, description) VALUES
  ('orders.approve', 'Approve or reject orders'),
  ('orders.verify-payment', 'Verify or reject payment proof'),
  ('orders.notify', 'Send notifications to customers'),
  ('orders.create-testing', 'Create testing records from orders');
```

Assign to relevant roles (e.g., "Lab Manager", "Admin"):

```sql
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name IN ('Lab Manager', 'Admin')
  AND p.name IN ('orders.approve', 'orders.verify-payment', 'orders.notify', 'orders.create-testing');
```

## Email Templates Needed

Create these email templates in `packages/services/src/email/templates/`:

1. **order-approved.hbs** - Sent when order is approved
2. **order-rejected.hbs** - Sent when order is rejected
3. **billing-documents.hbs** - Sent with document download links
4. **payment-verified.hbs** - Sent when payment is verified
5. **payment-rejected.hbs** - Sent when payment is rejected

## Status Badge Colors

Helper functions already implemented in the route file:

```typescript
// Order status colors
pending: 'bg-yellow-100 text-yellow-800'
confirmed: 'bg-blue-100 text-blue-800'
in_progress: 'bg-purple-100 text-purple-800'
completed: 'bg-green-100 text-green-800'
rejected: 'bg-red-100 text-red-800'
cancelled: 'bg-gray-100 text-gray-800'
revision: 'bg-orange-100 text-orange-800'

// Approval status colors
pending: 'bg-amber-100 text-amber-800'
approved: 'bg-green-100 text-green-800'
rejected: 'bg-red-100 text-red-800'

// Payment status colors
unpaid: 'bg-orange-100 text-orange-800'
pending_verification: 'bg-blue-100 text-blue-800'
paid: 'bg-green-100 text-green-800'
rejected: 'bg-red-100 text-red-800'
```

## Next Steps

To complete the implementation, you need to:

1. **Implement database query functions** in `packages/queries/src/order.queries.ts`
2. **Add permissions** to database and assign to roles
3. **Create email templates** for notifications
4. **Update document router** to handle file uploads (if not already implemented)
5. **Add navigation** from back-office dashboard to order management
6. **Create order list page** at `/back-office/orders/index.tsx` with DataTable

## Testing Checklist

- [ ] Approve order functionality
- [ ] Reject order with reason
- [ ] Upload offering letter PDF
- [ ] Upload invoice PDF
- [ ] Send documents to customer
- [ ] Verify payment proof
- [ ] Reject payment with reason
- [ ] Create testing record
- [ ] Email notifications sent correctly
- [ ] UI state transitions work correctly
- [ ] Permission checks enforce access control
- [ ] File upload validation (PDF only)
- [ ] Loading states display correctly
- [ ] Error handling and toast messages

## File Locations

- **Route:** `apps/web/src/routes/(core)/back-office/orders/$orderId.detail.tsx`
- **API Router:** `packages/api/src/routers/order.ts` (updated with 6 new procedures)
- **Queries:** `packages/queries/src/order.queries.ts` (needs implementation)
- **Permissions:** Database permissions table
- **Email Templates:** `packages/services/src/email/templates/` (needs creation)
