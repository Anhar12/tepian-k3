import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import ParameterDetail from "./-components/parameter-detail";
import ParameterTools from "./-components/parameter-tool";
import ParameterChemical from "./-components/parameter-chemical";

export const Route = createFileRoute(
  "/(core)/back-office/parameters/$parameterId/detail",
)({
  validateSearch: z.object({
    tabs: z.enum(["parameter", "tool", "chemical"]).default("parameter"),
  }),
  params: z.object({
    parameterId: z.string(),
  }),
  head: () => pageHead("Detail Parameter"),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: ["parameters.read", "parameter-tool.view"],
    }),
  loader: async ({ context, params }) => {
    context.queryClient.ensureQueryData(
      context.trpc.parameter.getParameterById.queryOptions({
        id: params.parameterId,
      }),
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { parameterId } = Route.useParams();
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
              tabs: value as "parameter" | "tool" | "chemical",
            }),
          });
        }}
      >
        <TabsList>
          <TabsTrigger value="parameter">Parameter</TabsTrigger>
          <TabsTrigger value="tool">Tool</TabsTrigger>
          <TabsTrigger value="chemical">Chemical</TabsTrigger>
        </TabsList>
        <TabsContent value="parameter">
          <ParameterDetail parameterId={parameterId} />
        </TabsContent>
        <TabsContent value="tool">
          <ParameterTools parameterId={parameterId} />
        </TabsContent>
        <TabsContent value="chemical">
          <ParameterChemical parameterId={parameterId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
