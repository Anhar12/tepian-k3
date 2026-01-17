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
  TRPCClientError,
  type TRPCLink,
} from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";
import { env } from "@/env";
import { EventSourcePolyfill } from "event-source-polyfill";
import SuperJSON from "superjson";
import { observable } from "@trpc/server/observable";
import { auth } from "./auth";

// Token management
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

// Create a separate simple tRPC client for refresh calls (to avoid circular dependencies)
const refreshClient = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: `${env.VITE_SERVER_URL}/trpc`,
      transformer: SuperJSON,
      headers: () => {
        const headers = new Headers();
        headers.append("Content-Type", "application/json");
        return headers;
      },
    }),
  ],
});

async function refreshTokens() {
  // If already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      // Use tRPC client to call refresh endpoint
      const result = await refreshClient.auth.refresh.mutate({
        refreshToken,
      });

      if (result.accessToken && result.refreshToken) {
        auth.setTokens(result.accessToken, result.refreshToken);
      } else {
        throw new Error("Invalid refresh response");
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      // Clear tokens and redirect to login
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
      throw error;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Custom tRPC link that handles token refresh on 401 errors
const tokenRefreshLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        next(value) {
          observer.next(value);
        },
        error(err) {
          // Check if it's a 401 UNAUTHORIZED error
          if (
            err instanceof TRPCClientError &&
            err.data?.code === "UNAUTHORIZED"
          ) {
            const refreshToken = localStorage.getItem("refreshToken");

            if (refreshToken) {
              console.log("401 error detected, attempting token refresh...");

              // Attempt to refresh the token
              refreshTokens()
                .then(() => {
                  console.log("Token refreshed, retrying request...");
                  // Retry the original operation
                  next(op).subscribe({
                    next(value) {
                      observer.next(value);
                    },
                    error(retryErr) {
                      observer.error(retryErr);
                    },
                    complete() {
                      observer.complete();
                    },
                  });
                })
                .catch((refreshErr) => {
                  console.error("Token refresh failed:", refreshErr);
                  // If refresh fails, pass through the original error
                  observer.error(err);
                });
            } else {
              // No refresh token, pass through the error
              observer.error(err);
            }
          } else {
            // Not a 401 error, pass it through
            observer.error(err);
          }
        },
        complete() {
          observer.complete();
        },
      });

      return unsubscribe;
    });
  };
};

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(error.message, {
        action: {
          label: "retry",
          onClick: () => {
            queryClient.invalidateQueries();
          },
        },
      });
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
    splitLink({
      condition: (op) => {
        return op.path.startsWith("auth.") || isNonJsonSerializable(op.input);
      },
      true: httpLink({
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
      false: splitLink({
        condition: (op) => op.type === "subscription",
        true: httpSubscriptionLink({
          url: `${env.VITE_SERVER_URL}/trpc`,
          transformer: SuperJSON,
          EventSource: EventSourcePolyfill,
          eventSourceOptions: async ({ op }) => {
            //                          ^ Includes the operation that's being executed
            // you can use this to generate a signature for the operation
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
