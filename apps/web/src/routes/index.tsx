import { Skeleton } from "@/components/ui/skeleton";
// import GridBackground from "@/components/grid-background";
import LandingNavbar from "@/components/navbar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { authMeQueryOptions } from "@/utils/auth-query";
import { trpc } from "@/utils/trpc";
import {
  createFileRoute,
  Link,
  useNavigate,
  type LinkProps,
} from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPublicUrl } from "@/utils/url";
import Autoplay from "embla-carousel-autoplay";
import ImageWithFallback from "@/components/image-with-fallback";
import GradientBox from "@/components/gradient-box";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(authMeQueryOptions()),
  component: HomeComponent,
});

const pusatLayananItems: {
  imageSrc: string;
  title: string;
  to: LinkProps["to"];
}[] = [
  {
    imageSrc: "/assets/pengujian.webp",
    title: "Pengujian",
    to: "/pengujian",
  },
  {
    imageSrc: "/assets/pelatihan.webp",
    title: "Pelatihan",
    to: "/pelatihan",
  },
  {
    imageSrc: "/assets/uji-kompetensi.webp",
    title: "Uji Kompetensi",
    to: "/uji-kompetensi",
  },
  {
    imageSrc: "/assets/konsultasi.webp",
    title: "Konsultasi",
    to: "/konsultasi",
  },
];

const faqItems = [
  {
    value: "item-1",
    trigger: "Is it accessible?",
    content: "",
  },
  {
    value: "item-2",
    trigger: "Shipping Details",
    content: "",
  },
  {
    value: "item-3",
    trigger: "Product Information",
    content: (
      <>
        <p>
          Our flagship product combines cutting-edge technology with sleek
          design. Built with premium materials, it offers unparalleled
          performance and reliability.
        </p>
        <p>
          Key features include advanced processing capabilities, and an
          intuitive user interface designed for both beginners and experts.
        </p>
      </>
    ),
  },
  {
    value: "item-4",
    trigger:
      "What are the key considerations when implementing a comprehensive enterprise-level authentication system?",
    content: "",
  },
  {
    value: "item-5",
    trigger:
      "How does modern distributed system architecture handle eventual consistency and data synchronization across multiple regions?",
    content: "",
  },
];

const footerLinks = {
  tautanCepat: [
    { label: "Program Pelatihan", href: "/pelatihan" },
    { label: "Jadwal Pengujian", href: "/pengujian" },
    { label: "Biaya Layanan", href: "/katalog" },
    { label: "Verifikasi Sertifikat", href: "/verify" },
  ],
  hubungiKami: [
    { label: "Program Pelatihan", href: "/pelatihan" },
    { label: "Jadwal Pengujian", href: "/pengujian" },
    { label: "Biaya Layanan", href: "/katalog" },
    { label: "Verifikasi Sertifikat", href: "/verify" },
  ],
};

function HomeComponent() {
  const navigate = useNavigate();

  const { data: banners, isLoading: isBannersLoading } = useQuery(
    trpc.platform.banner.getAllBanners.queryOptions(),
  );

  const { data: news, isLoading: isNewsLoading } = useQuery(
    trpc.platform.news.getFirst5News.queryOptions(),
  );

  return (
    <div className="w-full overflow-x-hidden overflow-y-auto bg-white dark:bg-neutral-950">
      {/* Landing Page Navbar */}
      <LandingNavbar />

      {/* Hero */}
      <section
        className="relative flex h-[60vh] flex-col justify-center px-4 text-center sm:px-10 md:h-[80vh] lg:h-[95vh]"
        id="beranda"
      >
        {/* Background Image */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden bg-primary">
          <ImageWithFallback
            src="/assets/hero-banner.webp"
            className="h-full w-full"
            imgClassName="object-cover object-bottom-right"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex h-full w-full flex-1 flex-col items-start justify-center px-4 sm:px-6 md:px-16">
          {/* Hero Title & Description */}
          <div className="mt-auto mb-auto max-w-2xl">
            <h1 className="text-start text-3xl leading-tight font-bold text-white sm:text-4xl md:text-5xl lg:text-7xl">
              Pusat Pelatihan
              <br />
              K3 Samarinda
            </h1>
            <p className="mt-4 max-w-lg text-start text-sm leading-relaxed text-white/90 sm:text-base md:mt-6 md:text-lg">
              Meningkatkan standar keselamatan kerja melalui program pelatihan
              profesional dan sertifikasi kompetensi yang diakui secara
              nasional.
            </p>
          </div>

          {/* Hero Footer */}
          <div className="mb-4 flex w-full items-end justify-between sm:mb-8">
            {/* Stats */}
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="flex flex-col items-start gap-1">
                <h2 className="text-xl font-bold text-white sm:text-2xl md:text-3xl">
                  500+
                </h2>
                <p className="text-xs text-white/80 sm:text-sm">
                  Perusahaan Mitra
                </p>
              </div>
              <div className="h-8 w-px bg-white/40 sm:h-12" />
              <div className="flex flex-col items-start gap-1">
                <h2 className="text-xl font-bold text-white sm:text-2xl md:text-3xl">
                  10K+
                </h2>
                <p className="text-xs text-white/80 sm:text-sm">
                  Pelatihan Selesai
                </p>
              </div>
              <div className="h-8 w-px bg-white/40 sm:h-12" />
              <div className="flex flex-col items-start gap-1">
                <h2 className="text-xl font-bold text-white sm:text-2xl md:text-3xl">
                  98%
                </h2>
                <p className="text-xs text-white/80 sm:text-sm">
                  Tingkat Kepuasan
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pusat Layanan Kami */}
      <section
        className="relative flex min-h-[calc(100vh-80vh)] flex-col bg-muted/50 px-10 py-16"
        id="layanan"
      >
        {/* <GridBackground /> */}
        <div className="relative z-10 mx-auto mb-8 flex w-fit flex-col items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm font-medium tracking-wider text-primary">
            <GradientBox /> layanan pusat K3
          </span>
          <h2 className="mb-2 text-center text-5xl font-semibold text-primary md:text-6xl">
            Pusat layanan kami
          </h2>
          <div className="mx-auto h-2 w-full bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
        </div>
        <div className="relative z-10 my-auto flex flex-row flex-wrap items-center justify-center gap-6">
          {/* Service Cards */}
          {pusatLayananItems.map((item) => (
            <Card
              key={item.title}
              className="w-64 cursor-pointer overflow-hidden rounded-4xl transition-shadow hover:shadow-lg"
              onClick={() => navigate({ to: item.to })}
            >
              <CardHeader>
                <div className="flex flex-row items-center justify-center overflow-hidden">
                  <ImageWithFallback
                    src={item.imageSrc}
                    alt={item.title}
                    className="size-40 object-contain"
                  />
                </div>
              </CardHeader>
              <CardFooter className="flex flex-row items-center">
                <a className="w-full text-center text-2xl font-semibold text-primary">
                  {item.title}
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Company Profile */}
      <section
        className="relative flex items-center justify-center gap-12 px-10 py-20 md:px-20"
        id="profile"
      >
        {/* Left: Building Photo with Badge */}
        <div className="relative hidden w-full max-w-md shrink-0 md:block">
          <div className="overflow-hidden rounded-2xl">
            <ImageWithFallback
              src="/assets/profile-banner.webp"
              alt="Balai Tepian K3"
              className="h-105 w-full object-cover"
            />
          </div>
          {/* Top-left Icon */}
          <div className="absolute top-4 left-4">
            <ImageWithFallback
              src="/assets/profile-banner-icon.webp"
              alt="Balai K3 Icon"
              className="h-16 w-auto object-contain brightness-0 invert"
            />
          </div>
          {/* 30+ Tahun Badge */}
          <div className="absolute right-4 -bottom-6 flex flex-col items-center rounded-2xl bg-primary px-8 py-5 text-white shadow-lg">
            <span className="text-4xl font-bold">30+</span>
            <span className="text-sm font-medium">Tahun Pengalaman</span>
          </div>
        </div>

        {/* Right: Text Content */}
        <div className="flex max-w-xl flex-col gap-6">
          <span className="text-sm font-semibold tracking-wider text-primary uppercase">
            Tepian K3
          </span>
          <h2 className="text-4xl leading-tight font-bold text-foreground md:text-5xl">
            Balai Keselamatan dan Kesehatan Kerja Samarinda
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Balai Keselamatan dan kesehatan kerja (K3) Samarinda merupakan
            lembaga resmi yang berperan strategis dalam mendukung penerapan K3
            melalui pembinaan, pengujian dan pelatihan intensif.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Tujuan utama kami adalah menciptakan lingkungan kerja yang aman,
            sehat, dan produktif demi kesejahteraan tenaga kerja serta
            keberlangsungan industri sesuai regulasi yang berlaku.
          </p>
          <Link
            to="/profil"
            className="mt-4 inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            Baca selengkapnya
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Informasi Keselamatan & Kesehatan Kerja */}
      <section
        className="relative flex flex-col bg-accent/10 px-10 py-16"
        id="informasi"
      >
        {/* <GridBackground /> */}
        <div className="relative z-10 mx-auto mb-8 flex w-fit flex-col items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm font-medium tracking-wider text-primary">
            <GradientBox /> insights & updates
          </span>
          <h2 className="mb-2 max-w-3xl text-center text-5xl font-semibold text-primary md:text-6xl">
            Informasi Keselamatan & Kesehatan Kerja
          </h2>
          <div className="mx-auto h-2 w-full bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-6">
          {/* Featured Banner Card */}
          <div className="relative z-10 flex w-full items-center justify-center">
            {isBannersLoading ? (
              <div className="w-full max-w-6xl">
                <Card className="h-72 w-full overflow-hidden rounded-2xl md:h-80">
                  <CardContent className="flex h-full flex-col items-center justify-center p-6">
                    <Skeleton className="h-full w-full rounded-lg" />
                  </CardContent>
                </Card>
              </div>
            ) : banners && banners.length > 0 ? (
              <Carousel
                className="w-full max-w-6xl"
                opts={{ loop: true }}
                plugins={[Autoplay({ delay: 4000 })]}
              >
                <CarouselContent>
                  {banners.map((banner) => (
                    <CarouselItem key={banner.id}>
                      <div className="relative h-72 w-full overflow-hidden rounded-2xl md:h-80">
                        <ImageWithFallback
                          src={getPublicUrl(banner.bannerUrl ?? "")}
                          alt={banner.title}
                          className="h-full w-full object-cover"
                          fallbackClassName="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/40 to-transparent" />
                        {/* Text Content */}
                        <div className="absolute inset-0 flex items-center justify-between p-8 md:p-12">
                          <div className="max-w-lg">
                            <h3 className="text-2xl leading-tight font-bold text-white italic md:text-3xl">
                              {banner.title}
                            </h3>
                          </div>
                          <Button
                            variant="ghost"
                            className="flex shrink-0 items-center gap-2 self-end text-sm font-medium text-white hover:bg-white/10 hover:text-white"
                            onClick={() => navigate({ to: "/berita" })}
                          >
                            Selengkapnya
                            <span className="flex size-10 items-center justify-center rounded-full bg-primary">
                              <ArrowUpRight className="size-5 text-white" />
                            </span>
                          </Button>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full border-0 bg-white/20 p-2 text-white shadow-none backdrop-blur-sm hover:bg-white/40" />
                <CarouselNext className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full border-0 bg-white/20 p-2 text-white shadow-none backdrop-blur-sm hover:bg-white/40" />
              </Carousel>
            ) : (
              <div className="w-full max-w-6xl">
                <Card className="h-72 w-full overflow-hidden rounded-2xl md:h-80">
                  <CardContent className="flex h-full flex-col items-center justify-center text-muted-foreground">
                    <p>No banners available</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Small News Cards */}
          <div className="relative z-10 flex flex-row flex-wrap items-center justify-center gap-6">
            {isNewsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card
                  key={i}
                  className="flex h-105 w-80 flex-col overflow-hidden rounded-2xl"
                >
                  <CardHeader className="p-0">
                    <Skeleton className="h-48 w-full rounded-none" />
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-2 p-5">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                  <CardFooter className="p-5 pt-0">
                    <Skeleton className="h-4 w-32" />
                  </CardFooter>
                </Card>
              ))
            ) : news && news.length > 0 ? (
              news.slice(0, 3).map((newsItem) => (
                <Card
                  key={newsItem.id}
                  className="group flex h-105 w-80 cursor-pointer flex-col overflow-hidden rounded-2xl border-0 shadow-sm transition-shadow hover:shadow-lg"
                  onClick={() =>
                    navigate({
                      to: "/berita/$newsId",
                      params: { newsId: newsItem.id },
                    })
                  }
                >
                  <CardHeader className="p-0">
                    <div className="h-48 w-full overflow-hidden">
                      <ImageWithFallback
                        src={getPublicUrl(newsItem.imageUrl ?? "")}
                        alt={newsItem.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-3">
                    <h3 className="line-clamp-2 shrink-0 text-xl font-bold text-primary group-hover:underline">
                      {newsItem.title}
                    </h3>
                    <p className="line-clamp-2 shrink-0 text-sm leading-relaxed text-muted-foreground">
                      {newsItem.content.replace(/<[^>]*>/g, "").slice(0, 150)}
                    </p>
                  </CardContent>
                  <CardFooter className="mt-auto p-5 pt-0">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      selengkapnya
                      <ArrowRight className="size-4" />
                    </span>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="flex h-48 items-center justify-center">
                <p className="text-muted-foreground">Belum ada berita</p>
              </div>
            )}
          </div>

          {/* View All News Button */}
          {news && news.length > 0 && (
            <div className="relative z-10 mt-8 flex justify-center">
              <Button
                variant="outline"
                className="rounded-3xl border-primary px-8 text-primary hover:bg-primary/10"
                onClick={() => navigate({ to: "/berita" })}
              >
                Lihat Semua Berita
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="relative flex flex-col px-10 py-16" id="faq">
        <div className="relative z-10 mx-auto mb-8 flex w-fit flex-col items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm font-semibold tracking-wider text-primary">
            <GradientBox /> Trusted By
          </span>
          <h2 className="mb-2 max-w-xl text-center text-5xl font-semibold text-balance text-primary md:text-6xl">
            Frequently Asked Questions
          </h2>
          <div className="mx-auto h-2 w-full bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
        </div>

        {/* FAQ Items */}
        <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-6">
          <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue="item-3"
          >
            {faqItems.map((item) => (
              <AccordionItem key={item.value} value={item.value}>
                <AccordionTrigger className="text-left text-base font-semibold">
                  {item.trigger}
                </AccordionTrigger>
                {item.content && (
                  <AccordionContent className="flex flex-col gap-4 text-balance">
                    {item.content}
                  </AccordionContent>
                )}
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground" id="footer">
        {/* Main Footer Content */}
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-10 py-14 md:grid-cols-4">
          {/* Column 1: Logo & Description */}
          <div className="flex flex-col gap-4">
            <ImageWithFallback
              src="/assets/logo-tepiank3-white.webp"
              alt="Tepian K3 Logo"
              className="h-12 w-fit object-contain"
            />
            <p className="text-sm leading-relaxed text-primary-foreground/80">
              Lembaga pelatihan dan pengujian keselamatan kerja terpercaya di
              Kalimantan Timur. Membangun budaya aman untuk Indonesia maju.
            </p>
          </div>

          {/* Column 2: Tautan Cepat */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold">Tautan Cepat</h3>
            <nav className="flex flex-col gap-2.5">
              {footerLinks.tautanCepat.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 3: Hubungi Kami */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold">Hubungi Kami</h3>
            <nav className="flex flex-col gap-2.5">
              {footerLinks.hubungiKami.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 4: Ikuti Kami */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold">Ikuti Kami</h3>
          </div>
        </div>

        {/* Copyright */}
        <div className="flex items-center justify-center bg-primary-foreground px-10 py-5">
          <p className="text-center text-sm text-[hsla(213,97%,14%,1)]">
            Copyright &copy; 2025 Balai K3 Samarinda
          </p>
        </div>
      </footer>
    </div>
  );
}
