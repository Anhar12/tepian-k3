import { RouterProvider, createRouter } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import * as z from "zod";
import Loader from "./components/loader";
import { routeTree } from "./routeTree.gen";
import { setDefaultOptions } from "date-fns";
import { id } from "date-fns/locale";

// Set Zod locale to Indonesian
z.config(z.locales.id());
setDefaultOptions({ locale: id });

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient, trpc } from "./utils/trpc";
import { katalogMask, detailToolsMask } from "./mask";

const router = createRouter({
  routeTree,
  routeMasks: [katalogMask, detailToolsMask],
  defaultPreload: "intent",
  defaultPendingComponent: () => <Loader />,
  scrollRestoration: true,
  context: { trpc, queryClient },
  Wrap: function WrapComponent({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("Root element not found");
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}
