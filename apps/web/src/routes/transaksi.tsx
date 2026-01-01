import { createFileRoute } from "@tanstack/react-router";
import { Stepper } from "@/components/stepper";
import { LocationSection } from "@/components/location-section";
import { ParameterCategories } from "@/components/parameter-categories";
import { TestingTable } from "@/components/testing-table";
import LandingNavbar from "@/components/landing-navbar";

export const Route = createFileRoute("/transaksi")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-100">
      {/* Background Grid Pattern */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10">
        <LandingNavbar />

        <div className="mx-auto max-w-7xl space-y-12 px-4 py-8">
          {/* Page Title */}
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-[#0056B3]">
              layanan pengujian
            </h1>
            <div className="mx-auto h-1.5 w-48 rounded-full bg-gradient-to-r from-blue-600 via-blue-400 to-emerald-400" />
          </div>

          {/* Stepper */}
          <Stepper currentStep={1} />

          {/* Location Section */}
          <LocationSection />

          {/* Parameter Categories */}
          <ParameterCategories />

          {/* Testing Table */}
          <TestingTable />
        </div>
      </div>
    </div>
  );
}
