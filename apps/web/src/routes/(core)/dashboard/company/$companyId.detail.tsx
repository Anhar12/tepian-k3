import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requirePermission } from "@/utils/require-permission";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import CompanyDetail from "./-components/company-detail";
import CompanyTestingLocationList from "./-components/company-testing-location-list";

export const Route = createFileRoute(
  "/(core)/dashboard/company/$companyId/detail",
)({
  validateSearch: z.object({
    tabs: z
      .enum(["company-info", "company-testing-location"])
      .default("company-info"),
    showDeleted: z.boolean().optional(),
  }),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: ["user-company.read", "user-company-testing-location.read"],
    }),
  params: z.object({
    companyId: z.uuidv7(),
  }),
  loaderDeps: (search) => ({
    searchParams: z
      .object({
        showDeleted: z.boolean().optional(),
      })
      .parse(search),
  }),
  loader: async ({ context, params, deps }) => {
    context.queryClient.ensureQueryData(
      context.trpc.userCompany.getUserCompanyByIdAndUserId.queryOptions({
        id: params.companyId,
      }),
    );

    context.queryClient.ensureQueryData(
      context.trpc.userCompanyTestingLocation.getAllUserCompanyTestingLocationsByCompanyIdAndUserId.queryOptions(
        {
          companyId: params.companyId,
          showDeleted: deps.searchParams.showDeleted ?? false,
        },
      ),
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { companyId } = Route.useParams();
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
              tabs: value as "company-info" | "company-testing-location",
            }),
          });
        }}
      >
        <TabsList>
          <TabsTrigger value="company-info">Informasi Perusahaan</TabsTrigger>
          <TabsTrigger value="company-testing-location">
            Lokasi Pengujian
          </TabsTrigger>
        </TabsList>
        <TabsContent value="company-info">
          <CompanyDetail companyId={companyId} />
        </TabsContent>
        <TabsContent value="company-testing-location">
          <CompanyTestingLocationList companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
