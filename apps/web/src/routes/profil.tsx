import GridBackground from "@/components/grid-background";
import ImageWithFallback from "@/components/image-with-fallback";
import LandingNavbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlarmClock,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Mail,
  MapPin,
  PhoneCall,
  Target,
  Eye,
  History,
} from "lucide-react";

export const Route = createFileRoute("/profil")({
  component: ProfilePage,
});

const visiMisiItems = [
  {
    icon: Eye,
    title: "Visi",
    description:
      "Menjadi pusat unggulan dalam pengembangan keselamatan dan kesehatan kerja yang terpercaya, profesional, dan berkontribusi nyata bagi peningkatan kualitas tenaga kerja Indonesia.",
  },
  {
    icon: Target,
    title: "Misi",
    description: [
      "Menyelenggarakan pengujian K3 yang akurat, tepat waktu, dan sesuai standar nasional maupun internasional.",
      "Memberikan pelatihan dan pembinaan K3 yang berkualitas untuk meningkatkan kompetensi tenaga kerja.",
      "Melaksanakan konsultasi dan pendampingan K3 kepada perusahaan dan masyarakat.",
      "Mengembangkan kerja sama dengan berbagai pihak dalam upaya peningkatan budaya K3.",
    ],
  },
];

const layananItems = [
  {
    title: "Pengujian K3",
    description:
      "Pengujian lingkungan kerja, peralatan, dan bahan untuk memastikan keamanan dan kepatuhan terhadap standar K3.",
  },
  {
    title: "Pelatihan K3",
    description:
      "Program pelatihan komprehensif untuk meningkatkan kesadaran dan kompetensi K3 di tempat kerja.",
  },
  {
    title: "Uji Kompetensi",
    description:
      "Sertifikasi kompetensi tenaga kerja di bidang keselamatan dan kesehatan kerja.",
  },
  {
    title: "Konsultasi K3",
    description:
      "Layanan konsultasi untuk membantu perusahaan dalam menerapkan sistem manajemen K3.",
  },
];

function ProfilePage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden overflow-y-auto bg-white dark:bg-neutral-950">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative flex h-[60vh] flex-row items-center justify-center gap-4 px-10 py-16">
        {/* Background Image */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <ImageWithFallback
            src="/assets/hero-banner.webp"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-row items-center justify-center gap-8">
          {/* Logo */}
          <ImageWithFallback
            src="/assets/logo-balai-k3.webp"
            alt="Balai Tepian K3 Logo"
            className="hidden h-auto w-full max-w-64 rounded-2xl bg-white/95 object-contain p-6 shadow-xl md:block"
          />
          <div className="flex h-full w-fit flex-col items-start justify-center gap-4">
            <h1 className="text-start text-4xl font-bold text-white md:text-6xl">
              Balai K3 Samarinda
            </h1>
            <p className="max-w-xl text-justify text-xl font-medium text-balance text-white/90 md:text-2xl">
              Balai Keselamatan dan Kesehatan Kerja (K3) Samarinda merupakan
              lembaga yang berperan dalam mendukung penerapan keselamatan dan
              kesehatan kerja melalui pembinaan, pengujian, dan pelatihan K3.
            </p>
          </div>
        </div>
      </section>

      {/* Back Button */}
      <div className="container mx-auto px-4 pt-8 sm:px-6 md:px-10">
        <Button
          variant="ghost"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate({ to: "/" })}
        >
          <ArrowLeft className="size-4" />
          Kembali ke Beranda
        </Button>
      </div>

      {/* About Section */}
      <section className="container mx-auto px-4 py-12 sm:px-6 md:px-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex flex-col items-center gap-2">
            <h2 className="text-center text-3xl font-semibold text-primary md:text-4xl">
              Tentang Kami
            </h2>
            <div className="h-1 w-32 bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
          </div>

          <div className="space-y-6 text-justify text-lg leading-relaxed text-foreground">
            <p>
              Balai Keselamatan dan Kesehatan Kerja (K3) Samarinda merupakan
              Unit Pelaksana Teknis (UPT) di bawah Kementerian Ketenagakerjaan
              Republik Indonesia yang berperan strategis dalam mendukung
              penerapan keselamatan dan kesehatan kerja di wilayah Kalimantan
              Timur dan sekitarnya.
            </p>
            <p>
              Sebagai lembaga yang fokus pada pembinaan, pengujian, dan
              pelatihan K3, Balai K3 Samarinda berkomitmen untuk membantu
              menciptakan lingkungan kerja yang aman, sehat, dan produktif
              sesuai dengan peraturan perundang-undangan yang berlaku.
            </p>
            <p>
              Dengan dukungan tenaga ahli yang kompeten dan peralatan pengujian
              yang modern, Balai K3 Samarinda siap memberikan layanan terbaik
              bagi perusahaan, institusi, dan masyarakat dalam upaya peningkatan
              budaya K3 di Indonesia.
            </p>
          </div>
        </div>
      </section>

      {/* Sejarah Section */}
      <section className="relative bg-muted/50 px-4 py-16 sm:px-6 md:px-10">
        <GridBackground />
        <div className="relative z-10 container mx-auto">
          <div className="mb-8 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <History className="size-8 text-primary" />
              <h2 className="text-center text-3xl font-semibold text-primary md:text-4xl">
                Sejarah Singkat
              </h2>
            </div>
            <div className="h-1 w-32 bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
          </div>

          <div className="mx-auto max-w-4xl space-y-6 text-justify text-lg leading-relaxed text-foreground">
            <p>
              Balai K3 Samarinda didirikan sebagai respons terhadap kebutuhan
              pelayanan keselamatan dan kesehatan kerja yang semakin meningkat
              di wilayah Kalimantan Timur, khususnya dengan berkembangnya sektor
              industri pertambangan, kehutanan, dan manufaktur.
            </p>
            <p>
              Seiring dengan perkembangan zaman dan meningkatnya kesadaran akan
              pentingnya K3, Balai K3 Samarinda terus mengembangkan kapasitas
              dan layanannya untuk memenuhi kebutuhan stakeholder di berbagai
              sektor industri.
            </p>
          </div>
        </div>
      </section>

      {/* Visi Misi Section */}
      <section className="container mx-auto px-4 py-16 sm:px-6 md:px-10">
        <div className="mb-8 flex flex-col items-center gap-2">
          <h2 className="text-center text-3xl font-semibold text-primary md:text-4xl">
            Visi & Misi
          </h2>
          <div className="h-1 w-32 bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
        </div>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {visiMisiItems.map((item) => (
            <Card key={item.title} className="h-full">
              <CardHeader>
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                    <item.icon className="size-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl text-primary">
                    {item.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {Array.isArray(item.description) ? (
                  <ul className="space-y-3">
                    {item.description.map((desc, index) => (
                      <li key={index} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                        <span className="text-foreground">{desc}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-justify leading-relaxed text-foreground">
                    {item.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Layanan Section */}
      <section className="relative bg-accent/10 px-4 py-16 sm:px-6 md:px-10">
        <GridBackground />
        <div className="relative z-10 container mx-auto">
          <div className="mb-8 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="size-8 text-primary" />
              <h2 className="text-center text-3xl font-semibold text-primary md:text-4xl">
                Layanan Kami
              </h2>
            </div>
            <div className="h-1 w-32 bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
          </div>

          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            {layananItems.map((item) => (
              <Card
                key={item.title}
                className="transition-shadow hover:shadow-lg"
              >
                <CardHeader>
                  <CardTitle className="text-xl text-primary">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="container mx-auto px-4 py-16 sm:px-6 md:px-10">
        <div className="mb-8 flex flex-col items-center gap-2">
          <h2 className="text-center text-3xl font-semibold text-primary md:text-4xl">
            Hubungi Kami
          </h2>
          <div className="h-1 w-32 bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
        </div>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">
                Informasi Kontak
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Alamat</p>
                  <p className="text-muted-foreground">
                    Jl. P. Suryanata No. 123, Samarinda, Kalimantan Timur 75123
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <PhoneCall className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Telepon</p>
                  <p className="text-muted-foreground">+0232 4522 4023</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-muted-foreground">
                    balaik3samarinda@gmail.com
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlarmClock className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Jam Operasional</p>
                  <p className="text-muted-foreground">
                    Senin - Jumat, 08.00 - 16.00 WITA
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map Placeholder */}
          <Card className="overflow-hidden">
            <CardContent className="h-full p-0">
              <div className="flex h-full min-h-64 items-center justify-center bg-muted">
                <div className="text-center text-muted-foreground">
                  <MapPin className="mx-auto mb-2 size-12" />
                  <p>Peta Lokasi</p>
                  <p className="text-sm">Google Maps Embed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative mt-auto flex h-11 items-center justify-center bg-muted/50 px-4 py-4 sm:px-6 md:px-10">
        <p className="text-center text-sm font-normal text-foreground">
          &copy; 2025 Balai K3 Samarinda
        </p>
      </footer>
    </div>
  );
}
