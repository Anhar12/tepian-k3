# Notifications System Guide

This guide explains how to use the notifications system in the tepian-k3 application. The system provides both persistent database notifications and real-time event notifications through Server-Sent Events (SSE).

## Table of Contents

- [Overview](#overview)
- [Database Schema](#database-schema)
- [Notification Types](#notification-types)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)
- [Real-Time Events](#real-time-events)
- [Best Practices](#best-practices)

## Overview

The notification system consists of two main components:

1. **Persistent Notifications** - Stored in the database, can be read, marked as read, and deleted
2. **Real-Time Events** - Broadcast via SSE (Server-Sent Events) using Redis pub/sub

Both systems work together to provide a comprehensive notification experience:

- Database notifications provide a history and allow users to mark items as read
- Real-time events provide instant updates for active users

## Database Schema

### Notifications Table

```sql
CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "type" notification_type DEFAULT 'general' NOT NULL,
  "title" varchar(250) NOT NULL,
  "message" text NOT NULL,
  "is_read" boolean DEFAULT false NOT NULL,
  "read_at" timestamp with time zone,
  "order_id" uuid,
  "testing_id" uuid,
  "document_id" uuid,
  "metadata" jsonb,
  "deleted_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone
);
```

**Key Features:**

- **UUIDv7 Primary Keys**: Time-sortable identifiers
- **Soft Deletes**: `deletedAt` column for recoverable deletion
- **Entity Links**: Optional references to orders, testing, documents
- **Metadata**: Flexible JSONB field for additional context
- **Indexed**: Optimized queries on userId, isRead, type, and createdAt

## Notification Types

The system supports the following notification types:

| Type                   | Label                | Use Case                            |
| ---------------------- | -------------------- | ----------------------------------- |
| `order_status_changed` | Order Status Changed | When an order status changes        |
| `payment_received`     | Payment Received     | Payment proof uploaded and verified |
| `payment_rejected`     | Payment Rejected     | Payment proof rejected              |
| `testing_started`      | Testing Started      | Testing process has begun           |
| `testing_completed`    | Testing Completed    | Testing process finished            |
| `document_ready`       | Document Ready       | Document available for download     |
| `document_signed`      | Document Signed      | Document has been signed            |
| `assignment_received`  | Assignment Received  | New testing assignment              |
| `system_announcement`  | System Announcement  | System-wide announcements           |
| `general`              | General Notification | Default notification type           |

Each type has associated colors defined in `@tepian-k3/constants` for UI display.

## API Endpoints

### Get All Notifications

Retrieve paginated notifications for the current user.

```typescript
const notifications = await trpc.notifications.getAll.query({
  page: 1,
  limit: 20,
  isRead: false, // Optional: filter by read status
  type: "order_status_changed", // Optional: filter by type
});
```

**Response:**

```typescript
{
  data: Notification[],
  pagination: {
    page: number,
    limit: number,
    totalPages: number,
    totalItems: number,
  }
}
```

### Get Unread Count

Get the number of unread notifications.

```typescript
const count = await trpc.notifications.getUnreadCount.query();
// Returns: number
```

### Mark as Read

Mark a specific notification as read.

```typescript
await trpc.notifications.markAsRead.mutate({
  id: "notification-uuid",
});
```

### Mark All as Read

Mark all unread notifications as read.

```typescript
const result = await trpc.notifications.markAllAsRead.mutate();
// Returns: { success: true, updatedCount: number }
```

### Delete Notification

Soft delete a notification.

```typescript
await trpc.notifications.delete.mutate({
  id: "notification-uuid",
});
```

### Delete All Notifications

Soft delete all notifications for the current user.

```typescript
const result = await trpc.notifications.deleteAll.mutate();
// Returns: { success: true, deletedCount: number }
```

### Create Notification (Internal/Admin)

Create a new notification. Typically called internally by other routers or by admins.

```typescript
await trpc.notifications.create.mutate({
  userId: "user-uuid",
  type: "order_status_changed",
  title: "Order Status Updated",
  message: "Your order #12345 status has been changed to 'In Progress'",
  orderId: "order-uuid", // Optional
  metadata: { oldStatus: "pending", newStatus: "in_progress" }, // Optional
});
```

## Usage Examples

### Example 1: Notify User of Order Status Change

When updating an order status, create both a database notification and publish a real-time event:

```typescript
import { notificationsQueries } from "@tepian-k3/queries/notifications.queries";
import { getEventBus } from "@tepian-k3/services/notifications/event-bus";
import { runEffect } from "../utils";
import { Effect } from "effect";

// Inside your order router mutation
updateStatus: protectedProcedure
  .input(updateOrderStatusSchema)
  .mutation(async ({ input, ctx }) =>
    runEffect(
      Effect.gen(function* () {
        // 1. Update order status
        const order = yield* orderQueries.updateStatus(input.orderId, input.newStatus);

        // 2. Create database notification
        yield* notificationsQueries.create({
          userId: order.userId,
          type: "order_status_changed",
          title: "Order Status Updated",
          message: `Your order #${order.orderNumber} is now ${input.newStatus}`,
          orderId: order.id,
          metadata: {
            oldStatus: input.oldStatus,
            newStatus: input.newStatus,
            triggeredBy: ctx.user.id,
          },
        });

        // 3. Publish real-time event
        const eventBus = getEventBus();
        if (eventBus.connected) {
          await eventBus.publish("orderStatusChanged", {
            orderId: order.id,
            userId: order.userId,
            oldStatus: input.oldStatus,
            newStatus: input.newStatus,
            triggeredBy: ctx.user.id,
          });
        }

        return order;
      })
    )
  ),
```

### Example 2: Notify User When Document is Ready

```typescript
generateDocument: protectedProcedure
  .input(generateDocumentSchema)
  .mutation(async ({ input, ctx }) =>
    runEffect(
      Effect.gen(function* () {
        // Generate document
        const document = yield* documentQueries.generate(input);

        // Notify user
        yield* notificationsQueries.create({
          userId: document.userId,
          type: "document_ready",
          title: "Document Ready",
          message: `Your ${document.type} is ready for download`,
          documentId: document.id,
          orderId: document.orderId,
          metadata: {
            documentType: document.type,
            triggeredBy: ctx.user.id,
          },
        });

        return document;
      })
    )
  ),
```

### Example 3: System Announcement (Broadcast to All Users)

For system-wide announcements, you can create notifications for multiple users:

```typescript
sendSystemAnnouncement: protectedProcedure
  .input(z.object({
    title: z.string(),
    message: z.string(),
    userIds: z.array(z.string().uuid()), // Target specific users or all
  }))
  .mutation(async ({ input }) =>
    runEffect(
      Effect.gen(function* () {
        // Create notification for each user
        const notifications = yield* Effect.all(
          input.userIds.map((userId) =>
            notificationsQueries.create({
              userId,
              type: "system_announcement",
              title: input.title,
              message: input.message,
            })
          )
        );

        return { created: notifications.length };
      })
    )
  ),
```

## Real-Time Events

The real-time event system uses Redis pub/sub and Server-Sent Events (SSE).

### Subscribe to Events (Frontend)

```typescript
// In your event router or SSE endpoint
subscribe: protectedProcedure
  .input(z.object({
    types: z.array(z.enum(EventTypes)),
  }))
  .subscription(async ({ input, ctx, signal }) => {
    const eventBus = getEventBus();

    const context = {
      session: ctx.session,
      user: ctx.user,
    };

    // Subscribe to specific event types
    for await (const event of eventBus.subscribe(
      input.types,
      context,
      signal
    )) {
      yield event;
    }
  }),
```

### Event Schema

Events published to the event bus should match the schema in `@tepian-k3/schema/event.schema.ts`:

```typescript
{
  id: string (uuid),
  userId: string (uuid),
  orderId?: string (uuid),
  testingId?: string (uuid),
  documentId?: string (uuid),
  type: string,
  title: string,
  message: string,
  timestamp: Date,
  triggeredBy?: string (uuid),
  metadata?: Record<string, unknown>,
}
```

## Best Practices

### 1. Always Create Both Database and Real-Time Notifications

For important user actions, create both types:

- **Database notification**: Persistent history, can be reviewed later
- **Real-time event**: Instant updates for active users

### 2. Include Metadata

Use the `metadata` field to store additional context:

```typescript
metadata: {
  oldStatus: "pending",
  newStatus: "approved",
  triggeredBy: ctx.user.id,
  approvedBy: "admin-uuid",
  reason: "Documents verified",
}
```

### 3. Link to Entities

Always include relevant entity IDs (`orderId`, `testingId`, `documentId`) for easy navigation:

```typescript
{
  userId: "user-uuid",
  orderId: "order-uuid",
  type: "payment_received",
  // ... other fields
}
```

### 4. Use Descriptive Titles and Messages

Write clear, user-friendly messages:

```typescript
// Good
title: "Payment Verified",
message: "Your payment of Rp 500.000 for Order #12345 has been verified.",

// Bad
title: "Update",
message: "Status changed.",
```

### 5. Filter Own Events

The event bus automatically filters out events triggered by the current user (unless `includeOwnEvents: true`). This prevents users from receiving notifications for their own actions.

### 6. Clean Up Old Notifications

Consider implementing a cleanup job to soft-delete old read notifications:

```typescript
// Run periodically (e.g., daily cron job)
async function cleanupOldNotifications() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await db
    .update(notifications)
    .set({ deletedAt: sql`CURRENT_TIMESTAMP` })
    .where(
      and(
        eq(notifications.isRead, true),
        lt(notifications.readAt, thirtyDaysAgo.toISOString()),
      ),
    );
}
```

### 7. Handle Event Bus Failures Gracefully

Always check if the event bus is connected before publishing:

```typescript
const eventBus = getEventBus();
if (eventBus.connected) {
  await eventBus.publish("notification", payload);
} else {
  // Log warning but don't fail the operation
  logWarn("EventBus not connected, skipping real-time notification");
}
```

## Frontend Integration

### Display Notifications

```typescript
import { trpc } from "@/lib/trpc";

function NotificationsList() {
  const { data, isLoading } = trpc.notifications.getAll.useQuery({
    page: 1,
    limit: 20,
    isRead: false,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.data.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
}
```

### Unread Badge

```typescript
function NotificationBell() {
  const { data: unreadCount } = trpc.notifications.getUnreadCount.useQuery();

  return (
    <button className="relative">
      <BellIcon />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-1 text-xs">
          {unreadCount}
        </span>
      )}
    </button>
  );
}
```

### Mark as Read on Click

```typescript
const markAsRead = trpc.notifications.markAsRead.useMutation({
  onSuccess: () => {
    // Invalidate queries to refresh the UI
    utils.notifications.getAll.invalidate();
    utils.notifications.getUnreadCount.invalidate();
  },
});

function NotificationItem({ notification }) {
  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead.mutate({ id: notification.id });
    }
    // Navigate to related entity
    if (notification.orderId) {
      router.push(`/orders/${notification.orderId}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={notification.isRead ? "opacity-50" : ""}
    >
      <h4>{notification.title}</h4>
      <p>{notification.message}</p>
    </div>
  );
}
```

## Related Documentation

- [Event Bus Documentation](../../services/docs/event-bus/EVENT_BUS_GUIDE.md)
- [Rate Limiting](./RATE_LIMITING_MIDDLEWARE.md)
- [Database Schema](../../../db/src/schema.ts)

## Migration

The notifications table was added in migration `0012_clammy_lady_deathstrike.sql`.

To apply the migration:

```bash
pnpm db:migrate
```

To rollback (if needed):

```bash
pnpm db:rollback
```
