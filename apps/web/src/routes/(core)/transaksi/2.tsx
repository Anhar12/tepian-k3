import { createFileRoute } from "@tanstack/react-router";
import { LocationSection } from "@/routes/(core)/-components/location-section";
import { Clusters } from "@/routes/(core)/-components/parameter-categories";
import { TestingTable } from "@/routes/(core)/-components/testing-table";
import parameterSchema from "@tepian-k3/schema/parameter.schema";

export const Route = createFileRoute("/(core)/transaksi/2")({
  validateSearch: (search) =>
    parameterSchema.getByClusterAndParameterCategorySchema.parse(search),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col">
      {/* Location Section */}
      <LocationSection />

      {/* Clusters */}
      <Clusters route="/transaksi/2" />

      {/* Testing Table */}
      <TestingTable route="/transaksi/2" />
    </div>
  );
}
