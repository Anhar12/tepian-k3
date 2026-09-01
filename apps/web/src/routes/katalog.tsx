import Navbar from "@/components/navbar";
import { createFileRoute, Link } from "@tanstack/react-router";
import { KatalogBrowser } from "@/components/katalog-browser";
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
    <div className="min-h-screen bg-[#f7f9fc] font-['Poppins'] text-slate-800">
      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <section className="mx-auto max-w-3xl space-y-6 text-center">
            <p className="text-sm font-semibold tracking-[0.24em] text-primary uppercase">
              Layanan Pengujian K3
            </p>
            <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-tight text-[#123f98] md:text-5xl">
              Katalog Pengujian
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-500 md:text-base">
              Temukan berbagai parameter pengujian K3 yang sesuai dengan
              kebutuhan perusahaan Anda. Pilih klaster industri dan tentukan
              layanan terbaik untuk kebutuhan Anda.
            </p>
            <Link
              to="/pengujian/panduan"
              className="inline-flex items-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:scale-[1.01] hover:bg-primary/90 active:scale-[0.98]"
            >
              Baca Panduan Pengujian K3
            </Link>
          </section>

          <KatalogBrowser />
        </main>
      </div>
    </div>
  );
}
