import Navbar from "@/components/navbar";
import { createFileRoute } from "@tanstack/react-router";
import { Clusters } from "./(core)/-components/parameter-categories";
import { TestingTable } from "./(core)/-components/testing-table";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/katalog")({
  component: RouteComponent,
});

function RouteComponent() {
  const tableRef = useRef<HTMLDivElement>(null);

  // Save scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (tableRef.current) {
        sessionStorage.setItem(
          "testingTableScrollY",
          window.scrollY.toString(),
        );
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Restore scroll position
  useEffect(() => {
    const savedScrollY = sessionStorage.getItem("testingTableScrollY");
    if (savedScrollY) {
      window.scrollTo(0, parseInt(savedScrollY, 10));
    }
  }, []);

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
              Katalog Pengujian
            </h1>
            <div className="mx-auto h-2 w-96 bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
          </div>

          {/* Clusters */}
          <Clusters route="/katalog" />

          {/* Testing Table */}
          <TestingTable route="/katalog" />
        </div>
      </div>
    </div>
  );
}
