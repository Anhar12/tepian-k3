import { createRouteMask } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const katalogMask = createRouteMask({
  routeTree,
  from: "/katalog",
  to: "/katalog",
  params: true,
  search: {},
});
