import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  params: z.object({
    companyId: z.uuidv7(),
  }),
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
