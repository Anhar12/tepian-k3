import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/utils/require-permission";

export const Route = createFileRoute(
  "/(core)/back-office/chemical-materials/$chemicalMaterial/edit",
)({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: "chemical-materials.update",
    }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      Hello "/(core)/back-office/chemical-materials/$chemicalMaterial/edit"!
    </div>
  );
}
