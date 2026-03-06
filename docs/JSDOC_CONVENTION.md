# JSDoc Convention

**All new exported functions, hooks, and React components MUST include JSDoc documentation.**

---

## Functions

```typescript
/**
 * Retrieves a paginated list of users filtered by search term.
 *
 * @param input - Pagination and filter options
 * @param input.page - Current page number (1-indexed)
 * @param input.limit - Number of items per page
 * @param input.search - Optional search term to filter by name or email
 * @returns Paginated result with users and metadata
 */
export const getPaginatedUsers = (input: GetPaginatedUsersInput) => { ... };
```

## React Components

```typescript
/**
 * Displays an order summary card with status badge and action buttons.
 *
 * @param props - Component props
 * @param props.order - The order data to display
 * @param props.onApprove - Callback fired when the approve button is clicked
 * @param props.isLoading - Whether an async action is in progress
 */
export function OrderCard({ order, onApprove, isLoading }: OrderCardProps) { ... }
```

## Hooks

```typescript
/**
 * Custom hook that manages cart state and exposes add/remove/clear actions.
 *
 * @param orderId - The order ID to associate cart items with
 * @returns Cart items, total price, and mutation handlers
 */
export function useCart(orderId: string) { ... }
```

---

## Rules

- **Always** add JSDoc to new exported functions, hooks, and components.
- **Always** add JSDoc to new utility and service functions.
- Document all parameters with `@param` and the return value with `@returns`.
- Keep descriptions concise — explain the **purpose**, not just the name.
- For complex logic inside a function body, use inline `//` comments.
- Do **not** add JSDoc to trivial one-liners, anonymous arrow functions, or unexported internals.
