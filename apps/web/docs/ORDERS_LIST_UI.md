# Orders List UI Implementation

This document describes the implementation of the back-office orders list UI.

## Files Created/Modified

### 1. Backend - Query Layer

#### `packages/queries/src/order.queries.ts`

Added `getAllOrdersPaginated()` function for admin access to all orders with pagination:

```typescript
getAllOrdersPaginated(
  page: number = 1,
  limit: number = 10,
  status?: OrderStatus,
  search?: string,
)
```

**Features:**

- Paginated results with configurable page size
- Optional status filtering
- Returns orders with:
  - Company information (id, name)
  - User information (id, name, email)
  - Testing information (if exists)
- Proper error handling and logging
- Uses Effect-based pattern for composability

### 2. Backend - Schema Layer

#### `packages/schema/src/order.schema.ts`

Added `getAllOrdersSchema` for validating query parameters:

```typescript
const getAllOrdersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(10),
  status: z
    .enum([
      "pending",
      "approved",
      "rejected",
      "in_progress",
      "completed",
      "cancelled",
    ])
    .optional(),
  search: z.string().optional(),
});
```

### 3. Backend - API Layer

#### `packages/api/src/routers/order.ts`

Added `getAllOrdersPaginated` endpoint:

```typescript
getAllOrdersPaginated: withPermission("orders.read")
  .input(orderSchema.getAllOrdersSchema)
  .query(async ({ input }) =>
    await runEffect(
      orderQueries.getAllOrdersPaginated(
        input.page,
        input.perPage,
        input.status,
        input.search,
      ),
    ),
  ),
```

**Security:** Requires `orders.read` permission.

### 4. Frontend - Columns Definition

#### `apps/web/src/components/columns/orders-columns.tsx`

Created column definitions for the orders data table:

**Columns:**

1. **Number** - Row number with pagination
2. **Order Number** - Searchable order number
3. **Company Name** - Truncated company name
4. **Customer** - Name and email
5. **Status** - Color-coded badge (pending, approved, rejected, etc.)
6. **Approval Status** - Color-coded approval badge
7. **Payment Status** - Color-coded payment badge
8. **Testing** - Shows testing number and status (if created)
9. **Total Amount** - Formatted currency (IDR)
10. **Created Date** - Formatted date
11. **Actions** - View detail button

**Color Schemes:**

- Status colors: yellow (pending), green (approved/completed), red (rejected), blue (in_progress), purple (completed), gray (cancelled)
- Payment colors: yellow (unpaid), green (paid), blue (refunded), red (failed)
- Approval colors: yellow (pending), green (approved), red (rejected)

### 5. Frontend - Orders List Page

#### `apps/web/src/routes/(core)/back-office/orders/index.tsx`

Created the main orders list page component:

**Features:**

- Data table with server-side pagination
- Status filter dropdown (all statuses, pending, approved, etc.)
- Total order count display
- Sortable columns
- Filter and search capabilities via DataTableToolbar
- Empty state with helpful messages
- Loading and error states
- Responsive layout

**Route Protection:**

- Requires `orders.read` permission
- Uses `validateSearch` for type-safe query parameters

### 6. Frontend - Navigation Menu

#### `apps/web/src/lib/back-office-menu.ts`

Added "Orders" to the back-office navigation menu:

```typescript
{
  title: "Orders",
  url: `${urlStarter}/orders`,
  icon: IconShoppingCart,
  permission: "orders.read",
}
```

## Permission Required

Users need the `orders.read` permission to access the orders list.

## Usage

1. **Navigate to Orders:**
   - From back-office sidebar, click "Orders"
   - Or visit `/back-office/orders`

2. **Filter Orders:**
   - Use the status dropdown to filter by order status
   - Use the search box to search by order number

3. **View Order Details:**
   - Click the eye icon in the Actions column
   - Redirects to `/back-office/orders/:orderId/detail`

4. **Pagination:**
   - Navigate between pages using the pagination controls
   - Change items per page (10, 20, 50, 100)

## Data Flow

```
User Action → Route Validation → Permission Check → tRPC Query
   ↓
orderQueries.getAllOrdersPaginated()
   ↓
Database Query (with joins for company, user, testing)
   ↓
Format Response (data + pagination)
   ↓
DataTable Component → Display with Columns
```

## Testing Order Status Display

The UI displays three types of statuses for each order:

1. **Order Status:** Overall order lifecycle status
2. **Approval Status:** Administrative approval state
3. **Payment Status:** Payment verification state
4. **Testing Status:** Testing process state (if testing created)

## Future Enhancements

Potential improvements:

- Search by company name or customer email
- Date range filter
- Export to CSV/Excel
- Bulk actions (approve/reject multiple)
- Advanced filtering (payment status, approval status)
- Quick actions in the table (approve/reject inline)

## Related Files

- Order detail page: `apps/web/src/routes/(core)/back-office/orders/$orderId.detail.tsx`
- User columns example: `apps/web/src/components/columns/users-columns.tsx`
- Column helpers: `apps/web/src/lib/column-helpers.tsx`
- CRUD action cell: `apps/web/src/lib/create-crud-action-cell.tsx`
