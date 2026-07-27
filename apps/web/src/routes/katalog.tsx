import Navbar from "@/components/navbar";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clusters } from "./(core)/pengujian/-components/parameter-categories";
import { TestingTable } from "./(core)/pengujian/-components/testing-table";
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

        <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 font-['Poppins']">
          {/* Page Title & Banner */}
          <div className="space-y-6 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-[#0056B3]">
              Katalog Pengujian
            </h1>
            <div className="mx-auto h-2 w-96 bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
            <p className="mx-auto max-w-2xl text-slate-500">
              Temukan berbagai parameter pengujian K3 yang sesuai dengan kebutuhan perusahaan Anda.
              Pilih dari berbagai klaster industri dan temukan layanan terbaik kami.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
              </span>
              Belum tahu harus mulai dari mana? <Link to="/pengujian/panduan" className="underline hover:text-blue-800">Baca Panduan Pengujian K3</Link>
            </div>
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
