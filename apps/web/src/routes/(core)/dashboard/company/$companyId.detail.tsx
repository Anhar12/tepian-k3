import { SkeletonGenerator } from "@/components/ui/skeleton-generator";
import { Tabs } from "@/components/ui/tabs";
import { pageHead } from "@/utils/page-head";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import CompanyDetail from "./-components/company-detail";

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
  pendingComponent: LoaderComponent,
  head: () => pageHead("Detail Perusahaan"),
});

function LoaderComponent() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonGenerator variant="tabs" tabs={2} />
    </div>
  );
}

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
        <CompanyDetail companyId={companyId} />
      </Tabs>
    </div>
  );
}
