import GridBackground from "@/components/grid-background";
import { Separator } from "@/components/ui/separator";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const TITLE_TEXT = `
 ██████╗ ███████╗████████╗████████╗███████╗██████╗
 ██╔══██╗██╔════╝╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗
 ██████╔╝█████╗     ██║      ██║   █████╗  ██████╔╝
 ██╔══██╗██╔══╝     ██║      ██║   ██╔══╝  ██╔══██╗
 ██████╔╝███████╗   ██║      ██║   ███████╗██║  ██║
 ╚═════╝ ╚══════╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝

 ████████╗    ███████╗████████╗ █████╗  ██████╗██╗  ██╗
 ╚══██╔══╝    ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
    ██║       ███████╗   ██║   ███████║██║     █████╔╝
    ██║       ╚════██║   ██║   ██╔══██║██║     ██╔═██╗
    ██║       ███████║   ██║   ██║  ██║╚██████╗██║  ██╗
    ╚═╝       ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
 `;

function HomeComponent() {
  const navItems = [
    { label: "Beranda", href: "#" },
    { label: "Transaksi", href: "#" },
    { label: "FAQ", href: "#" },
    { label: "PPID", href: "#" },
  ];

  const pusatLayananItems: {
    imageSrc: string;
    title: string;
    description: string;
    link: string;
  }[] = [];

  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-neutral-950">
      {/* Landing Page Navbar */}
      <nav className="sticky top-0 z-50 container mx-auto flex h-16 items-center justify-between py-3.5 px-5 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm">
        <a href="/" className="text-xl font-bold text-primary">
          {/* image */}
          <img
            src="/assets/logo-tepiank3.png"
            alt="Tepian K3 Logo"
            className="object-contain w-44"
          />
        </a>
        <div className="flex items-center gap-4">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-lg font-medium text-primary hover:underline hover:cursor-pointer"
            >
              {item.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            Login
          </a>
          <a
            href="/register"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors"
          >
            Sign Up
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative flex min-h-[80vh] flex-col justify-center px-10 text-center"
        id="#beranda"
      >
        {/* Background Image/SVG */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <img
            src="/assets/hero-banner.jpg"
            className="object-fill w-full h-full"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col w-full h-full flex-1 justify-center">
          {/* Hero Title */}
          <div>
            <h1 className="relative text-6xl text-white text-start font-semibold">
              Pusat Pelatihan
            </h1>
            <h1 className="relative text-6xl text-white text-start font-semibold">
              K3 Samarinda
            </h1>
          </div>
          {/* Hero Footer */}
          <div className="mt-32 flex items-center gap-6">
            <div className="flex flex-col items-start gap-1">
              <h2 className="text-2xl text-white font-bold">500+</h2>
              <p className="text-white text-sm">Perusahaan Mitra</p>
            </div>
            <div className="h-12 w-px bg-white/50" />
            <div className="flex flex-col items-start gap-1">
              <h2 className="text-2xl text-white font-bold">10K+</h2>
              <p className="text-white text-sm">Pelatihan Selesai</p>
            </div>
            <div className="h-12 w-px bg-white/50" />
            <div className="flex flex-col items-start gap-1">
              <h2 className="text-2xl text-white font-bold">98%</h2>
              <p className="text-white text-sm">Tingkat Kepuasan</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pusat layanan kami */}
      <section
        className="relative container min-h-screen bg-muted/50 py-16 px-10"
        id="#layanan"
      >
        <GridBackground />
        <div className="relative z-10 mb-8 w-fit flex flex-col items-center mx-auto gap-2">
          <h2 className="text-3xl font-semibold text-center text-primary">
            Pusat Layanan Kami
          </h2>
          <div className="mx-auto h-0.5 w-full bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 relative z-10">
          {/* Service Cards */}
          {["Pelatihan K3", "Konsultasi K3", "Audit K3"].map((service) => (
            <div
              key={service}
              className="rounded-lg border border-border bg-white p-6 text-center dark:bg-neutral-900"
            >
              <h3 className="text-xl font-medium mb-2">{service}</h3>
              <p className="text-muted-foreground">
                Deskripsi singkat tentang layanan {service}.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Content layer - not affected by mask */}
      <div className="relative container mx-auto max-w-3xl px-4 py-2">
        <GridBackground />
        <pre className="overflow-x-auto font-mono text-sm">{TITLE_TEXT}</pre>
        <div className="grid gap-6">
          {/* Card with inverted corner effect */}
          <section className="relative rounded-2xl border border-r-0 border-t-0 bg-white p-6 dark:bg-neutral-900">
            {/* Inverted corner at top-right with proper border */}
            <svg
              className="absolute -top-px -right-px h-8 w-8"
              viewBox="0 0 32 32"
              fill="none"
            >
              {/* Background fill for the inverted curve */}
              <path
                d="M 0 0 L 32 0 L 32 32 Q 32 0 0 0 Z"
                className="fill-white dark:fill-neutral-950"
              />
              {/* The inverted curve border */}
              <path
                d="M 0 0 Q 32 0 32 32"
                className="stroke-border"
                strokeWidth="1"
                fill="none"
              />
            </svg>
            {/* Top border line (left of the notch) */}
            <div className="bg-border absolute -top-px left-3 h-px w-[calc(100%-2rem)]" />
            {/* Right border line (below the notch) */}
            <div className="bg-border absolute -right-px top-8 h-[calc(100%-2.5rem)] w-px" />
            <h2 className="text-lg font-semibold">Card Title</h2>
            <p className="text-muted-foreground mt-2">
              This card has an inverted border radius effect on the top-right
              corner.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
