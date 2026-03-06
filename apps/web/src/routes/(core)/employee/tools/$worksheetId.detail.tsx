import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { createFileRoute } from "@tanstack/react-router";
import { TabsLayout } from "./-components/tabs-layout";
import { TabsContent } from "@/components/ui/tabs";
import ToolDetail from "./-components/tool-detail";
import { z } from "zod";

export const Route = createFileRoute(
  "/(core)/employee/tools/$worksheetId/detail",
)({
  params: z.object({
    worksheetId: z.uuidv7(),
  }),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "worksheet-tools.update" }),
  component: RouteComponent,
  head: () => pageHead("Pinjam Alat Worksheet"),
});

function RouteComponent() {
  const { worksheetId } = Route.useParams();

  return (
    <TabsLayout worksheetId={worksheetId}>
      <TabsContent value="borrow">
        <ToolDetail worksheetId={worksheetId} />
      </TabsContent>
    </TabsLayout>
  );
}
