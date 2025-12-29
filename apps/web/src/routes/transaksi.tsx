import { createFileRoute } from "@tanstack/react-router";
// import { Navbar } from "@/components/navbar";
import { Stepper } from "@/components/stepper";
import { LocationSection } from "@/components/location-section";
import { ParameterCategories } from "@/components/parameter-categories";
import { ParameterTable } from "@/components/parameter-table";

export const Route = createFileRoute("/transaksi")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="relative min-h-screen overflow-hidden overflow-y-auto bg-[#F8FAFC]">
      {/* Background Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(#1e40af 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10">
        {/* <Navbar /> */}

        <main className="mx-auto max-w-7xl space-y-12 px-4 py-12">
          <div className="space-y-8 text-center">
            <div className="space-y-2">
              <h1 className="mb-4 text-4xl font-bold tracking-tight text-[#1E40AF] md:text-5xl">
                Layanan Pengujian
              </h1>
              <div className="mx-auto h-2 w-115 bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
            </div>

            <Stepper currentStep={1} />
          </div>

          <LocationSection />

          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-[#1E40AF]">
                Parameter Pengujian
              </h2>
              <p className="text-slate-500">
                Pilih kategori parameter yang akan diuji
              </p>
            </div>
            <ParameterCategories />
          </div>

          <ParameterTable />
        </main>
      </div>
    </div>
  );
}
