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
  bgColor: string;
  textColor: string;
}[] = [
  {
    imageSrc: "/assets/pengujian.webp",
    title: "Pengujian",
    to: "/pengujian",
    bgColor: "#7e64fc",
    textColor: "#7e64fc",
  },
  {
    imageSrc: "/assets/pelatihan.webp",
    title: "Pelatihan",
    to: "/pelatihan",
    bgColor: "#efa106",
    textColor: "#efa106",
  },
  {
    imageSrc: "/assets/uji-kompetensi.webp",
    title: "Uji Kompetensi",
    to: "/uji-kompetensi",
    bgColor: "#5399fc",
    textColor: "#5399fc",
  },
  {
    imageSrc: "/assets/konsultasi.webp",
    title: "Konsultasi",
    to: "/konsultasi",
    bgColor: "#44a86b",
    textColor: "#44a86b",
  },
];




function HomeComponent() {
  const navigate = useNavigate();

  const { data: banners, isLoading: isBannersLoading } = useQuery(
    trpc.platform.banner.getAllBanners.queryOptions(),
  );

  const { data: news, isLoading: isNewsLoading } = useQuery(
    trpc.platform.news.getFirst5News.queryOptions(),
  );

  const { data: dbFaqs } = useQuery(
    trpc.platform.faq.getByCategory.queryOptions({ category: "general" }),
  );

  const { data: heroBannerSetting } = useQuery(
    trpc.platform.setting.getByKey.queryOptions({
      key: "landing.hero.image_url",
    }),
  );

  const heroImageSrc = heroBannerSetting?.value
    ? getPublicUrl(heroBannerSetting.value)
    : "/assets/hero-banner.webp";

  const faqItems =
    dbFaqs && dbFaqs.length > 0
      ? dbFaqs.map((f, i) => ({
          value: `item-${i + 1}`,
          trigger: f.question,
          content: <p>{f.answer}</p>,
        }))
      : [
          {
            value: "item-1",
            trigger: "Apakah Balai K3 Samarinda merupakan lembaga resmi?",
            content: (
              <p>
                Ya, Balai Keselamatan dan Kesehatan Kerja (K3) Samarinda adalah
                Unit Pelaksana Teknis resmi pemerintah yang didirikan untuk
                menyelenggarakan pembinaan, pengujian, dan sertifikasi K3.
              </p>
            ),
          },
          {
            value: "item-2",
            trigger:
              "Bagaimana cara memesan layanan pengujian lingkungan kerja?",
            content: (
              <p>
                Anda dapat memilih menu layanan Pengujian di halaman utama,
                memilih parameter uji yang dibutuhkan, mendaftar akun
                perusahaan, and menyelesaikan proses checkout secara online.
              </p>
            ),
          },
          {
            value: "item-3",
            trigger: "Apakah sertifikat hasil pengujian K3 diakui hukum?",
            content: (
              <p>
                Tentu saja. Seluruh laporan hasil pengujian lingkungan kerja
                yang kami terbitkan sah secara hukum dan diakui resmi oleh
                Kemenaker RI serta stakeholder keselamatan kerja nasional.
              </p>
            ),
          },
        ];

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
            src={heroImageSrc}
            className="h-full w-full"
            imgClassName="object-cover object-bottom-right"
          />
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
            <div
              key={item.title}
              className="relative h-80 w-70 cursor-pointer overflow-hidden rounded-[40px] border-4 border-white bg-white shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] transition-transform hover:scale-105 hover:shadow-xl"
              onClick={() => navigate({ to: item.to })}
            >
              {/* Colored top background — badge/shield shape */}
              <svg
                className="absolute top-0 left-0 z-10"
                xmlns="http://www.w3.org/2000/svg"
                width="280"
                height="201"
                viewBox="0 0 280 201"
                fill="none"
              >
                <path
                  d="M0 35C0 15.67 15.67 0 35 0H245C264.33 0 280 15.67 280 35V105.382C280 117.918 273.295 129.497 262.422 135.738L157.422 196.001C146.633 202.193 133.367 202.193 122.578 196.001L17.5778 135.738C6.70496 129.497 0 117.918 0 105.382V35Z"
                  fill={item.bgColor}
                />
              </svg>

              {/* 3D Illustration */}
              <div className="absolute inset-x-0 top-0 z-20 flex h-66.25 items-end justify-center">
                <ImageWithFallback
                  src={item.imageSrc}
                  alt={item.title}
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Label */}
              <p
                className="absolute inset-x-0 bottom-5 text-center text-2xl font-semibold tracking-wide"
                style={{ color: item.textColor }}
              >
                {item.title}
              </p>
            </div>
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
        {/* Decorative glow orbs */}
        <div
          className="pointer-events-none absolute top-20 right-0 size-36.75 rounded-[1000px] blur-[138.25px]"
          style={{ background: "#F28D00" }}
        />
        <div
          className="pointer-events-none absolute bottom-20 left-0 size-36.75 rounded-[1000px] blur-[138.25px]"
          style={{
            background:
              "linear-gradient(120deg, rgba(16, 185, 129, 0.80) 9.47%, rgba(5, 150, 105, 0.80) 63.82%)",
          }}
        />
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
      <footer
        className="relative overflow-hidden bg-[#1061D6] py-16 text-white"
        id="footer"
      >
        {/* Decorative watermark background */}
        <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-full overflow-hidden">
          <ImageWithFallback
            src="/assets/LOGO TEPIANK3 2.png"
            alt="Watermark Tepian K3"
            className="absolute -top-[32px] -left-[27px] h-[666px] w-[705px] object-contain opacity-[0.08] select-none"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-12">
          {/* Top Grid Area */}
          <div className="grid grid-cols-1 gap-12 pb-12 md:grid-cols-12">
            {/* Column 1: Logo & Description */}
            <div className="relative z-10 space-y-6 md:col-span-5">
              <ImageWithFallback
                src="/assets/LOGO TEPIANK3 1.png"
                alt="Tepian K3 Logo Putih"
                className="h-16 w-auto object-contain"
              />
              <p className="font-poppins max-w-md text-base leading-relaxed font-medium text-white/90">
                Lembaga pelatihan dan pengujian keselamatan kerja terpercaya di
                Kalimantan Timur. Membangun budaya aman untuk Indonesia maju.
              </p>
            </div>

            {/* Column 2: Tautan Cepat */}
            <div className="space-y-6 md:col-span-3 md:pl-8">
              <h3 className="font-poppins text-lg font-bold tracking-wider text-white">
                Tautan Cepat
              </h3>
              <ul className="font-poppins space-y-3.5 text-base font-semibold text-white/95">
                <li>
                  <Link
                    to="/pelatihan"
                    className="transition-all hover:underline"
                  >
                    Program Pelatihan
                  </Link>
                </li>
                <li>
                  <Link
                    to="/katalog"
                    className="transition-all hover:underline"
                  >
                    Jadwal Pengujian
                  </Link>
                </li>
                <li>
                  <Link
                    to="/katalog"
                    className="transition-all hover:underline"
                  >
                    Biaya Layanan
                  </Link>
                </li>
                <li>
                  <a href="/verify" className="transition-all hover:underline">
                    Verifikasi Sertifikat
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Hubungi Kami */}
            <div className="space-y-6 md:col-span-4">
              <h3 className="font-poppins text-lg font-bold tracking-wider text-white">
                Hubungi Kami
              </h3>
              <ul className="font-poppins space-y-3.5 text-base font-semibold text-white/95">
                <li>
                  <a
                    href="mailto:balaik3samarinda@gmail.com"
                    className="block transition-all hover:underline"
                  >
                    balaik3samarinda@gmail.com
                  </a>
                </li>
                <li>
                  <a
                    href="tel:0541771306"
                    className="block transition-all hover:underline"
                  >
                    (0541) 771306
                  </a>
                </li>
                <li className="leading-relaxed font-medium text-white/90">
                  Jl. Sentosa No.9, Sungai Pinang Dalam, Kec. Sungai Pinang,
                  Kota Samarinda, Kalimantan Timur 75242
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col items-center justify-center space-y-6 border-t border-white/20 pt-10">
            {/* Social Media Row */}
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <span className="font-poppins text-base font-bold text-white">
                Sosial Media Kami
              </span>
              <div className="flex items-center gap-3">
                {/* Instagram */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1061D6] transition-all duration-300 hover:scale-[1.05] hover:bg-slate-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="2"
                      y="2"
                      width="20"
                      height="20"
                      rx="5"
                      ry="5"
                    ></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                {/* YouTube */}
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1061D6] transition-all duration-300 hover:scale-[1.05] hover:bg-slate-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                  </svg>
                </a>
                {/* TikTok */}
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1061D6] transition-all duration-300 hover:scale-[1.05] hover:bg-slate-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                  </svg>
                </a>
                {/* X (formerly Twitter) */}
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1061D6] transition-all duration-300 hover:scale-[1.05] hover:bg-slate-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Copyright */}
            <p className="font-poppins text-center text-sm font-semibold text-white/90">
              Copyright &copy; 2026 Balai K3 Samarinda. All Rights Reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
