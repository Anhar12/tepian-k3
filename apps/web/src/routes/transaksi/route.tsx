import Navbar from "@/components/navbar";
import {
  createFileRoute,
  Outlet,
  redirect,
  useMatchRoute,
  useNavigate,
} from "@tanstack/react-router";
import { Stepper } from "../-components/stepper";

export const Route = createFileRoute("/transaksi")({
  beforeLoad: ({ location }) => {
    // Only redirect if exactly on /transaksi (no child route)
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
  const navigate = useNavigate();

  // Determine current step based on route
  const getCurrentStep = () => {
    if (matchRoute({ to: "/transaksi/1" })) return 1;
    if (matchRoute({ to: "/transaksi/2" })) return 2;
    if (matchRoute({ to: "/transaksi/3" })) return 3;
    if (matchRoute({ to: "/transaksi/4" })) return 4;
    return 1;
  };

  const currentStep = getCurrentStep();

  return (
    <div className="bg-primary-foreground">
      {/* Background Grid Pattern */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

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
