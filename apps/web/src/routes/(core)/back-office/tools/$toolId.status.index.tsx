import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TabsLayout } from "./-components/tabs-layout";
import { TabsContent } from "@/components/ui/tabs";
import toolCheckSchema from "@tepian-k3/schema/pengujian/tool-check.schema";
import ToolStatus from "./-components/tool-status";

export const Route = createFileRoute(
  "/(core)/back-office/tools/$toolId/status/",
)({
  validateSearch: toolCheckSchema.getAllToolChecksSchema,
  params: z.object({
    toolId: z.uuidv7(),
  }),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: "tool-checks.view",
    }),
  head: () => pageHead("Status Alat"),
  component: RouteComponent,
});

function RouteComponent() {
  const { toolId } = Route.useParams();

  return (
    <TabsLayout toolId={toolId}>
      <TabsContent value="status">
        <ToolStatus toolId={toolId} />
      </TabsContent>
    </TabsLayout>
  );
}
