import { TabsContent } from "@/components/ui/tabs";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import ReturnTools from "./-components/return-tools";
import { TabsLayout } from "./-components/tabs-layout";

export const Route = createFileRoute(
  "/(core)/employee/tools/$worksheetId/return",
)({
  params: z.object({
    worksheetId: z.uuidv7(),
  }),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "worksheet-tools.update" }),
  component: RouteComponent,
  head: () => pageHead("Kembalikan Alat Worksheet"),
});

function RouteComponent() {
  const { worksheetId } = Route.useParams();

  return (
    <TabsLayout worksheetId={worksheetId}>
      <TabsContent value="return">
        <ReturnTools worksheetId={worksheetId} />
      </TabsContent>
    </TabsLayout>
  );
}
