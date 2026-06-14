import { useState, useEffect } from "react";
import LandingNavbar from "@/components/navbar";
import Footer from "@/components/footer";
import ImageWithFallback from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { pageHead } from "@/utils/page-head";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { getPublicUrl } from "@/utils/url";

export const Route = createFileRoute("/ppid/")({
  component: PPIDPortalPage,
  head: () => pageHead("Portal PPID - Balai K3 Samarinda"),
});

// Data slide carousel — aset dari Figma CARD KONTEN SLIDE 1986:10086
const carouselSlides = [
  {
    src: "/assets/media_slide_1.webp",
    alt: "Kegiatan Media & Publikasi K3 #1",
  },
  {
    src: "/assets/media_slide_2.webp",
    alt: "Kegiatan Media & Publikasi K3 #2",
  },
  {
    src: "/assets/media_slide_3.webp",
    alt: "Kegiatan Media & Publikasi K3 #3",
  },
  {
    src: "/assets/media_slide_4.webp",
    alt: "Kegiatan Media & Publikasi K3 #4",
  },
  {
    src: "/assets/media_slide_5.webp",
    alt: "Kegiatan Media & Publikasi K3 #5",
  },
  {
    src: "/assets/media_slide_6.webp",
    alt: "Kegiatan Media & Publikasi K3 #6",
  },
  {
    src: "/assets/media_slide_7.webp",
    alt: "Kegiatan Media & Publikasi K3 #7",
  },
];

// Data berita & publikasi statis telah dihapus dan digantikan dengan integrasi tRPC dinamis.

/**
 * Portal PPID Balai K3 Samarinda page component.
 * Menampilkan profil, layanan informasi publik, informasi berkala/serta merta/setiap saat/dikecualikan,
 * serta media dan publikasi Balai K3 Samarinda.
 *
 * @returns {JSX.Element} Portal PPID page.
 */
function PPIDPortalPage() {
  const navigate = useNavigate();

  const { data: mediaData, isLoading } = useQuery(
    trpc.platform.mediaPublications.getPublicOffsetPaginatedMedia.queryOptions({
      page: 1,
      perPage: 3,
      sort: [{ id: "createdAt", desc: true }],
    }),
  );

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
        setIsTransitioning(false);
      }, 500);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const services = [
    {
      label: "Layanan",
      title: "Pengujian K3",
      icon: "/assets/icon_pengujian.webp",
      iconHeightClass: "h-[93px]",
      iconTopClass: "top-[8px]",
      iconLeftClass: "left-0",
      to: "/pengujian",
    },
    {
      label: "Layanan",
      title: "Uji Kompetensi",
      icon: "/assets/icon_uji_kompetensi.webp",
      iconHeightClass: "h-[80px]",
      iconLeftClass: "left-[2px]",
      iconTopClass: "top-[15px]",
      to: "/uji-kompetensi",
    },
    {
      label: "Layanan",
      title: "Pelatihan K3",
      icon: "/assets/icon_pelatihan.webp",
      iconHeightClass: "h-[92px]",
      iconTopClass: "top-[10px]",
      iconLeftClass: "left-0",
      to: "/pelatihan",
    },
    {
      label: "Layanan",
      title: "Permohonan Informasi",
      icon: "/assets/icon_permohonan.webp",
      iconHeightClass: "h-[85px]",
      iconLeftClass: "left-[5px]",
      iconTopClass: "top-[9px]",
      to: "/ppid/permohonan",
    },
  ];

  return (
    <div className="w-full overflow-x-hidden overflow-y-auto bg-white dark:bg-neutral-950">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative flex min-h-[500px] shrink-0 flex-col items-start justify-center overflow-hidden bg-[url('/assets/ppid-hero-banner.webp')] bg-cover bg-center bg-no-repeat px-6 py-20 md:px-16 lg:min-h-[646px] lg:px-24">
        {/* Subtle left gradient overlay matching Figma (node-id: 1986-14140) */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-full bg-[linear-gradient(to_right,_rgba(0,0,0,0.14)_0%,_rgba(0,0,0,0.09)_54%,_rgba(217,217,217,0)_100%)] md:w-[468px]" />

        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-start gap-6 text-left lg:mx-0">
          <h1 className="text-4xl leading-[1.04] font-bold tracking-tight text-white sm:text-5xl lg:text-[60px]">
            PPID Balai K3
            <br />
            Samarinda
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed font-medium text-[#F8FAFC]/90 sm:text-base lg:text-[20px]">
            Dapatkan informasi seputar K3 melalui layanan PPID Balai K3
            Samarinda secara mudah dan cepat.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Button
              className="h-[46px] rounded-xl border-2 border-[#AFCFFA] bg-[#1061D6] px-6 font-semibold text-[#F8FAFC] shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] transition-all hover:-translate-y-0.5 hover:bg-[#1061D6]/90"
              onClick={() => navigate({ to: "/ppid/permohonan" })}
            >
              Layanan Informasi Publik
            </Button>
            <Button
              className="h-[46px] rounded-xl border-2 border-[#F8FAFC] bg-white/10 px-6 font-semibold text-[#F8FAFC] shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] backdrop-blur-xs transition-all hover:-translate-y-0.5 hover:bg-white/20"
              onClick={() => navigate({ to: "/ppid/profil" })}
            >
              Baca Selengkapnya
            </Button>
          </div>
        </div>
      </section>

      {/* Layanan Publik K3 Section — sesuai Figma node 1986-14148 & 1986-12652 */}
      <section className="mx-auto max-w-7xl shrink-0 bg-white px-6 py-20 lg:px-8 dark:bg-neutral-950">
        <div className="flex flex-col items-center justify-between gap-16 lg:flex-row lg:items-start lg:gap-12">
          {/* ── KOLOM KIRI: Header + deskripsi + 4 service card ── */}
          <div className="flex w-full max-w-[750px] flex-col gap-10">
            {/* Section header — Frame 1000007964 */}
            <div className="flex w-full max-w-[579px] flex-col gap-5">
              <h2 className="font-poppins text-4xl font-semibold text-[#1061D6] md:text-5xl lg:text-[60px] lg:leading-[1.18]">
                Layanan Publik K3
              </h2>
              {/* Garis gradien dekoratif — Frame 40 */}
              <div className="h-3 w-full rounded-[2px] bg-gradient-to-r from-[#1061D6] via-[#78E275] to-white" />
            </div>

            {/* Teks deskripsi — Figma node 1986-14153 */}
            <p className="font-poppins text-lg font-medium tracking-[0.005em] text-[#4D4D4D] md:text-xl lg:text-[24px] lg:leading-[1.4] dark:text-neutral-400">
              Balai Keselamatan dan Kesehatan Kerja (K3) Samarinda menyediakan
              berbagai layanan di bidang keselamatan dan kesehatan kerja yang
              dapat diakses oleh masyarakat, perusahaan, dan tenaga kerja.
            </p>

            {/* 4 Service card — Figma CARD LAYANAN node 1986-14301 */}
            <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2">
              {services.map((svc) => (
                <button
                  key={svc.title}
                  type="button"
                  onClick={() => navigate({ to: svc.to })}
                  className="flex h-[130px] w-full max-w-[345px] cursor-pointer flex-row items-center gap-5 rounded-2xl border-none bg-white p-2.5 px-5 shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] transition-transform duration-200 hover:-translate-y-1 dark:bg-neutral-900"
                >
                  {/* Frame 1000002958 (Icon Container Group) */}
                  <div className="relative h-[110px] w-[110px] shrink-0">
                    {/* Ellipse 15 */}
                    <div className="absolute top-0 left-0 h-[110px] w-[110px] rounded-full bg-gradient-to-br from-[rgba(22,154,249,0.5)] to-[rgba(12,116,234,0.5)]" />
                    {/* Icon Image */}
                    <ImageWithFallback
                      src={svc.icon}
                      alt={svc.title}
                      className={`absolute ${svc.iconHeightClass} ${svc.iconLeftClass} ${svc.iconTopClass}`}
                      imgClassName="object-contain"
                    />
                  </div>

                  {/* Frame 1000007962 (Text Container) */}
                  <div className="flex flex-col items-start text-left">
                    <p className="font-poppins text-sm leading-normal font-normal text-[#4D4D4D] md:text-base dark:text-neutral-400">
                      Layanan
                    </p>
                    <p className="font-poppins mt-1 text-lg leading-snug font-semibold text-[#1061D6] md:text-xl">
                      {svc.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── KOLOM KANAN: Gambar talent + ornamen — Figma node 1986-14338 ── */}
          <div className="relative hidden h-[470px] w-[440px] shrink-0 items-center justify-center lg:flex">
            {/* Rectangle 3464206 (Blue background ornament) */}
            <div className="absolute top-[97px] left-0 z-0 h-[383px] w-[350px] [transform:matrix(1,0,-0.24,0.97,0,0)] rounded-[83px] bg-[#3A86F4] shadow-[0px_0px_100px_rgba(16,97,214,0.14)]" />
            {/* image 59 (Worker image) */}
            <ImageWithFallback
              className="absolute top-0 right-[120px] z-10 h-[470px] w-[376px] rounded-[167px_0px_93px_0px]"
              src="/assets/why_choose_us_worker.webp"
              alt="Tenaga Ahli Balai K3 Samarinda"
              imgClassName="object-cover"
            />
            {/* Rekapan kegiatan Pelatihan dan Pengujian (1) 2 (Float top-left blurred activity) */}
            <ImageWithFallback
              className="absolute top-[-4px] left-[3.5px] z-20 h-[110px] w-[110px] rounded-full blur-[2.2px]"
              src="/assets/in_house_training.webp"
              alt="Rekapan Kegiatan K3"
              imgClassName="object-cover"
            />
            {/* Rekapan kegiatan Pelatihan dan Pengujian (1) 1 (Float bottom-right blurred activity) */}
            <ImageWithFallback
              className="absolute top-[372px] left-[248px] z-20 h-[178px] w-[178px] rounded-full blur-[3.3px]"
              src="/assets/in_house_training.webp"
              alt="Rekapan Kegiatan K3"
              imgClassName="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Informasi Publik Section — Figma node 1986:12653 */}
      <section className="relative shrink-0 overflow-hidden bg-white py-20 dark:bg-neutral-950">
        {/* Background Ornament: Orange glow blur */}
        <div className="pointer-events-none absolute top-[50px] -right-[50px] z-0 h-[200px] w-[200px] rounded-full bg-[#F28D00] opacity-15 blur-[120px]" />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-10 px-6">
          {/* Section Header — Frame 1000007963 */}
          <div className="flex w-full max-w-[507px] flex-col items-center gap-5 text-center">
            <h2 className="font-poppins text-4xl font-semibold text-[#1061D6] md:text-5xl lg:text-[60px] lg:leading-[1.18]">
              Informasi Publik
            </h2>
            {/* Decorative Gradient Line */}
            <div className="h-3 w-full rounded-[2px] bg-gradient-to-r from-[#1061D6] via-[#78E275] to-white" />
          </div>

          {/* Description Text */}
          <p className="font-poppins max-w-4xl text-center text-base font-medium tracking-[0.005em] text-[#4D4D4D] md:text-lg lg:text-[24px] lg:leading-[1.4] dark:text-neutral-400">
            Informasi publik dikelompokkan berdasarkan jenisnya sesuai dengan
            ketentuan keterbukaan informasi, meliputi informasi berkala, serta
            merta, dan setiap saat.
          </p>

          {/* Grid Cards (CARD INFORMASI PUBLIK) */}
          <div className="mt-6 grid w-full grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Informasi Setiap Saat",
                textColorClass: "text-[#FF8DB7]",
                rectImage: "/assets/rect1.svg",
                image: "/assets/info_setiap_saat.webp",
                imgHeightClass: "h-[240px]",
                imgTopClass: "top-[-45px]",
                description:
                  "Informasi yang selalu tersedia dan dapat diakses kapan saja",
                to: "/ppid/setiap-saat",
              },
              {
                title: "Informasi Berkala",
                textColorClass: "text-[#3EA581]",
                rectImage: "/assets/rect2.svg",
                image: "/assets/info_berkala.webp",
                imgHeightClass: "h-[220px]",
                imgTopClass: "top-[-10px]",
                description:
                  "Informasi yang disampaikan rutin dalam periode tertentu",
                to: "/ppid/berkala",
              },
              {
                title: "Informasi Serta Merta",
                textColorClass: "text-[#FF770F]",
                rectImage: "/assets/rect3.svg",
                image: "/assets/info_serta_merta.webp",
                imgHeightClass: "h-[220px]",
                imgTopClass: "top-[-10px]",
                description:
                  "Informasi yang diumumkan segera saat kondisi darurat atau mendesak",
                to: "/ppid/serta-merta",
              },
              {
                title: "Informasi Dikecualikan",
                textColorClass: "text-[#E17A73]",
                rectImage: "/assets/rect4.svg",
                image: "/assets/info_dikecualikan.webp",
                imgHeightClass: "h-[220px]",
                imgTopClass: "top-[-13px]",
                description: "Informasi yang tidak bisa di akses oleh umum",
                to: "/ppid/dikecualikan",
              },
            ].map((card) => (
              <button
                key={card.title}
                type="button"
                onClick={() => navigate({ to: card.to })}
                className="group relative flex h-[320px] w-[250px] cursor-pointer flex-col items-center rounded-[32px] border-[4px] border-white bg-white text-center shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg dark:border-neutral-900 dark:bg-neutral-900"
              >
                {/* Background Rectangle Shape (Z-0) */}
                <div className="pointer-events-none absolute top-0 left-0 z-0 h-[170px] w-full">
                  <ImageWithFallback
                    src={card.rectImage}
                    alt=""
                    className="h-full w-full rounded-t-[26px]"
                    imgClassName="object-fill"
                  />
                </div>

                {/* 3D Illustration on Top Layer (Z-10) with Overflow Floating */}
                <div className="relative z-10 flex h-[170px] w-full items-center justify-center">
                  <ImageWithFallback
                    src={card.image}
                    alt={card.title}
                    className={`absolute w-auto transition-transform duration-300 group-hover:scale-105 ${card.imgHeightClass} ${card.imgTopClass}`}
                    imgClassName="object-contain"
                  />
                </div>

                {/* Card Text (Z-10) */}
                <div className="relative z-10 mt-4 flex w-full flex-col items-center justify-start px-4">
                  <h3
                    className={`font-poppins text-center text-[18px] leading-[1.5] font-semibold ${card.textColorClass}`}
                  >
                    {card.title}
                  </h3>
                  <p className="font-poppins mt-2 text-center text-[14px] leading-[1.5] font-normal text-[#4D4D4D] dark:text-neutral-400">
                    {card.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
      {/* ################## */}
      {/* end authored */}
      {/* ################## */}

      {/* ################## */}
      {/* authored (generated by gemini, Jun 13 2026 17:05 WITA) */}
      {/* ################## */}
      {/* Media dan Publikasi Section — Figma node 1986:14154 */}
      <section className="bg-white py-20 dark:bg-neutral-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-16 px-6 lg:px-8">
          {/* — Header Seksi — */}
          <div className="flex w-full max-w-[1000px] flex-col items-center gap-[30px] text-center">
            <div className="flex w-full max-w-[579px] flex-col items-center gap-5">
              <h2 className="font-poppins text-4xl font-semibold text-[#1061D6] md:text-5xl lg:text-[60px] lg:leading-[1.18]">
                Media dan Publikasi
              </h2>
              <div className="h-3 w-full rounded-[2px] bg-gradient-to-r from-[#1061D6] via-[#78E275] to-white" />
            </div>
            <p className="font-poppins max-w-4xl text-center text-base font-medium tracking-[0.005em] text-[#4D4D4D] md:text-lg lg:text-[24px] lg:leading-[1.4] dark:text-neutral-400">
              Berbagai berita, informasi kegiatan, dan dokumentasi Balai K3
              Samarinda disajikan secara terbuka dan mudah diakses oleh
              masyarakat.
            </p>
          </div>

          {/* — Konten: Carousel (kiri) + News Cards (kanan) — */}
          <div className="flex w-full flex-col items-center gap-10 lg:flex-row lg:items-start lg:gap-10">
            {/* Carousel Besar — 549×687px */}
            <div className="flex w-full shrink-0 flex-col items-center gap-4 lg:w-[549px]">
              <div className="relative h-[500px] w-full overflow-hidden rounded-[30px] bg-[#EBF1FF] lg:h-[687px]">
                {carouselSlides.map((slide, index) => (
                  <ImageWithFallback
                    key={slide.src}
                    src={slide.src}
                    alt={slide.alt}
                    className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${
                      index === currentSlide
                        ? isTransitioning
                          ? "opacity-0"
                          : "opacity-100"
                        : "opacity-0"
                    }`}
                    imgClassName="object-cover"
                  />
                ))}
              </div>
              {/* Dot Indicator */}
              <div className="flex gap-2">
                {carouselSlides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Slide ${index + 1}`}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? "w-6 bg-[#1061D6]"
                        : "w-2.5 bg-[#D9D9D9]"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 3 News Cards */}
            {isLoading ? (
              <div className="flex w-full min-w-0 flex-1 flex-col gap-[15px]">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex w-full flex-col overflow-hidden rounded-[20px] border border-[#E8F0FE] bg-white shadow-[0px_4px_24px_rgba(16,97,214,0.10)] dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <Skeleton className="h-[160px] w-full rounded-t-[10px]" />
                    <div className="flex flex-col gap-3 p-5">
                      <Skeleton className="h-6 w-3/4 rounded-md" />
                      <Skeleton className="h-4 w-full rounded-md" />
                      <Skeleton className="h-4 w-5/6 rounded-md" />
                      <div className="mt-2 flex items-center gap-1.5">
                        <Skeleton className="h-4 w-28 rounded-md" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !mediaData?.data || mediaData.data.length === 0 ? (
              <div className="flex w-full min-w-0 flex-1 flex-col items-center justify-center rounded-[20px] border border-[#E8F0FE] bg-white p-10 shadow-[0px_4px_24px_rgba(16,97,214,0.10)] dark:border-neutral-800 dark:bg-neutral-900">
                <p className="font-poppins text-sm text-neutral-500">
                  Belum ada media dan publikasi terbaru.
                </p>
              </div>
            ) : (
              <div className="flex w-full min-w-0 flex-1 flex-col gap-[15px]">
                {mediaData.data.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      navigate({
                        to: "/media-dan-publikasi/$newsId",
                        params: { newsId: item.id },
                      })
                    }
                    className="group flex w-full cursor-pointer flex-col overflow-hidden rounded-[20px] border border-[#E8F0FE] bg-white shadow-[0px_4px_24px_rgba(16,97,214,0.10)] transition-transform duration-200 hover:-translate-y-1 dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    {/* Thumbnail */}
                    <div className="h-[160px] w-full overflow-hidden rounded-t-[10px]">
                      <ImageWithFallback
                        src={getPublicUrl(item.imageUrl)}
                        alt={item.title}
                        className="h-full w-full overflow-hidden rounded-t-[10px] transition-transform duration-300 group-hover:scale-105"
                        imgClassName="object-cover"
                      />
                    </div>
                    {/* Konten Teks */}
                    <div className="flex flex-col gap-3 p-5">
                      <h3 className="font-poppins line-clamp-2 text-left text-base font-semibold text-[#1061D6] lg:text-lg">
                        {item.title}
                      </h3>
                      <p className="font-poppins line-clamp-2 text-left text-sm leading-relaxed text-[#4D4D4D] dark:text-neutral-400">
                        {item.description ?? ""}
                      </p>
                      {/* CTA */}
                      <div className="flex items-center gap-1.5 text-[#1061D6]">
                        <span className="font-poppins text-sm font-semibold">
                          Baca selengkapnya
                        </span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* — Tombol Lihat Semua — */}
          <div className="flex w-full justify-end">
            <button
              type="button"
              onClick={() => navigate({ to: "/media-dan-publikasi" as any })}
              className="font-poppins flex items-center gap-2 rounded-xl border-2 border-[#AFCFFA] bg-[#1061D6] px-6 py-2.5 text-sm font-semibold text-white shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] transition-all hover:-translate-y-0.5 hover:bg-[#0d52b8]"
            >
              Lihat semua
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* — Kontak Kami Section — Figma node 1986:14201 */}
      <section className="bg-white py-20 dark:bg-neutral-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-16 px-6 lg:px-8">
          {/* — Header Seksi — */}
          <div className="flex w-full max-w-[1000px] flex-col items-center gap-6 text-center">
            <div className="flex flex-col items-center gap-5">
              <h2 className="font-poppins text-4xl font-semibold text-[#1061D6] md:text-5xl lg:text-[60px] lg:leading-[1.18]">
                Kontak Kami
              </h2>
              <div className="h-3 w-[386px] max-w-full rounded-[2px] bg-gradient-to-r from-[#1061D6] via-[#78E275] to-white" />
            </div>
            <p className="font-poppins max-w-4xl text-center text-base font-medium tracking-[0.005em] text-[#4D4D4D] md:text-lg lg:text-2xl lg:leading-[1.4] dark:text-neutral-400">
              Hubungi kami untuk informasi lebih lanjut terkait layanan Balai K3
              Samarinda.
            </p>
          </div>

          {/* — Grid Kartu Kontak — */}
          <div className="grid w-full grid-cols-1 justify-items-center gap-5 md:grid-cols-2">
            {/* Kartu Telepon */}
            <div className="relative flex min-h-[180px] w-full max-w-[638px] items-center overflow-hidden rounded-[20px] bg-[#1061D6] py-6 pr-6 pl-[44px] text-white shadow-[0px_4px_24px_rgba(16,97,214,0.10)] transition-all duration-300 hover:-translate-y-1">
              {/* Ornamen Ellipse Figma */}
              <div className="pointer-events-none absolute top-[28px] left-[285px] h-[448px] w-[602px] rounded-full bg-[rgba(255,255,255,0.07)]" />
              <div className="pointer-events-none absolute top-[45px] left-[296px] h-[448px] w-[602px] rounded-full bg-[rgba(255,255,255,0.10)]" />

              <div className="relative z-10 flex items-center gap-[30px]">
                <ImageWithFallback
                  src="/assets/icon_calling_bold.svg"
                  alt="Telepon"
                  className="h-[50px] w-[50px] shrink-0"
                  imgClassName="object-contain"
                />
                <div className="flex flex-col text-left">
                  <h3 className="font-poppins text-[28px] leading-[1.4] font-semibold text-white">
                    Nomor Telepon
                  </h3>
                  <a
                    href="tel:0541771306"
                    className="font-poppins text-[24px] leading-[1.4] font-normal text-white underline transition-opacity hover:opacity-85"
                  >
                    (0541) 771306
                  </a>
                </div>
              </div>
            </div>

            {/* Kartu E-mail */}
            <div className="relative flex min-h-[180px] w-full max-w-[638px] items-center overflow-hidden rounded-[20px] bg-[#1061D6] py-6 pr-6 pl-[44px] text-white shadow-[0px_4px_24px_rgba(16,97,214,0.10)] transition-all duration-300 hover:-translate-y-1">
              {/* Ornamen Ellipse Figma */}
              <div className="pointer-events-none absolute top-[28px] left-[285px] h-[448px] w-[602px] rounded-full bg-[rgba(255,255,255,0.07)]" />
              <div className="pointer-events-none absolute top-[45px] left-[296px] h-[448px] w-[602px] rounded-full bg-[rgba(255,255,255,0.10)]" />

              <div className="relative z-10 flex items-center gap-[30px]">
                <ImageWithFallback
                  src="/assets/icon_message_bold.svg"
                  alt="Email"
                  className="h-[50px] w-[50px] shrink-0"
                  imgClassName="object-contain"
                />
                <div className="flex flex-col text-left">
                  <h3 className="font-poppins text-[28px] leading-[1.4] font-medium text-white">
                    E-mail
                  </h3>
                  <a
                    href="mailto:balaik3samarinda@gmail.com"
                    className="font-poppins text-[24px] leading-[1.4] font-normal break-all text-white transition-opacity hover:opacity-85"
                  >
                    balaik3samarinda@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Kartu Alamat */}
            <div className="relative flex min-h-[180px] w-full max-w-[638px] items-center overflow-hidden rounded-[20px] bg-[#1061D6] py-6 pr-6 pl-[44px] text-white shadow-[0px_4px_24px_rgba(16,97,214,0.10)] transition-all duration-300 hover:-translate-y-1">
              {/* Ornamen Ellipse Figma */}
              <div className="pointer-events-none absolute top-[28px] left-[285px] h-[448px] w-[602px] rounded-full bg-[rgba(255,255,255,0.07)]" />
              <div className="pointer-events-none absolute top-[45px] left-[296px] h-[448px] w-[602px] rounded-full bg-[rgba(255,255,255,0.10)]" />

              <div className="relative z-10 flex items-center gap-[30px]">
                <ImageWithFallback
                  src="/assets/icon_location_bold.svg"
                  alt="Alamat"
                  className="h-[50px] w-[50px] shrink-0"
                  imgClassName="object-contain"
                />
                <div className="flex flex-col text-left">
                  <h3 className="font-poppins text-[28px] leading-[1.4] font-semibold text-white">
                    Alamat
                  </h3>
                  <p className="font-poppins text-[24px] leading-[1.4] font-normal text-white">
                    Jl. Sentosa No.9, Sungai Pinang Dalam, Kec. Sungai Pinang,
                    Kota Samarinda, Kalimantan Timur 75242
                  </p>
                </div>
              </div>
            </div>

            {/* Kartu Jam Operasional */}
            <div className="relative flex min-h-[180px] w-full max-w-[638px] items-center overflow-hidden rounded-[20px] bg-[#1061D6] py-6 pr-6 pl-[44px] text-white shadow-[0px_4px_24px_rgba(16,97,214,0.10)] transition-all duration-300 hover:-translate-y-1">
              {/* Ornamen Ellipse Figma */}
              <div className="pointer-events-none absolute top-[28px] left-[285px] h-[448px] w-[602px] rounded-full bg-[rgba(255,255,255,0.07)]" />
              <div className="pointer-events-none absolute top-[45px] left-[296px] h-[448px] w-[602px] rounded-full bg-[rgba(255,255,255,0.10)]" />

              <div className="relative z-10 flex items-center gap-[30px]">
                <ImageWithFallback
                  src="/assets/icon_time_circle_bold.svg"
                  alt="Jam Operasional"
                  className="h-[50px] w-[50px] shrink-0"
                  imgClassName="object-contain"
                />
                <div className="flex flex-col text-left">
                  <h3 className="font-poppins text-[28px] leading-[1.4] font-medium text-white">
                    Jam Operasional
                  </h3>
                  <p className="font-poppins text-[24px] leading-[1.4] font-normal whitespace-pre-line text-white">
                    Senin - Kamis : 07.30 - 16.00 WITA{"\n"}Jum’at : 07.30 -
                    16.30 WITA
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* — Google Maps Iframe — */}
          <div className="w-full overflow-hidden rounded-[20px] shadow-[0px_4px_24px_rgba(16,97,214,0.10)]">
            <iframe
              title="Peta Lokasi Balai K3 Samarinda"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.680519202917!2d117.16388136148453!3d-0.4761992704406858!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2df67f571a019dc3%3A0xeb5741f440333753!2sBalai%20K3%20Samarinda!5e0!3m2!1sen!2sid!4v1781344359707!5m2!1sen!2sid"
              width="100%"
              height="552"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[350px] w-full md:h-[552px]"
            />
          </div>

          {/* — Seksi Ikuti Kami (Media Sosial) — */}
          <div className="flex w-full flex-col items-center gap-4">
            <p className="font-poppins text-center text-base font-medium text-[#4D4D4D] md:text-lg lg:text-2xl dark:text-neutral-400">
              Ikuti media sosial kami untuk informasi terbaru.
            </p>
            <div className="h-[1px] w-full max-w-[699px] bg-[#AFCFFA]" />
            <div className="flex items-center gap-3">
              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center transition-transform hover:scale-110"
              >
                <ImageWithFallback
                  src="/assets/logo_sosmed_1.svg"
                  alt="Instagram"
                  className="h-[35px] w-[35px] shrink-0 rounded-full"
                  imgClassName="object-contain"
                />
              </a>
              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center transition-transform hover:scale-110"
              >
                <ImageWithFallback
                  src="/assets/logo_sosmed_2.svg"
                  alt="YouTube"
                  className="h-[35px] w-[35px] shrink-0 rounded-full"
                  imgClassName="object-contain"
                />
              </a>
              {/* TikTok */}
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center transition-transform hover:scale-110"
              >
                <ImageWithFallback
                  src="/assets/logo_sosmed_3.svg"
                  alt="TikTok"
                  className="h-[35px] w-[35px] shrink-0 rounded-full"
                  imgClassName="object-contain"
                />
              </a>
              {/* Twitter / X */}
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center transition-transform hover:scale-110"
              >
                <ImageWithFallback
                  src="/assets/logo_sosmed_4.svg"
                  alt="Twitter/X"
                  className="h-[35px] w-[35px] shrink-0 rounded-full"
                  imgClassName="object-contain"
                />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// ##################
// end authored
// ##################
