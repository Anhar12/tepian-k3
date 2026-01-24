# tRPC with TanStack Query Usage Guide

This guide explains the two ways to use tRPC with TanStack Query in the frontend application.

## Overview

The project uses `@trpc/tanstack-react-query` which provides two patterns for making API calls:

1. **Classic Pattern** - Using tRPC hooks directly
2. **Modern Pattern** - Using TanStack Query hooks with tRPC options

Both patterns are valid and type-safe. The modern pattern provides more flexibility and better integration with TanStack Query's ecosystem.

## Setup

Both patterns use the same tRPC client setup located in [apps/web/src/utils/trpc.ts](../src/utils/trpc.ts):

```typescript
import { createTRPCClient } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

// Direct tRPC client for non-React calls (used in lib/, utils/)
export const trpcClient = createTRPCClient<AppRouter>({
  // ... configuration
});

// tRPC proxy for React hooks (used in components, routes)
export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
```

## Pattern 1: Classic tRPC Hooks

The classic pattern uses tRPC-specific hooks that internally use TanStack Query.

### Queries

```typescript
import { trpc } from "@/utils/trpc";

function UserProfile() {
  // Using tRPC hook
  const { data, isLoading, error } = trpc.user.getById.useQuery({
    id: "user-id"
  });

  return <div>{data?.name}</div>;
}
```

### Mutations

```typescript
import { trpc } from "@/utils/trpc";

function UpdateUserForm() {
  const updateUser = trpc.user.update.useMutation({
    onSuccess: () => {
      console.log("User updated!");
    },
  });

  const handleSubmit = (data) => {
    updateUser.mutate({ id: "user-id", name: data.name });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Subscriptions

```typescript
import { trpc } from "@/utils/trpc";

function NotificationList() {
  trpc.notification.onUpdate.useSubscription(undefined, {
    onData: (notification) => {
      console.log("New notification:", notification);
    },
  });

  return <div>...</div>;
}
```

## Pattern 2: Modern TanStack Query with tRPC Options

The modern pattern uses TanStack Query hooks directly with tRPC-generated options. This provides better integration with TanStack Query features.

### Queries

```typescript
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

function UserProfile() {
  // Using TanStack Query hook with tRPC options
  const { data, isLoading, error } = useQuery(
    trpc.user.getById.queryOptions({ id: "user-id" })
  );

  return <div>{data?.name}</div>;
}
```

**Example from codebase** - [apps/web/src/routes/(core)/route.tsx](../src/routes/(core)/route.tsx):

```typescript
export const Route = createFileRoute("/(core)")({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData({
      ...trpc.auth.me.queryOptions(),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    });
    return null;
  },
});
```

### Mutations

```typescript
import { trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";

function UpdateUserForm() {
  const updateUser = useMutation(
    trpc.user.update.mutationOptions({
      onSuccess: () => {
        console.log("User updated!");
      },
    })
  );

  const handleSubmit = (data) => {
    updateUser.mutate({ id: "user-id", name: data.name });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

**Example from codebase** - [apps/web/src/components/cart-sheet.tsx](../src/components/cart-sheet.tsx):

```typescript
const incrementCartItemQuantity = useMutation(
  trpc.cart.incrementCartItemQuantity.mutationOptions({
    onMutate: ({ cartItemId }) => {
      setLoadingItems((prev) => new Set(prev).add(cartItemId));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries(
        trpc.cart.getAllCartItems.queryOptions(),
      );
    },
    onError: (error) => {
      globalErrorToast(`Gagal menambah jumlah: ${error.message}`);
    },
    onSettled: (_, __, { cartItemId }) => {
      setLoadingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cartItemId);
        return newSet;
      });
    },
  }),
);
```

## Pattern 3: Direct tRPC Client (Non-React)

For use outside React components (utility functions, lib files), use the direct tRPC client:

```typescript
import { trpcClient } from "@/utils/trpc";

// In a utility function or lib file
export async function logout() {
  const refreshToken = auth.getRefreshToken();

  if (refreshToken) {
    await trpcClient.auth.logout.mutate({ refreshToken });
  }

  auth.clearTokens();
  window.location.href = "/login";
}
```

**Example from codebase** - [apps/web/src/lib/logout.ts](../src/lib/logout.ts):

```typescript
import { trpcClient } from "@/utils/trpc";

export async function logout() {
  const refreshToken = auth.getRefreshToken();

  if (refreshToken) {
    try {
      await trpcClient.auth.logout.mutate({ refreshToken });
    } catch (error) {
      console.error("Failed to revoke refresh token:", error);
    }
  }

  auth.clearTokens();
  window.location.href = "/login";
}
```

## Comparison Table

| Feature | Classic Pattern | Modern Pattern | Direct Client |
|---------|----------------|----------------|---------------|
| **Usage Location** | React components | React components | Utility functions, lib files |
| **Import** | `trpc` from utils | `trpc` + `useQuery`/`useMutation` | `trpcClient` from utils |
| **Query Syntax** | `trpc.user.getById.useQuery()` | `useQuery(trpc.user.getById.queryOptions())` | `trpcClient.user.getById.query()` |
| **Mutation Syntax** | `trpc.user.update.useMutation()` | `useMutation(trpc.user.update.mutationOptions())` | `trpcClient.user.update.mutate()` |
| **TanStack Query Integration** | Indirect | Direct | N/A (no hooks) |
| **Advanced Query Features** | Limited | Full access | N/A |
| **Type Safety** | ✅ Full | ✅ Full | ✅ Full |
| **SSR/Prefetching** | Requires workarounds | Native support | Native support |

## When to Use Each Pattern

### Use Classic Pattern When:
- Building simple components with straightforward data fetching
- You don't need advanced TanStack Query features
- Team prefers concise syntax
- Working with subscriptions (only supported in classic pattern)

### Use Modern Pattern When:
- Need advanced TanStack Query features (placeholderData, select, refetchInterval, etc.)
- Working with TanStack Router loaders/prefetching
- Need fine-grained control over query/mutation behavior
- Composing multiple queries with suspense

### Use Direct Client When:
- Making API calls outside React components
- In utility functions (logout, file uploads, etc.)
- In middleware or request handlers
- Server-side rendering context

## Advanced Examples

### Optimistic Updates with Modern Pattern

```typescript
const updateUser = useMutation(
  trpc.user.update.mutationOptions({
    onMutate: async (newUser) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(
        trpc.user.getById.queryOptions({ id: newUser.id })
      );

      // Snapshot previous value
      const previousUser = queryClient.getQueryData(
        trpc.user.getById.queryOptions({ id: newUser.id })
      );

      // Optimistically update
      queryClient.setQueryData(
        trpc.user.getById.queryOptions({ id: newUser.id }),
        newUser
      );

      return { previousUser };
    },
    onError: (err, newUser, context) => {
      // Rollback on error
      queryClient.setQueryData(
        trpc.user.getById.queryOptions({ id: newUser.id }),
        context?.previousUser
      );
    },
    onSettled: (data, error, variables) => {
      // Refetch after mutation
      queryClient.invalidateQueries(
        trpc.user.getById.queryOptions({ id: variables.id })
      );
    },
  })
);
```

### Prefetching in Route Loaders

```typescript
export const Route = createFileRoute("/users/$userId")({
  loader: async ({ context, params }) => {
    // Prefetch user data before rendering
    await context.queryClient.prefetchQuery(
      trpc.user.getById.queryOptions({ id: params.userId })
    );
  },
  component: UserDetail,
});
```

### Infinite Queries

```typescript
import { useInfiniteQuery } from "@tanstack/react-query";

function UserList() {
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery(
    trpc.user.list.infiniteQueryOptions(
      { limit: 10 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    )
  );

  return (
    <div>
      {data?.pages.map((page) =>
        page.users.map((user) => <div key={user.id}>{user.name}</div>)
      )}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>Load More</button>
      )}
    </div>
  );
}
```

### Dependent Queries

```typescript
function UserOrders({ userId }: { userId: string }) {
  // First query
  const userQuery = useQuery(
    trpc.user.getById.queryOptions({ id: userId })
  );

  // Second query depends on first
  const ordersQuery = useQuery(
    trpc.order.listByUser.queryOptions(
      { userId },
      {
        enabled: !!userQuery.data, // Only run when user data exists
      }
    )
  );

  if (userQuery.isLoading) return <div>Loading user...</div>;
  if (ordersQuery.isLoading) return <div>Loading orders...</div>;

  return <div>...</div>;
}
```

## Best Practices

### 1. Consistent Pattern Per Component
Choose one pattern per component and stick with it. Don't mix patterns unnecessarily.

```typescript
// ❌ Bad - mixing patterns
const user = trpc.user.getById.useQuery({ id });
const updateUser = useMutation(trpc.user.update.mutationOptions());

// ✅ Good - consistent classic pattern
const user = trpc.user.getById.useQuery({ id });
const updateUser = trpc.user.update.useMutation();

// ✅ Good - consistent modern pattern
const user = useQuery(trpc.user.getById.queryOptions({ id }));
const updateUser = useMutation(trpc.user.update.mutationOptions());
```

### 2. Use Type Inference

Both patterns have full type inference. Don't manually type unless necessary.

```typescript
// ✅ Good - types are inferred
const { data } = useQuery(trpc.user.getById.queryOptions({ id }));
//      ^? data: User | undefined

// ❌ Unnecessary
const { data }: { data: User | undefined } = useQuery(...);
```

### 3. Leverage Query Invalidation

Always use tRPC query keys for invalidation:

```typescript
const updateUser = useMutation(
  trpc.user.update.mutationOptions({
    onSuccess: () => {
      // ✅ Invalidate using tRPC query options
      queryClient.invalidateQueries(
        trpc.user.getById.queryOptions()
      );
    },
  })
);
```

### 4. Error Handling

Both patterns support the same error handling approach:

```typescript
const { data, error } = useQuery(
  trpc.user.getById.queryOptions({ id }, {
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
);

if (error) {
  return <div>Error: {error.message}</div>;
}
```

## Migration Guide

### From Classic to Modern Pattern

```typescript
// Before (Classic)
const users = trpc.user.list.useQuery({ page: 1 });

// After (Modern)
import { useQuery } from "@tanstack/react-query";
const users = useQuery(trpc.user.list.queryOptions({ page: 1 }));
```

```typescript
// Before (Classic)
const createUser = trpc.user.create.useMutation({
  onSuccess: () => toast.success("User created"),
});

// After (Modern)
import { useMutation } from "@tanstack/react-query";
const createUser = useMutation(
  trpc.user.create.mutationOptions({
    onSuccess: () => toast.success("User created"),
  })
);
```

## Common Pitfalls

### 1. Using trpcClient in React Components

```typescript
// ❌ Bad - bypasses React Query caching/management
function UserProfile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    trpcClient.user.getById.query({ id }).then(setUser);
  }, [id]);
}

// ✅ Good - use hooks
function UserProfile() {
  const { data: user } = useQuery(
    trpc.user.getById.queryOptions({ id })
  );
}
```

### 2. Forgetting to Invalidate Queries

```typescript
// ❌ Bad - data won't refresh
const deleteUser = useMutation(
  trpc.user.delete.mutationOptions()
);

// ✅ Good - invalidate related queries
const deleteUser = useMutation(
  trpc.user.delete.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.user.list.queryOptions());
    },
  })
);
```

### 3. Not Handling Loading States

```typescript
// ❌ Bad - potential undefined access
function UserProfile() {
  const { data } = useQuery(trpc.user.getById.queryOptions({ id }));
  return <div>{data.name}</div>; // Error if data is undefined
}

// ✅ Good - handle loading/undefined states
function UserProfile() {
  const { data, isLoading } = useQuery(
    trpc.user.getById.queryOptions({ id })
  );

  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>User not found</div>;

  return <div>{data.name}</div>;
}
```

## Related Documentation

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [tRPC React Query Integration](https://trpc.io/docs/client/react)
- [tRPC Client Documentation](https://trpc.io/docs/client/vanilla)
- [Project CLAUDE.md](../../../CLAUDE.md) - Main project documentation

## Summary

Both classic and modern patterns are valid and type-safe. The modern pattern provides more flexibility and better integration with TanStack Query's ecosystem, while the classic pattern offers more concise syntax. Choose based on your specific needs and team preferences.

For non-React usage (utility functions, lib files), always use the direct `trpcClient`.
