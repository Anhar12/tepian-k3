import { createRouteMask } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const katalogMask = createRouteMask({
  routeTree,
  from: "/katalog",
  to: "/katalog",
  params: true,
  search: {},
});

export const detailToolsMask = createRouteMask({
  routeTree,
  from: "/back-office/tools/$toolId/detail",
  to: "/back-office/tools/$toolId/detail",
  params: true,
  search: {},
});
