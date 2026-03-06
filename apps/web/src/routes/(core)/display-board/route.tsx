import { requireRoles } from "@/utils/require-roles";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BACK_OFFICE_ROLES, EMPLOYEE_ROLES } from "@tepian-k3/constants";

// Auth check is handled by parent (core) route.
// Display board runs full-screen (kiosk mode) — no sidebar or header.
// Only internal staff (back-office + employees) can access; external users are blocked.
export const Route = createFileRoute("/(core)/display-board")({
  beforeLoad: async ({ context }) => {
    await requireRoles(context, {
      role: [...BACK_OFFICE_ROLES, ...EMPLOYEE_ROLES],
    });
  },
  component: RouteComponent,
});

/**
 * Full-screen kiosk layout for the office display board.
 * Intentionally has no sidebar or top header to maximise visible content
 * on a large monitor.
 */
function RouteComponent() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <Outlet />
    </div>
  );
}
