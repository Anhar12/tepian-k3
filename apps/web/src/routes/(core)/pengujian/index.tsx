import { createFileRoute } from "@tanstack/react-router";
import { LocationSection } from "./-components/location-section";
import { Clusters } from "./-components/parameter-categories";
import { TestingTable } from "./-components/testing-table";
import parameterSchema from "@tepian-k3/schema/parameter.schema";

export const Route = createFileRoute("/(core)/pengujian/")({
  validateSearch: parameterSchema.getAllParametersSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-4">
      {/* Location Section */}
      <LocationSection />

      {/* Clusters */}
      <Clusters route="/pengujian" />

      {/* Testing Table */}
      <TestingTable route="/pengujian" />
    </div>
  );
}
