import { requirePermission } from "@/utils/require-permission";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import ToolDetail from "./-components/tool-detail";
import { TabsLayout } from "./-components/tabs-layout";
import { TabsContent } from "@radix-ui/react-tabs";

export const Route = createFileRoute(
  "/(core)/back-office/tools/$toolId/detail",
)({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "tools.read" }),
  params: z.object({
    toolId: z.uuidv7(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { toolId } = Route.useParams();

  return (
    <TabsLayout toolId={toolId}>
      <TabsContent value="detail">
        <ToolDetail toolId={toolId} />
      </TabsContent>
    </TabsLayout>
  );
}
