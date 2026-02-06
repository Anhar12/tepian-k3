import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import CalibrationDetail from "./-components/calibration-detail";
import { CalibrationCertificate } from "./-components/calibration-certificate";
import { CalibrationDocumentation } from "./-components/calibration-documentation";
import DocumentationImageModal from "./-components/documentation-image-modal";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";

export const Route = createFileRoute(
  "/(core)/back-office/tools/$toolId/calibration/$calibrationId/detail",
)({
  validateSearch: z.object({
    tabs: z.enum(["detail", "certificate", "documentation"]).default("detail"),
    modalId: z.uuidv7().optional(),
  }),
  params: z.object({
    toolId: z.uuidv7(),
    calibrationId: z.uuidv7(),
  }),
  head: () => pageHead("Detail Kalibrasi"),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: "tool-calibrations.view",
    }),
  component: RouteComponent,
});

function RouteComponent() {
  const { calibrationId } = Route.useParams();
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
              tabs: value as "detail" | "certificate" | "documentation",
            }),
          });
        }}
      >
        <TabsList>
          <TabsTrigger value="detail">Detail</TabsTrigger>
          <TabsTrigger value="certificate">Certificate</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>
        <TabsContent value="detail">
          <CalibrationDetail calibrationId={calibrationId} />
        </TabsContent>
        <TabsContent value="certificate">
          <CalibrationCertificate calibrationId={calibrationId} />
        </TabsContent>
        <TabsContent value="documentation">
          <CalibrationDocumentation calibrationId={calibrationId} />
        </TabsContent>
      </Tabs>
      <DocumentationImageModal />
    </div>
  );
}
