# Pelatihan Cart & Free Enrollment - Quick Reference

This document provides a quick overview of the cart system and free/paid enrollment flows for the Pelatihan feature.

## Overview

The Pelatihan feature supports **two enrollment methods**:

1. **Free Trainings** - Direct enrollment (no payment required)
2. **Paid Trainings** - Cart → Checkout → Order → Payment → Auto-enrollment

## Database Tables Summary

Total: **12 tables**

1. `pelatihan` - Training courses (price = 0 for free courses)
2. `pelatihan_categories` - Categories
3. **`pelatihan_cart`** - Shopping cart (NEW)
4. `pelatihan_materials` - Learning materials
5. `pelatihan_assessments` - Pre/Post tests
6. `pelatihan_questions` - Questions
7. `pelatihan_question_options` - Answer options
8. `pelatihan_enrollments` - User enrollments (links to orderId for paid)
9. `pelatihan_progress` - Material completion tracking
10. `pelatihan_assessment_attempts` - Test attempts
11. `pelatihan_assessment_answers` - User answers
12. `pelatihan_certificates` - Certificates with QR verification

## Enrollment Flows

### Free Training Flow

```
User Action                    System Response
─────────────────────────────────────────────────────────
Browse /pelatihan
  → View training details
  → Click "Enroll Now"        → Check prerequisites
                              → Create enrollment (status: "enrolled")
                              → Redirect to /my-trainings/{id}
  → Access materials
  → Take assessments
  → Receive certificate
```

### Paid Training Flow

```
User Action                    System Response
─────────────────────────────────────────────────────────
Browse /pelatihan
  → View training details
  → Click "Add to Cart"       → Add to pelatihan_cart

View /pelatihan/cart
  → Review items
  → Click "Checkout"          → Create order (type: "pelatihan")
                              → Clear cart
                              → Redirect to /pengujian/status/{orderId}

Upload payment proof          → Admin receives notification

Wait for admin approval

Admin confirms payment        → Auto-create enrollment (status: "enrolled")
                              → Email notification to user

Access /pelatihan/my-trainings
  → View enrolled training
  → Access materials
  → Take assessments
  → Receive certificate
```

## API Routers (10 Total)

1. **`pelatihan.ts`** - Training CRUD, publish, archive
2. **`pelatihan-categories.ts`** - Category management
3. **`pelatihan-cart.ts`** - Cart operations (NEW)
   - `getMyCart` - Get user's cart
   - `addToCart` - Add training to cart
   - `updateQuantity` - Update quantity
   - `removeFromCart` - Remove item
   - `clearCart` - Clear cart
   - `getCartSummary` - Get totals
4. **`pelatihan-materials.ts`** - Upload materials
5. **`pelatihan-assessments.ts`** - Create tests
6. **`pelatihan-questions.ts`** - Manage questions
7. **`pelatihan-enrollments.ts`** - Enrollment logic
8. **`pelatihan-progress.ts`** - Track progress
9. **`pelatihan-assessment-attempts.ts`** - Take tests
10. **`pelatihan-certificates.ts`** - Generate/verify certificates

## Frontend Routes

```
/pelatihan/
├── index.tsx                           # Browse trainings
├── cart/
│   ├── index.tsx                       # View cart (NEW)
│   └── checkout.tsx                    # Checkout (NEW)
├── $slug/
│   ├── index.tsx                       # Training details
│   └── enroll.tsx                      # Free enrollment only
└── my-trainings/
    ├── index.tsx                       # My enrollments
    └── $enrollmentId/
        ├── index.tsx                   # Dashboard
        ├── materials/$materialId.tsx   # View material
        ├── assessment/$assessmentId/
        │   ├── index.tsx               # Instructions
        │   ├── take.tsx                # Take test
        │   └── results.tsx             # Results
        └── certificate.tsx             # Certificate
```

## Integration with Existing Systems

### 1. Order System

The existing `order` and `orderItem` tables support pelatihan:

```typescript
// orderItem already supports polymorphic relations
{
  type: "pelatihan",         // NEW item type
  entityId: pelatihanId,     // Reference to pelatihan.id
  quantity: 1,
  unitPrice: 500000,
  ...
}
```

### 2. Cart → Order Flow

```typescript
// 1. Cart items
pelatihanCart: {
  userId: "user-123",
  pelatihanId: "pelatihan-456",
  quantity: 1,
  unitPrice: 500000,
}

// 2. On checkout → create order
order: {
  userId: "user-123",
  status: "pending",
  totalAmount: 500000,
}

orderItem: {
  orderId: "order-789",
  type: "pelatihan",
  entityId: "pelatihan-456",
  quantity: 1,
  unitPrice: 500000,
}

// 3. After payment confirmed → create enrollment
pelatihanEnrollments: {
  userId: "user-123",
  pelatihanId: "pelatihan-456",
  orderId: "order-789",
  status: "enrolled",
}

// 4. Clear cart
DELETE FROM pelatihan_cart WHERE userId = "user-123"
```

### 3. Payment Confirmation Webhook

Add to existing order payment confirmation handler:

```typescript
// packages/api/src/routers/order.ts
confirmPayment: withPermission("orders.update")
  .input(z.object({ orderId: z.uuidv7() }))
  .mutation(async ({ input }) =>
    await runEffect(
      Effect.gen(function* () {
        // Update order status
        const order = yield* orderQueries.updateStatus(
          input.orderId,
          "paid"
        );

        // Get order items
        const items = yield* orderQueries.getOrderItems(input.orderId);

        // Create enrollments for pelatihan items
        for (const item of items) {
          if (item.type === "pelatihan") {
            yield* pelatihanEnrollmentQueries.createEnrollment({
              userId: order.userId,
              pelatihanId: item.entityId,
              orderId: order.id,
              status: "enrolled",
            });

            // Send email notification
            yield* emailService.sendEnrollmentConfirmation({
              email: order.userEmail,
              pelatihanTitle: item.title,
            });
          }
        }

        return order;
      })
    )
  ),
```

## Key Business Rules

1. **Free Training Detection**

   ```typescript
   const isFree = pelatihan.price === 0;
   ```

2. **Enrollment Prerequisites**

   ```typescript
   // Check if user has completed prerequisite trainings
   if (pelatihan.prerequisiteIds?.length > 0) {
     const completedIds = await getCompletedTrainingIds(userId);
     const hasPrerequisites = pelatihan.prerequisiteIds.every((id) =>
       completedIds.includes(id),
     );
     if (!hasPrerequisites) {
       throw new Error("Prerequisites not met");
     }
   }
   ```

3. **Cart Item Uniqueness**

   ```typescript
   // One training per user per cart
   // Unique constraint: (userId, pelatihanId, deletedAt IS NULL)
   ```

4. **Auto-enrollment Trigger**
   - Happens when order status changes from "unpaid" → "paid"
   - Only for order items where `type = "pelatihan"`

5. **Certificate Eligibility**
   ```typescript
   const canGetCertificate =
     enrollment.status === "completed" &&
     enrollment.postTestScore >= pelatihan.minimumScore;
   ```

## Environment Variables

No new environment variables needed - uses existing:

- `POSTGRES_URL` - Database
- `JWT_DOCUMENT_SECRET` - Certificate signing
- `DOCUMENT_VERIFICATION_BASE_URL` - Certificate QR verification
- `STORAGE_PROVIDER` - Material file storage
- `EMAIL_PROVIDER` - Enrollment notifications

## Migration Checklist

### Phase 1: Database

- [ ] Add `pelatihan_cart` table
- [ ] Add `pelatihan` and related tables (11 more)
- [ ] Add `pelatihan` to `orderItemTypeEnum`
- [ ] Run migrations

### Phase 2: Backend

- [ ] Create `pelatihan-cart.queries.ts`
- [ ] Create `pelatihan-cart.schema.ts`
- [ ] Create `pelatihan-cart.ts` router
- [ ] Update `order.ts` router (payment confirmation hook)
- [ ] Add enrollment auto-creation logic

### Phase 3: Frontend

- [ ] Create `/pelatihan/cart/index.tsx`
- [ ] Create `/pelatihan/cart/checkout.tsx`
- [ ] Add "Add to Cart" button in training details
- [ ] Add cart icon in header with item count
- [ ] Add "Enroll Now" button for free trainings

### Phase 4: Testing

- [ ] Test free training enrollment
- [ ] Test paid training cart flow
- [ ] Test checkout and payment
- [ ] Test auto-enrollment after payment
- [ ] Test cart uniqueness constraint
- [ ] Test prerequisite checking

## Example Code Snippets

### Add to Cart

```typescript
// Frontend
const addToCart = useMutation(
  trpc.pelatihanCart.addToCart.mutationOptions()
);

<Button
  onClick={() =>
    addToCart.mutate({
      pelatihanId: pelatihan.id,
      quantity: 1,
    })
  }
>
  Add to Cart
</Button>
```

### Direct Enroll (Free)

```typescript
// Frontend
const enroll = useMutation(
  trpc.pelatihanEnrollments.enroll.mutationOptions()
);

{pelatihan.price === 0 ? (
  <Button
    onClick={() =>
      enroll.mutate({ pelatihanId: pelatihan.id })
    }
  >
    Enroll Now (Free)
  </Button>
) : (
  <Button onClick={handleAddToCart}>
    Add to Cart - Rp {pelatihan.price.toLocaleString()}
  </Button>
)}
```

### Cart Summary

```typescript
// Backend - pelatihan-cart.ts
getCartSummary: protectedProcedure.query(
  async ({ ctx }) =>
    await runEffect(
      Effect.gen(function* () {
        const items = yield* pelatihanCartQueries.getByUserId(ctx.user.id);

        const subtotal = items.reduce(
          (sum, item) =>
            sum +
            (item.discountPrice || item.unitPrice) * item.quantity,
          0
        );

        return {
          itemCount: items.length,
          subtotal,
          total: subtotal, // Add tax/fees if needed
        };
      })
    )
),
```

## Questions & Decisions

### Q: Can users add same training multiple times?

**A:** No. Unique constraint on `(userId, pelatihanId)`.

### Q: What happens to cart after successful payment?

**A:** Cart is cleared automatically after order creation.

### Q: Can users have multiple enrollments for same training?

**A:** No. Unique constraint on `(userId, pelatihanId)` in enrollments table.

### Q: Can free trainings be added to cart?

**A:** No. UI should show "Enroll Now" for free trainings, not "Add to Cart".

### Q: Can users mix testing orders and pelatihan orders?

**A:** Initially no - separate carts. Future: consider unified cart with multiple item types.

## See Also

- [Full Feature Design](./PELATIHAN_FEATURE_DESIGN.md) - Complete specification
- [Order System Integration](./ORDER_SYSTEM_INTEGRATION.md) - How orders work
- [Document Verification](./DOCUMENT_VERIFICATION.md) - Certificate QR verification
