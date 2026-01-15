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
import { toast } from "sonner";
import { env } from "@/env";
import { EventSourcePolyfill } from "event-source-polyfill";
import SuperJSON from "superjson";

// Token management
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

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

      const response = await fetch(`${env.VITE_SERVER_URL}/trpc/auth.refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();

      if (data.result?.data) {
        const { accessToken, refreshToken: newRefreshToken } = data.result.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);
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

// Custom fetch wrapper that handles token refresh
async function fetchWithTokenRefresh(
  url: RequestInfo | URL,
  options?: RequestInit,
): Promise<Response> {
  let response = await fetch(url, options);

  // If 401 and we have a refresh token, try to refresh
  if (response.status === 401) {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        // Refresh the token
        await refreshTokens();

        // Retry the original request with new token
        const newToken = localStorage.getItem("accessToken");
        const newOptions = {
          ...options,
          headers: {
            ...options?.headers,
            Authorization: newToken ? `Bearer ${newToken}` : "",
          },
        };

        response = await fetch(url, newOptions);
      } catch (error) {
        // Refresh failed, return the original 401 response
        return response;
      }
    }
  }

  return response;
}

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
    splitLink({
      condition: (op) => {
        return op.path.startsWith("auth.") || isNonJsonSerializable(op.input);
      },
      true: httpLink({
        url: `${env.VITE_SERVER_URL}/trpc`,
        transformer: SuperJSON,
        fetch: fetchWithTokenRefresh,
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
          fetch: fetchWithTokenRefresh,
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
