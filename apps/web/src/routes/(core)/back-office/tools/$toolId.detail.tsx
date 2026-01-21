import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requirePermission } from "@/utils/require-permission";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import ToolDetail from "./-components/tool-detail";
import toolCalibrationSchema from "@tepian-k3/schema/tool-calibration.schema";
import ToolCalibration from "./-components/tool-calibration";

export const Route = createFileRoute(
  "/(core)/back-office/tools/$toolId/detail",
)({
  validateSearch: toolCalibrationSchema.getAllToolCalibrationsSchema.extend({
    tabs: z.enum(["detail", "calibration"]).default("detail"),
  }),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "tools.read" }),
  params: z.object({
    toolId: z.uuidv7(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { toolId } = Route.useParams();
  const { tabs } = Route.useSearch();

  const navigate = Route.useNavigate();

  return (
    <div className="flex flex-col gap-6">
      <Tabs
        defaultValue={tabs}
        onValueChange={(value) => {
          navigate({
            search: (old) => ({
              ...old,
              tabs: value as "detail" | "calibration",
            }),
          });
        }}
      >
        <TabsList>
          <TabsTrigger value="detail">Detail</TabsTrigger>
          <TabsTrigger value="calibration">Calibration</TabsTrigger>
        </TabsList>
        <TabsContent value="detail">
          <ToolDetail toolId={toolId} />
        </TabsContent>
        <TabsContent value="calibration">
          <ToolCalibration toolId={toolId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
