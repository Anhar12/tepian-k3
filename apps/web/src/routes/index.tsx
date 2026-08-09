import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
// import GridBackground from "@/components/grid-background";
import LandingNavbar from "@/components/navbar";
import Footer from "@/components/footer";
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
  type CarouselApi,
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
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPublicUrl } from "@/utils/url";
import Autoplay from "embla-carousel-autoplay";
import ImageWithFallback from "@/components/image-with-fallback";
import KalimantanMap from "@/components/kalimantan-map";
import { cn } from "@/lib/utils";

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
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  // Jump mode state for hero banner navigator
  const [isJumpMode, setIsJumpMode] = useState(false);
  const [jumpInputVal, setJumpInputVal] = useState("");

  const { data: banners, isLoading: isBannersLoading } = useQuery(
    trpc.platform.banner.getAllBanners.queryOptions(),
  );

  const { data: infoBanners, isLoading: isInfoBannersLoading } = useQuery(
    trpc.platform.banner.getAllInfoBanners.queryOptions(),
  );

  const { data: landingStatsData } = useQuery(
    trpc.platform.landingStats.getAll.queryOptions(),
  );

  const { data: landingRegionData } = useQuery(
    trpc.platform.landingRegion.getAll.queryOptions(),
  );

  const { data: news, isLoading: isNewsLoading } = useQuery(
    trpc.platform.news.getFirst5News.queryOptions(),
  );

  const { data: dbFaqs } = useQuery(
    trpc.platform.faq.getByCategory.queryOptions({ category: "general" }),
  );

  const { data: heroAutoplaySetting } = useQuery(
    trpc.platform.setting.getByKey.queryOptions({
      key: "landing.hero.autoplay",
    }),
  );

  const { data: heroNavigatorModeSetting } = useQuery(
    trpc.platform.setting.getByKey.queryOptions({
      key: "landing.hero.navigator.mode",
    }),
  );

  const isAutoplayEnabled = heroAutoplaySetting?.value !== "false";
  const navigatorMode =
    heroNavigatorModeSetting?.value === "all" ? "all" : "windowed";

  useEffect(() => {
    if (!api) return;

    const savedSlide = sessionStorage.getItem("hero-banner-slide");
    if (savedSlide !== null) {
      const idx = parseInt(savedSlide, 10);
      if (!isNaN(idx) && idx > 0) {
        api.scrollTo(idx, true);
      }
    }

    setCurrent(api.selectedScrollSnap());
    const onSelect = () => {
      const newSlide = api.selectedScrollSnap();
      setCurrent(newSlide);
      sessionStorage.setItem("hero-banner-slide", String(newSlide));
    };

    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const displayBanners =
    banners && banners.length > 0
      ? banners
      : [
          {
            id: "placeholder",
            bannerUrl: "/assets/hero-banner.webp",
            title: "Hero Banner",
          },
        ];

  // Helper for hero navigator (sliding window 3 numbers or all numbers)
  const getVisibleSlideIndices = (
    currentIdx: number,
    total: number,
    mode: "windowed" | "all",
  ) => {
    if (mode === "all" || total <= 3)
      return Array.from({ length: total }, (_, i) => i);
    if (currentIdx === 0) return [0, 1, 2];
    if (currentIdx === total - 1) return [total - 3, total - 2, total - 1];
    return [currentIdx - 1, currentIdx, currentIdx + 1];
  };

  const visibleSlideIndices = getVisibleSlideIndices(
    current,
    displayBanners.length,
    navigatorMode,
  );

  const handleJumpSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const target = parseInt(jumpInputVal, 10);
    if (!isNaN(target) && target >= 1 && target <= displayBanners.length) {
      api?.scrollTo(target - 1);
    }
    setIsJumpMode(false);
    setJumpInputVal("");
  };

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

      {/* Hero Banner Carousel (16:9) */}
      <section
        className="mx-auto w-full max-w-7xl px-4 pt-4 pb-6 md:px-8 md:pt-6 md:pb-8"
        id="beranda"
      >
        <div
          className="group/hero relative aspect-16/9 w-full overflow-hidden rounded-[2rem] bg-primary shadow-xl"
          onMouseEnter={() => {
            const autoplay = api?.plugins()?.autoplay as
              | { stop?: () => void }
              | undefined;
            autoplay?.stop?.();
          }}
          onMouseLeave={() => {
            const autoplay = api?.plugins()?.autoplay as
              | { play?: () => void }
              | undefined;
            autoplay?.play?.();
          }}
        >
          {isBannersLoading ? (
            <Skeleton className="h-full w-full rounded-[2rem]" />
          ) : (
            <Carousel
              setApi={setApi}
              opts={{ loop: true }}
              plugins={
                isAutoplayEnabled
                  ? [Autoplay({ delay: 5000, stopOnInteraction: false })]
                  : []
              }
              className="h-full w-full"
            >
              <CarouselContent className="-ml-0 h-full">
                {displayBanners.map((b, idx) => (
                  <CarouselItem key={b.id ?? idx} className="h-full pl-0">
                    <div className="relative h-full w-full overflow-hidden">
                      <ImageWithFallback
                        src={
                          b.bannerUrl?.startsWith("/")
                            ? b.bannerUrl
                            : getPublicUrl(b.bannerUrl)
                        }
                        alt={b.title ?? `Banner ${idx + 1}`}
                        className="h-full w-full"
                        imgClassName="object-cover object-center"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {/* Slider Arrow Controls (Show on hover if multiple banners exist) */}
              {displayBanners.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => api?.scrollPrev()}
                    aria-label="Banner sebelumnya"
                    className="absolute top-1/2 left-4 z-20 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/30 text-white opacity-0 backdrop-blur-xs transition duration-200 group-hover/hero:opacity-100 hover:bg-black/50 active:scale-95"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => api?.scrollNext()}
                    aria-label="Banner berikutnya"
                    className="absolute top-1/2 right-4 z-20 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/30 text-white opacity-0 backdrop-blur-xs transition duration-200 group-hover/hero:opacity-100 hover:bg-black/50 active:scale-95"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Numbered Navigator — Tengah Bawah (3 visible atau semua + double-click jump, show on hover) */}
              {displayBanners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 z-20 flex max-w-[90%] -translate-x-1/2 items-center gap-1.5 overflow-x-auto rounded-full bg-black/50 px-3 py-1.5 opacity-0 shadow-lg backdrop-blur-md transition duration-200 group-hover/hero:opacity-100">
                  {visibleSlideIndices.map((index, posIdx) => {
                    const isMiddle =
                      visibleSlideIndices.length === 3
                        ? posIdx === 1
                        : index === current;

                    if (isMiddle && isJumpMode) {
                      return (
                        <form
                          key={index}
                          onSubmit={handleJumpSubmit}
                          className="inline-flex"
                        >
                          <input
                            type="number"
                            min={1}
                            max={displayBanners.length}
                            autoFocus
                            value={jumpInputVal}
                            onChange={(e) => setJumpInputVal(e.target.value)}
                            onBlur={() => handleJumpSubmit()}
                            className="size-7 rounded-full bg-white text-center text-xs font-bold text-black shadow-xs outline-none"
                            placeholder={`${index + 1}`}
                          />
                        </form>
                      );
                    }

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => api?.scrollTo(index)}
                        onDoubleClick={() => {
                          if (isMiddle) {
                            setJumpInputVal(`${index + 1}`);
                            setIsJumpMode(true);
                          }
                        }}
                        className={cn(
                          "flex size-6 cursor-pointer items-center justify-center rounded-full text-xs font-bold transition-all duration-300 focus:outline-hidden",
                          current === index
                            ? "scale-110 bg-white text-black shadow-xs"
                            : "bg-white/25 text-white hover:bg-white/50",
                        )}
                        aria-label={`Ke banner ${index + 1}`}
                        title={
                          isMiddle
                            ? "Double click untuk loncat ke slide tertentu"
                            : undefined
                        }
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              )}
            </Carousel>
          )}
        </div>
      </section>

      {/* Pusat Layanan Kami */}
      <section
        className="relative flex min-h-[calc(100vh-80vh)] flex-col bg-muted/50 px-10 py-16"
        id="layanan"
      >
        {/* <GridBackground /> */}
        <div className="relative z-10 mx-auto mb-8 flex w-fit flex-col items-center gap-2">
          <h2 className="mb-2 text-center text-3xl font-semibold text-primary md:text-4xl lg:text-5xl">
            Pilih Layanan yang Anda Butuhkan
          </h2>
          <div className="mx-auto h-2 w-full bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
        </div>
        <div className="relative z-10 my-auto flex flex-row flex-wrap items-center justify-center gap-6">
          {/* Service Cards */}
          {pusatLayananItems.map((item) => (
            <div
              key={item.title}
              className="relative h-64 w-56 cursor-pointer overflow-hidden rounded-[30px] border-4 border-white bg-white shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] transition-transform hover:scale-105 hover:shadow-xl"
              onClick={() => navigate({ to: item.to })}
            >
              {/* Colored top background — badge/shield shape */}
              <svg
                className="absolute top-0 left-0 z-10 h-auto w-full"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 280 201"
                fill="none"
              >
                <path
                  d="M0 35C0 15.67 15.67 0 35 0H245C264.33 0 280 15.67 280 35V105.382C280 117.918 273.295 129.497 262.422 135.738L157.422 196.001C146.633 202.193 133.367 202.193 122.578 196.001L17.5778 135.738C6.70496 129.497 0 117.918 0 105.382V35Z"
                  fill={item.bgColor}
                />
              </svg>

              {/* 3D Illustration */}
              <div className="absolute inset-x-0 top-0 z-20 flex h-[190px] items-end justify-center">
                <ImageWithFallback
                  src={item.imageSrc}
                  alt={item.title}
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Label */}
              <p
                className="absolute inset-x-0 bottom-4 text-center text-xl font-semibold tracking-wide"
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
        className="relative flex flex-col items-center justify-center gap-12 px-10 py-20 md:px-20"
        id="profile"
      >
        {/* Section Heading: Tentang Kami */}
        <div className="mx-auto flex w-fit flex-col items-center gap-2">
          <h2 className="mb-2 text-center text-3xl font-semibold text-primary md:text-4xl lg:text-5xl">
            Tentang Kami
          </h2>
          <div className="mx-auto h-2 w-full bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
        </div>

        <div className="flex items-center justify-center gap-12">
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
            <h3 className="text-3xl leading-tight font-bold text-foreground md:text-4xl">
              Balai Keselamatan dan Kesehatan Kerja Samarinda
            </h3>
            <p className="text-base leading-relaxed text-muted-foreground">
              Kami mendukung penerapan Keselamatan dan Kesehatan Kerja melalui
              layanan pengujian, pelatihan, uji kompetensi, dan konsultasi K3.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground">
              Dengan dukungan TEPIAN K3, masyarakat dan perusahaan dapat
              memperoleh informasi serta mengajukan layanan secara daring dalam
              satu platform.
            </p>
            <Link
              to="/profil"
              className="mt-4 inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Baca selengkapnya
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Statistik & Wilayah Kerja */}
      <section
        className="relative flex flex-col bg-white px-6 py-16 md:px-16"
        id="statistik"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-12">
          {/* Section Heading: Infografis */}
          <div className="mx-auto flex w-fit flex-col items-center gap-2">
            <h2 className="mb-2 text-center text-3xl font-semibold text-primary md:text-4xl lg:text-5xl">
              Infografis
            </h2>
            <div className="mx-auto h-2 w-full bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
          </div>

          {/* 3 Stat Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Layanan Pengujian */}
            {(() => {
              const stat = landingStatsData?.find(
                (s) => s.serviceType === "pengujian",
              );
              const pCount = stat?.primaryCount ?? 540;
              const sCount = stat?.secondaryCount ?? 182;

              return (
                <div className="flex flex-col overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-xl">
                  <div className="flex flex-col items-center justify-center gap-3 bg-gradient-to-r from-sky-500 to-blue-600 py-10 text-white">
                    <ImageWithFallback
                      src="/assets/layanan_pengujian_thumb.webp"
                      alt="Layanan Pengujian"
                      className="h-24 w-auto object-contain drop-shadow-lg"
                    />
                    <h3 className="text-xl font-bold">Layanan Pengujian</h3>
                  </div>
                  <div className="flex flex-col items-center gap-4 p-6">
                    <div className="text-center">
                      <span className="text-4xl font-extrabold text-blue-600">
                        {pCount.toLocaleString("id-ID")}
                      </span>
                      <p className="mt-1 text-sm font-semibold text-blue-600">
                        Pengujian Dilakukan
                      </p>
                    </div>
                    <div className="h-px w-full bg-neutral-100" />
                    <div className="flex items-center gap-3">
                      <ImageWithFallback
                        src="/assets/building-05.svg"
                        alt=""
                        className="h-10 w-10 object-contain"
                      />
                      <div>
                        <span className="text-xl font-extrabold text-blue-600">
                          {sCount.toLocaleString("id-ID")}
                        </span>
                        <p className="text-xs font-semibold text-blue-600">
                          Perusahaan Dilayani
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Layanan Pelatihan */}
            {(() => {
              const stat = landingStatsData?.find(
                (s) => s.serviceType === "pelatihan",
              );
              const pCount = stat?.primaryCount ?? 20;
              const sCount = stat?.secondaryCount ?? 4500;

              return (
                <div className="flex flex-col overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-xl">
                  <div className="flex flex-col items-center justify-center gap-3 bg-gradient-to-r from-emerald-400 to-teal-500 py-10 text-white">
                    <ImageWithFallback
                      src="/assets/layanan_pelatihan_thumb.webp"
                      alt="Layanan Pelatihan"
                      className="h-24 w-auto object-contain drop-shadow-lg"
                    />
                    <h3 className="text-xl font-bold">Layanan Pelatihan</h3>
                  </div>
                  <div className="flex flex-col items-center gap-4 p-6">
                    <div className="text-center">
                      <span className="text-4xl font-extrabold text-emerald-600">
                        {pCount.toLocaleString("id-ID")}
                      </span>
                      <p className="mt-1 text-sm font-semibold text-emerald-600">
                        Pelatihan Dilakukan
                      </p>
                    </div>
                    <div className="h-px w-full bg-neutral-100" />
                    <div className="flex items-center gap-3">
                      <ImageWithFallback
                        src="/assets/group-3.svg"
                        alt=""
                        className="h-10 w-10 object-contain"
                      />
                      <div>
                        <span className="text-xl font-extrabold text-emerald-600">
                          {sCount.toLocaleString("id-ID")}
                        </span>
                        <p className="text-xs font-semibold text-emerald-600">
                          Peserta Pelatihan
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Layanan Uji Kompetensi */}
            {(() => {
              const stat = landingStatsData?.find(
                (s) => s.serviceType === "uji_kompetensi",
              );
              const pCount = stat?.primaryCount ?? 2;
              const sCount = stat?.secondaryCount ?? 30;

              return (
                <div className="flex flex-col overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-xl">
                  <div className="flex flex-col items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-purple-600 py-10 text-white">
                    <ImageWithFallback
                      src="/assets/layanan_ukom_thumb.webp"
                      alt="Layanan Uji Kompetensi"
                      className="h-24 w-auto object-contain drop-shadow-lg"
                    />
                    <h3 className="text-xl font-bold">
                      Layanan Uji Kompetensi
                    </h3>
                  </div>
                  <div className="flex flex-col items-center gap-4 p-6">
                    <div className="text-center">
                      <span className="text-4xl font-extrabold text-purple-600">
                        {pCount.toLocaleString("id-ID")}
                      </span>
                      <p className="mt-1 text-sm font-semibold text-purple-600">
                        Uji Kompetensi Dilakukan
                      </p>
                    </div>
                    <div className="h-px w-full bg-neutral-100" />
                    <div className="flex items-center gap-3">
                      <ImageWithFallback
                        src="/assets/award-1.svg"
                        alt=""
                        className="h-10 w-10 object-contain"
                      />
                      <div>
                        <span className="text-xl font-extrabold text-purple-600">
                          {sCount.toLocaleString("id-ID")}
                        </span>
                        <p className="text-xs font-semibold text-purple-600">
                          Peserta Uji Kompetensi
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Wilayah Kerja Balai K3 Samarinda */}
          <div className="flex flex-col gap-6 pt-6">
            <h2 className="text-2xl font-extrabold text-blue-700 md:text-3xl">
              Wilayah Kerja Balai K3 Samarinda
            </h2>

            <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
              {/* Left SVG Map */}
              <div className="flex w-full justify-center lg:w-3/5">
                <KalimantanMap regions={landingRegionData} />
              </div>

              {/* Right Table / Card */}
              <div className="w-full max-w-md lg:w-2/5">
                <div className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-xl">
                  <div className="bg-blue-600 px-6 py-4 text-white">
                    <h3 className="text-xl font-bold">Sebaran Perusahaan</h3>
                  </div>
                  <div className="flex flex-col divide-y divide-neutral-100 p-4">
                    {[
                      {
                        key: "kalimantan_timur",
                        defaultName: "Kalimantan Timur",
                        defaultCount: 64,
                      },
                      {
                        key: "kalimantan_selatan",
                        defaultName: "Kalimantan Selatan",
                        defaultCount: 42,
                      },
                      {
                        key: "kalimantan_utara",
                        defaultName: "Kalimantan Utara",
                        defaultCount: 34,
                      },
                      {
                        key: "kalimantan_tengah",
                        defaultName: "Kalimantan Tengah",
                        defaultCount: 23,
                      },
                      {
                        key: "kalimantan_barat",
                        defaultName: "Kalimantan Barat",
                        defaultCount: 14,
                      },
                    ].map((prov) => {
                      const found = landingRegionData?.find(
                        (r) => r.provinceKey === prov.key,
                      );
                      const name = found?.provinceName ?? prov.defaultName;
                      const count = found?.companyCount ?? prov.defaultCount;

                      return (
                        <div
                          key={prov.key}
                          className="flex items-center justify-between px-4 py-3.5"
                        >
                          <span className="shrink-0 text-sm font-bold text-neutral-800">
                            {name}
                          </span>
                          <div className="mx-4 flex flex-1 items-center">
                            <div className="w-full border-b border-dotted border-neutral-300" />
                          </div>
                          <span className="shrink-0 text-base font-extrabold text-neutral-900">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
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
          <h2 className="mb-2 max-w-3xl text-center text-3xl font-semibold text-primary md:text-4xl lg:text-5xl">
            Informasi & Update Terkini
          </h2>
          <div className="mx-auto h-2 w-full bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-6">
          {/* Featured Banner Card */}
          <div className="relative z-10 flex w-full items-center justify-center">
            {isInfoBannersLoading ? (
              <div className="w-full max-w-6xl">
                <Card className="h-72 w-full overflow-hidden rounded-2xl md:h-80">
                  <CardContent className="flex h-full flex-col items-center justify-center p-6">
                    <Skeleton className="h-full w-full rounded-lg" />
                  </CardContent>
                </Card>
              </div>
            ) : infoBanners && infoBanners.length > 0 ? (
              <Carousel
                className="w-full max-w-6xl"
                opts={{ loop: true }}
                plugins={[Autoplay({ delay: 4000 })]}
              >
                <CarouselContent>
                  {infoBanners.map((banner) => (
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
                    <p>Belum ada banner informasi</p>
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
          <h2 className="mb-2 max-w-xl text-center text-3xl font-semibold text-balance text-primary md:text-4xl lg:text-5xl">
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
      <Footer />
    </div>
  );
}
