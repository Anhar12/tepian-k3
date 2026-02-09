import type { AppRouter } from "@tepian-k3/api/root";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import {
  createTRPCClient,
  httpBatchLink,
  httpSubscriptionLink,
  httpLink,
  isNonJsonSerializable,
  loggerLink,
  splitLink,
} from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { env } from "@/env";
import { EventSourcePolyfill } from "event-source-polyfill";
import SuperJSON from "superjson";
import { globalErrorToast } from "@/lib/toast";
import { tokenRefreshLink } from "./refresh";
import { idempotencyLink } from "./idempotency";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      globalErrorToast(error.message || "An unexpected error occurred");
    },
  }),
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    loggerLink({
      enabled: (op) =>
        process.env.NODE_ENV === "development" ||
        (op.direction === "down" && op.result instanceof Error),
    }),
    tokenRefreshLink,
    idempotencyLink,
    splitLink({
      // Route mutations, auth calls, and non-JSON input through httpLink
      // so each mutation gets its own X-Idempotency-Key header
      condition: (op) => {
        return (
          op.type === "mutation" ||
          op.path.startsWith("auth.") ||
          isNonJsonSerializable(op.input)
        );
      },
      true: httpLink({
        url: `${env.VITE_SERVER_URL}/trpc`,
        transformer: SuperJSON,
        headers: ({ op }) => {
          const headers = new Headers();

          const token = localStorage.getItem("accessToken");

          if (token) {
            headers.append("Authorization", `Bearer ${token}`);
          }

          // Add idempotency key for mutation requests
          const key = op.context?.idempotencyKey as string | undefined;
          if (op.type === "mutation" && key) {
            headers.append("X-Idempotency-Key", key);
          }

          return headers;
        },
      }),
      false: splitLink({
        condition: (op) => op.type === "subscription",
        true: httpSubscriptionLink({
          url: `${env.VITE_SERVER_URL}/trpc`,
          transformer: SuperJSON,
          EventSource: EventSourcePolyfill,
          eventSourceOptions: async ({ op }) => {
            const token = localStorage.getItem("accessToken");
            return {
              headers: {
                authorization: token ? `Bearer ${token}` : "",
                "x-signature": `signature-for-${op.path}`,
              },
            };
          },
        }),
        false: httpBatchLink({
          url: `${env.VITE_SERVER_URL}/trpc`,
          transformer: SuperJSON,
          headers: () => {
            const headers = new Headers();
            const token = localStorage.getItem("accessToken");

            if (token) {
              headers.append("Authorization", `Bearer ${token}`);
            }

            return headers;
          },
        }),
      }),
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
