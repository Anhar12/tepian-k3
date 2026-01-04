import Navbar from "@/components/navbar";
import {
  createFileRoute,
  Outlet,
  redirect,
  useMatchRoute,
  useNavigate,
} from "@tanstack/react-router";
import { Stepper } from "../-components/stepper";
import GridBackground from "@/components/grid-background";
import { useTestingFormStore } from "@/stores/testing-form.stores";
import { useEffect } from "react";

export const Route = createFileRoute("/(core)/transaksi")({
  beforeLoad: ({ location }) => {
    // Redirect to step 1 if on base /transaksi route
    if (
      location.pathname === "/transaksi" ||
      location.pathname === "/transaksi/"
    ) {
      throw redirect({ to: "/transaksi/1" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const matchRoute = useMatchRoute();
  const currentStep = useTestingFormStore((state) => state.currentStep);
  const setCurrentStep = useTestingFormStore((state) => state.setCurrentStep);

  // Sync Zustand currentStep with actual route
  useEffect(() => {
    if (matchRoute({ to: "/transaksi/1" })) setCurrentStep(1);
    else if (matchRoute({ to: "/transaksi/2" })) setCurrentStep(2);
    else if (matchRoute({ to: "/transaksi/3" })) setCurrentStep(3);
    else if (matchRoute({ to: "/transaksi/4" })) setCurrentStep(4);
  }, [matchRoute, setCurrentStep]);

  return (
    <div className="h-screen overflow-scroll bg-primary-foreground">
      {/* Background Grid Pattern */}
      <GridBackground />

      <div className="relative z-10">
        <Navbar />

        <div className="mx-auto max-w-7xl space-y-12 px-4 py-8">
          {/* Page Title */}
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-[#0056B3]">
              Layanan Pengujian
            </h1>
            <div className="mx-auto h-2 w-96 bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
          </div>

          {/* Stepper */}
          <Stepper currentStep={currentStep} />

          <Outlet />
        </div>
      </div>
    </div>
  );
}
