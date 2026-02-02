import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/utils/require-permission";
import z from "zod";
import { TabsLayout } from "./-components/tabs-layout";
import ToolCalibration from "./-components/tool-calibration";
import toolCalibrationSchema from "@tepian-k3/schema/tool-calibration.schema";
import { TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute(
  "/(core)/back-office/tools/$toolId/calibration/",
)({
  validateSearch: toolCalibrationSchema.getAllToolCalibrationsSchema,
  params: z.object({
    toolId: z.uuidv7(),
  }),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: "tool-calibrations.view",
    }),
  component: RouteComponent,
});

function RouteComponent() {
  const { toolId } = Route.useParams();

  return (
    <TabsLayout toolId={toolId}>
      <TabsContent value="calibration">
        <ToolCalibration toolId={toolId} />
      </TabsContent>
    </TabsLayout>
  );
}
