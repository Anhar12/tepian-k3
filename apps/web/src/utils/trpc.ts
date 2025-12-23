import type { AppRouter } from "@tepian-k3/api/root";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import {
  createTRPCClient,
  httpBatchLink,
  httpBatchStreamLink,
  httpLink,
  isNonJsonSerializable,
  loggerLink,
  splitLink,
} from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";
import { env } from "@/env";
import SuperJSON from "superjson";

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
    // httpBatchLink({
    //   url: `${env.VITE_SERVER_URL}/trpc`,
    //   transformer: SuperJSON,
    //   headers: () => {
    //     const headers = new Headers();

    //     const token = localStorage.getItem("token");

    //     if (token) {
    //       headers.append("Authorization", `Bearer ${token}`);
    //     }

    //     return headers;
    //   },
    // }),
    splitLink({
      condition: (op) => {
        return op.path.startsWith("auth.") || isNonJsonSerializable(op.input);
      },
      true: httpLink({
        url: `${env.VITE_SERVER_URL}/trpc`,
        transformer: SuperJSON,
        headers: () => {
          const headers = new Headers();

          const token = localStorage.getItem("token");

          if (token) {
            headers.append("Authorization", `Bearer ${token}`);
          }

          return headers;
        },
      }),
      false: httpBatchLink({
        url: `${env.VITE_SERVER_URL}/trpc`,
        transformer: SuperJSON,
        headers: () => {
          const headers = new Headers();
          const token = localStorage.getItem("token");

          if (token) {
            headers.append("Authorization", `Bearer ${token}`);
          }
          return headers;
        },
      }),
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
