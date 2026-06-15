import { useState } from "react";
import LandingNavbar from "@/components/navbar";
import Footer from "@/components/footer";
import ImageWithFallback from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { pageHead } from "@/utils/page-head";
import {
  Workflow,
  GraduationCap,
  Info,
  Scale,
  ExternalLink,
  Download,
  FileSpreadsheet,
} from "lucide-react";

export const Route = createFileRoute("/ppid/setiap-saat/")({
  component: PPIDSetiapSaatIndex,
  head: () => pageHead("Informasi Setiap Saat - PPID Balai K3 Samarinda"),
});

/**
 * Halaman Portal Informasi Setiap Saat PPID.
 * Menampilkan daftar informasi publik yang wajib tersedia setiap saat
 * dalam format kartu interaktif (Accordion) premium yang mencakup alur pelayanan,
 * prosedur permohonan informasi, daftar regulasi, dan data statistik layanan.
 *
 * @returns {JSX.Element} Halaman portal Informasi Setiap Saat.
 */
function PPIDSetiapSaatIndex() {
  const navigate = useNavigate();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

  const provinces = [
    {
      id: "kaltim",
      name: "Kalimantan Timur",
      shortName: "Kaltim",
      count: 64,
      dots: "...............................",
      badgeLeft: 332,
      badgeTop: 146,
    },
    {
      id: "kalsel",
      name: "Kalimantan Selatan",
      shortName: "Kalsel",
      count: 42,
      dots: "......................",
      badgeLeft: 291,
      badgeTop: 311,
    },
    {
      id: "kaltara",
      name: "Kalimantan Utara",
      shortName: "Kaltara",
      count: 34,
      dots: ".................................",
      badgeLeft: 296,
      badgeTop: 0,
    },
    {
      id: "kalteng",
      name: "Kalimantan Tengah",
      shortName: "Kalteng",
      count: 23,
      dots: "........................",
      badgeLeft: 163,
      badgeTop: 236,
    },
    {
      id: "kalbar",
      name: "Kalimantan Barat",
      shortName: "Kalbar",
      count: 14,
      dots: "...................................",
      badgeLeft: 47,
      badgeTop: 168,
    },
  ];

  const toggleAccordion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const categories = [
    {
      title: "Alur Pelayanan Pengujian K3",
      icon: Workflow,
      type: "image",
      src: "/assets/alur_pelayanan_pengujian_k3.webp",
      description:
        "Grafik alur pelayanan teknis pengujian K3 dari pendaftaran hingga hasil uji selesai.",
    },
    {
      title: "Alur Pelayanan Pelatihan",
      icon: GraduationCap,
      type: "image",
      src: "/assets/alur_pelayanan_pelatihan.webp",
      description:
        "Diagram proses administrasi pendaftaran, pelaksanaan, hingga sertifikasi pelatihan K3.",
    },
    {
      title: "Prosedur Permohonan Informasi",
      icon: Info,
      type: "image",
      src: "/assets/prosedur_permohonan_informasi.webp",
      description:
        "Bagan langkah-langkah bagi publik untuk mengajukan permohonan informasi resmi ke PPID.",
    },
    {
      title: "Layanan Tarif Pengujian (PNBP)",
      icon: FileSpreadsheet,
      type: "images_list",
      srcs: [
        "/assets/layanan_tarif_pengujian_1.webp",
        "/assets/layanan_tarif_pengujian_2.webp",
      ],
      description:
        "Daftar rincian tarif biaya pengujian keselamatan dan kesehatan kerja berdasarkan regulasi PNBP.",
    },
    {
      title: "Regulasi K3 & Layanan Publik",
      icon: Scale,
      type: "regulations_table",
      description:
        "Daftar undang-undang dan keputusan resmi yang melandasi keselamatan kerja dan standar pelayanan publik.",
    },
    {
      title: "Data Statistik Layanan Publik",
      icon: BarChart3Icon,
      type: "statistics_dashboard",
      description:
        "Rangkuman data jumlah pengujian, pelatihan, uji kompetensi, dan peta sebaran perusahaan di wilayah kerja.",
    },
  ];

  const regulations = [
    {
      no: 1,
      title: "Undang-Undang Nomor 1 Tahun 1970 tentang Keselamatan Kerja",
    },
    {
      no: 2,
      title: "Undang-Undang Nomor 13 Tahun 2003 tentang Ketenagakerjaan",
    },
    {
      no: 3,
      title:
        "Peraturan Pemerintah Nomor 50 Tahun 2012 tentang Penerapan Sistem Manajemen Keselamatan dan Kesehatan Kerja (SMK3)",
    },
    {
      no: 4,
      title:
        "Peraturan Menteri Ketenagakerjaan Nomor 5 Tahun 2018 tentang Keselamatan dan Kesehatan Kerja Lingkungan Kerja",
    },
  ];

  const sebaranPerusahaan = [
    { provinsi: "Kalimantan Timur", jumlah: 64 },
    { provinsi: "Kalimantan Selatan", jumlah: 42 },
    { provinsi: "Kalimantan Utara", jumlah: 34 },
    { provinsi: "Kalimantan Tengah", jumlah: 23 },
    { provinsi: "Kalimantan Barat", jumlah: 14 },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden overflow-y-auto bg-white dark:bg-neutral-950">
      <LandingNavbar />

      {/* Title Section (Figma: INFORMASI PUBLIK) */}
      <section className="container mx-auto flex max-w-[1000px] flex-col items-center justify-center px-4 pt-12 pb-8 text-center">
        {/* Figma: Frame 31 (Badge) */}
        <div className="inline-flex items-center justify-start gap-2.5">
          <div data-svg-wrapper>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                width="14"
                height="14"
                fill="url(#paint0_linear_1986_17673)"
              />
              <defs>
                <linearGradient
                  id="paint0_linear_1986_17673"
                  x1="0"
                  y1="7"
                  x2="14"
                  y2="7"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stop-color="#1061D6" />
                  <stop offset="1" stop-color="#78E275" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="font-poppins justify-start text-xl leading-6 font-semibold text-[#1061D6] dark:text-blue-400">
            Informasi Publik
          </div>
        </div>

        {/* Figma: INFORMASI SETIAP SAAT (Header Title) */}
        <div className="relative mt-5 inline-block text-center">
          <h1 className="font-poppins text-[36px] leading-[118%] font-semibold text-[#1061D6] md:text-[60px] dark:text-blue-400">
            Informasi Setiap Saat
          </h1>
          {/* Underline Decoration - Figma: Frame 32 */}
          <div className="mx-auto mt-4 h-[12px] w-full max-w-[617px] rounded-full bg-[linear-gradient(90deg,#1061D6_34%,#78E275_58%,transparent_98%)]" />
        </div>

        {/* Figma: Description */}
        <p className="font-poppins mt-6 max-w-[1000px] text-lg leading-[150%] font-medium text-neutral-600 sm:text-xl md:text-[24px] dark:text-neutral-300">
          Informasi yang wajib tersedia setiap saat dan dapat diakses oleh
          masyarakat melalui permohonan informasi sesuai dengan ketentuan yang
          berlaku.
        </p>
      </section>

      {/* Accordion Cards Section (Figma: COMPONENT INFORMASI SETIAP SAAT) */}
      <main className="container mx-auto max-w-[1232px] px-4 pb-20">
        <div className="space-y-4">
          {categories.map((cat, idx) => {
            const IconComponent = cat.icon;
            const isExpanded = expandedIndex === idx;

            return (
              <div
                key={idx}
                className="overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
              >
                {/* Header Row */}
                <button
                  onClick={() => toggleAccordion(idx)}
                  className="flex h-32 w-full flex-col items-start justify-center gap-2.5 rounded-[30px] bg-white px-8 py-8 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1061D6] md:px-16 dark:bg-neutral-900"
                >
                  <div className="inline-flex w-full max-w-[1104px] items-center justify-between gap-4">
                    <div className="font-poppins justify-start text-xl leading-8 font-semibold tracking-tight text-[#1061D6] md:text-2xl dark:text-blue-400">
                      {cat.title}
                    </div>
                    <div className="relative h-[60px] w-[60px] shrink-0">
                      <svg
                        width="60"
                        height="60"
                        viewBox="0 0 60 60"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute inset-0"
                      >
                        <rect width="60" height="60" rx="30" fill="#1061D6" />
                      </svg>
                      <svg
                        width="35"
                        height="35"
                        viewBox="0 0 35 35"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={`absolute top-[12.5px] left-[12.5px] transition-transform duration-300 ${isExpanded ? "rotate-45" : ""}`}
                      >
                        <path
                          d="M10.208 24.7891L24.7913 10.2057M24.7913 24.7891L24.7913 10.2057L10.208 10.2057"
                          stroke="white"
                          strokeWidth="2.91667"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Expanded Panel Content */}
                {isExpanded && (
                  <div className="animate-in border-t border-slate-100 bg-slate-50/30 px-8 py-8 duration-300 fade-in slide-in-from-top-2 md:px-12 md:py-10 dark:border-neutral-800 dark:bg-neutral-900/10">
                    {/* Render Image Type (flowcharts) */}
                    {cat.type === "image" && cat.src && (
                      <div className="flex flex-col items-center gap-6">
                        <div className="group relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-2 shadow-sm sm:p-4 dark:border-neutral-800 dark:bg-neutral-950">
                          <ImageWithFallback
                            src={cat.src}
                            alt={cat.title}
                            className="h-auto max-h-[800px] w-full rounded-xl"
                            imgClassName="object-contain"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <a
                            href={cat.src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700/80"
                          >
                            <ExternalLink className="size-4" />
                            Buka Ukuran Penuh
                          </a>
                          <a
                            href={cat.src}
                            download
                            className="inline-flex items-center gap-2 rounded-full bg-[#1061D6] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                          >
                            <Download className="size-4" />
                            Unduh Gambar
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Render PNBP Multiple Images Stack */}
                    {cat.type === "images_list" && cat.srcs && (
                      <div className="flex flex-col items-center gap-10">
                        <div className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
                          {cat.srcs.map((srcPath, idxImg) => (
                            <div
                              key={idxImg}
                              className="flex flex-col items-center gap-4"
                            >
                              <div className="group relative w-full overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-2 shadow-sm sm:p-4 dark:border-neutral-800 dark:bg-neutral-950">
                                <ImageWithFallback
                                  src={srcPath}
                                  alt={`${cat.title} Part ${idxImg + 1}`}
                                  className="h-auto max-h-[500px] w-full rounded-xl"
                                  imgClassName="object-contain"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <a
                                  href={srcPath}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-600 shadow-xs transition-colors hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                                >
                                  <ExternalLink className="size-3.5" />
                                  Buka
                                </a>
                                <a
                                  href={srcPath}
                                  download
                                  className="inline-flex items-center gap-1.5 rounded-full bg-[#1061D6] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700"
                                >
                                  <Download className="size-3.5" />
                                  Unduh
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Render Regulations Table */}
                    {cat.type === "regulations_table" && (
                      <div className="mx-auto w-full max-w-4xl space-y-8">
                        <div className="overflow-hidden rounded-[20px] border border-slate-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                          <table className="w-full border-collapse text-left">
                            <thead>
                              <tr className="font-poppins bg-[#1061D6] text-xs font-semibold text-white sm:text-base">
                                <th className="w-16 px-4 py-4 text-center sm:px-6">
                                  NO
                                </th>
                                <th className="px-4 py-4 sm:px-6">
                                  JUDUL DOKUMEN REGULASI
                                </th>
                                <th className="w-24 px-4 py-4 text-center sm:px-6">
                                  TAMPILKAN
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {regulations.map((reg) => (
                                <tr
                                  key={reg.no}
                                  className="border-b border-slate-100 text-xs text-slate-800 transition-colors hover:bg-slate-50/50 sm:text-lg dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-900/30"
                                >
                                  <td className="px-4 py-4 text-center font-semibold text-neutral-400 sm:px-6 dark:text-neutral-500">
                                    {reg.no}.
                                  </td>
                                  <td className="font-poppins px-4 py-4 text-neutral-700 sm:px-6 dark:text-neutral-300">
                                    {reg.title}
                                  </td>
                                  <td className="px-4 py-4 text-center sm:px-6">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        navigate({
                                          to: "/ppid/setiap-saat/regulasi",
                                          search: () => ({ search: reg.title }),
                                        })
                                      }
                                      className="rounded-full border-[#1061D6] font-bold text-[#1061D6] hover:bg-[#1061D6]/5 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/20"
                                    >
                                      Lihat
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex justify-center pt-2">
                          <Button
                            variant="outline"
                            onClick={() =>
                              navigate({ to: "/ppid/setiap-saat/regulasi" })
                            }
                            className="font-poppins rounded-[30px] border-[#1061D6] px-8 py-6 text-base font-semibold text-[#1061D6] shadow-sm transition-all hover:bg-[#1061D6]/10 sm:text-lg dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/30"
                          >
                            Lihat Data Selengkapnya
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Render Statistics Dashboard */}
                    {cat.type === "statistics_dashboard" && (
                      <div className="w-full space-y-10">
                        {/* Stats Cards Row - Figma aligned */}
                        <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-8 py-4">
                          {/* Card 1: Pengujian */}
                          <div className="relative h-96 w-80 shrink-0">
                            <div className="absolute top-0 left-0 h-96 w-80 rounded-[20px] bg-white shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] dark:bg-neutral-900" />
                            <div className="absolute top-[241px] w-full justify-center text-center font-['Poppins'] text-lg leading-7 font-semibold tracking-tight text-[#1061D6] dark:text-blue-400">
                              Pengujian
                            </div>
                            <div className="absolute top-[178px] w-full justify-center text-center font-['Poppins'] text-5xl leading-[65px] font-bold tracking-tight text-[#1061D6] dark:text-blue-400">
                              540
                            </div>
                            <div className="absolute top-[286px] left-[20px] h-[1px] w-[280px] bg-blue-600/20 dark:bg-blue-500/20" />
                            <div className="from 57% absolute top-0 left-0 h-40 w-80 rounded-tl-[20px] rounded-tr-[20px] bg-linear-56 from-sky-500/80 to-blue-600/80 shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)]" />
                            <div className="absolute top-[339px] left-[142px] justify-start font-['Poppins'] text-sm leading-5 font-semibold tracking-tight text-[#1061D6] dark:text-blue-400">
                              Perusahaan
                              <br />
                              Dilayani
                            </div>
                            <div className="absolute top-[299px] left-[142px] justify-start font-['Poppins'] text-3xl leading-10 font-bold tracking-tight text-[#1061D6] dark:text-blue-400">
                              182
                            </div>
                            <div className="absolute top-[308px] left-[43px] inline-flex size-16 items-start justify-start gap-2.5 rounded-[32.50px] bg-slate-50 p-2.5 dark:bg-neutral-800">
                              <div data-svg-wrapper className="relative">
                                <svg
                                  width="45"
                                  height="45"
                                  viewBox="0 0 45 45"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M24.375 20.625H33.375C35.4752 20.625 36.5253 20.625 37.3275 21.0337C38.0331 21.3933 38.6067 21.9669 38.9663 22.6725C39.375 23.4747 39.375 24.5248 39.375 26.625V39.375M24.375 39.375V11.625C24.375 9.5248 24.375 8.4747 23.9663 7.67254C23.6067 6.96693 23.0331 6.39325 22.3275 6.03373C21.5253 5.625 20.4752 5.625 18.375 5.625H11.625C9.5248 5.625 8.4747 5.625 7.67254 6.03373C6.96693 6.39325 6.39325 6.96693 6.03373 7.67254C5.625 8.4747 5.625 9.5248 5.625 11.625V39.375M41.25 39.375H3.75M12.1875 13.125H17.8125M12.1875 20.625H17.8125M12.1875 28.125H17.8125"
                                    stroke="url(#paint0_linear_pengujian)"
                                    strokeWidth="5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <defs>
                                    <linearGradient
                                      id="paint0_linear_pengujian"
                                      x1="4.74609"
                                      y1="3.69141"
                                      x2="26.3426"
                                      y2="42.3358"
                                      gradientUnits="userSpaceOnUse"
                                    >
                                      <stop
                                        offset="0.567308"
                                        stop-color="#169AF9"
                                      />
                                      <stop offset="1" stop-color="#0C74EA" />
                                    </linearGradient>
                                  </defs>
                                </svg>
                              </div>
                            </div>
                            <div className="absolute top-[111px] w-full justify-center text-center font-['Poppins'] text-xl leading-8 font-semibold tracking-tight text-slate-50">
                              Layanan Pengujian
                            </div>
                            <ImageWithFallback
                              className="absolute top-[25px] left-1/2 h-20 w-28 -translate-x-1/2"
                              src="/assets/layanan_pengujian_thumb.webp"
                              alt="Layanan Pengujian"
                              imgClassName="object-contain"
                            />
                          </div>

                          {/* Card 2: Pelatihan */}
                          <div className="relative h-96 w-80 shrink-0">
                            <div className="absolute top-0 left-0 h-96 w-80 rounded-[20px] bg-white shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] dark:bg-neutral-900" />
                            <div className="absolute top-[241px] w-full justify-center text-center font-['Poppins'] text-lg leading-7 font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
                              Pelatihan
                            </div>
                            <div className="absolute top-[178px] w-full justify-center text-center font-['Poppins'] text-5xl leading-[65px] font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                              20
                            </div>
                            <div className="absolute top-[286px] left-[20px] h-[1px] w-[280px] bg-emerald-600/20 dark:bg-emerald-500/20" />
                            <div className="from 57% absolute top-0 left-0 h-40 w-80 rounded-tl-[20px] rounded-tr-[20px] bg-linear-56 from-emerald-500/80 to-teal-600/80 shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)]" />
                            <div className="absolute top-[339px] left-[142px] justify-start font-['Poppins'] text-sm leading-5 font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
                              Peserta
                              <br />
                              Pelatihan
                            </div>
                            <div className="absolute top-[299px] left-[142px] justify-start font-['Poppins'] text-3xl leading-10 font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                              4.500
                            </div>
                            <div className="absolute top-[308px] left-[43px] inline-flex size-16 items-start justify-start gap-2.5 rounded-[32.50px] bg-slate-50 p-2.5 dark:bg-neutral-800">
                              <div data-svg-wrapper className="relative">
                                <svg
                                  width="45"
                                  height="45"
                                  viewBox="0 0 45 45"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M16.2199 19.4402C14.5979 17.8271 13.5938 15.5933 13.5938 13.125C13.5938 10.6567 14.5979 8.42286 16.2199 6.80977C15.2861 6.35124 14.2356 6.09375 13.125 6.09375C9.24175 6.09375 6.09375 9.24175 6.09375 13.125C6.09375 17.0083 9.24175 20.1562 13.125 20.1562C14.2356 20.1562 15.2861 19.8988 16.2199 19.4402Z"
                                    fill="url(#paint0_linear_pelatihan_icon)"
                                  />
                                  <path
                                    d="M15.4688 13.125C15.4688 9.24175 18.6168 6.09375 22.5 6.09375C26.3833 6.09375 29.5313 9.24175 29.5313 13.125C29.5313 17.0083 26.3833 20.1562 22.5 20.1562C18.6168 20.1562 15.4688 17.0083 15.4688 13.125Z"
                                    fill="url(#paint1_linear_pelatihan_icon)"
                                  />
                                  <path
                                    d="M28.7801 6.80977C30.4021 8.42286 31.4063 10.6567 31.4063 13.125C31.4063 15.5933 30.4021 17.8271 28.7801 19.4402C29.7139 19.8988 30.7644 20.1562 31.875 20.1562C35.7583 20.1562 38.9063 17.0083 38.9063 13.125C38.9063 9.24175 35.7583 6.09375 31.875 6.09375C30.7644 6.09375 29.7139 6.35124 28.7801 6.80977Z"
                                    fill="url(#paint2_linear_pelatihan_icon)"
                                  />
                                  <path
                                    d="M9.84375 30C9.84375 26.1167 12.9918 22.9688 16.875 22.9688H28.125C32.0083 22.9688 35.1563 26.1167 35.1563 30C35.1563 33.8833 32.0083 37.0312 28.125 37.0312H16.875C12.9918 37.0312 9.84375 33.8833 9.84375 30Z"
                                    fill="url(#paint3_linear_pelatihan_icon)"
                                  />
                                  <path
                                    d="M0.46875 28.125C0.46875 24.2417 3.61675 21.0938 7.5 21.0938H16.875C11.9562 21.0938 7.96875 25.0812 7.96875 30C7.96875 31.9216 8.57734 33.7011 9.61229 35.1562H7.5C3.61675 35.1562 0.46875 32.0083 0.46875 28.125Z"
                                    fill="url(#paint4_linear_pelatihan_icon)"
                                  />
                                  <path
                                    d="M37.0313 30C37.0313 31.9216 36.4227 33.7011 35.3877 35.1562H37.5C41.3833 35.1562 44.5313 32.0083 44.5313 28.125C44.5313 24.2417 41.3833 21.0938 37.5 21.0938H28.125C33.0438 21.0938 37.0313 25.0812 37.0313 30Z"
                                    fill="url(#paint5_linear_pelatihan_icon)"
                                  />
                                  <defs>
                                    <linearGradient
                                      id="paint0_linear_pelatihan_icon"
                                      x1="-5.65869"
                                      y1="21.5625"
                                      x2="16.8837"
                                      y2="40.0825"
                                      gradientUnits="userSpaceOnUse"
                                    >
                                      <stop stop-color="#10B981" />
                                      <stop offset="1" stop-color="#059669" />
                                    </linearGradient>
                                    <linearGradient
                                      id="paint1_linear_pelatihan_icon"
                                      x1="-5.65869"
                                      y1="21.5625"
                                      x2="16.8837"
                                      y2="40.0825"
                                      gradientUnits="userSpaceOnUse"
                                    >
                                      <stop stop-color="#10B981" />
                                      <stop offset="1" stop-color="#059669" />
                                    </linearGradient>
                                    <linearGradient
                                      id="paint2_linear_pelatihan_icon"
                                      x1="-5.65869"
                                      y1="21.5625"
                                      x2="16.8837"
                                      y2="40.0825"
                                      gradientUnits="userSpaceOnUse"
                                    >
                                      <stop stop-color="#10B981" />
                                      <stop offset="1" stop-color="#059669" />
                                    </linearGradient>
                                    <linearGradient
                                      id="paint3_linear_pelatihan_icon"
                                      x1="-5.65869"
                                      y1="21.5625"
                                      x2="16.8837"
                                      y2="40.0825"
                                      gradientUnits="userSpaceOnUse"
                                    >
                                      <stop stop-color="#10B981" />
                                      <stop offset="1" stop-color="#059669" />
                                    </linearGradient>
                                    <linearGradient
                                      id="paint4_linear_pelatihan_icon"
                                      x1="-5.65869"
                                      y1="21.5625"
                                      x2="16.8837"
                                      y2="40.0825"
                                      gradientUnits="userSpaceOnUse"
                                    >
                                      <stop stop-color="#10B981" />
                                      <stop offset="1" stop-color="#059669" />
                                    </linearGradient>
                                    <linearGradient
                                      id="paint5_linear_pelatihan_icon"
                                      x1="-5.65869"
                                      y1="21.5625"
                                      x2="16.8837"
                                      y2="40.0825"
                                      gradientUnits="userSpaceOnUse"
                                    >
                                      <stop stop-color="#10B981" />
                                      <stop offset="1" stop-color="#059669" />
                                    </linearGradient>
                                  </defs>
                                </svg>
                              </div>
                            </div>
                            <div className="absolute top-[111px] w-full justify-center text-center font-['Poppins'] text-xl leading-8 font-semibold tracking-tight text-slate-50">
                              Layanan Pelatihan
                            </div>
                            <ImageWithFallback
                              className="absolute top-[25px] left-1/2 h-20 w-28 -translate-x-1/2"
                              src="/assets/layanan_pelatihan_thumb.webp"
                              alt="Layanan Pelatihan"
                              imgClassName="object-contain"
                            />
                          </div>

                          {/* Card 3: Uji Kompetensi */}
                          <div className="relative h-96 w-80 shrink-0">
                            <div className="absolute top-0 left-0 h-96 w-80 rounded-[20px] bg-white shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] dark:bg-neutral-900" />
                            <div className="absolute top-[241px] w-full justify-center text-center font-['Poppins'] text-lg leading-7 font-semibold tracking-tight text-purple-600 dark:text-purple-400">
                              Uji Kompetensi
                            </div>
                            <div className="absolute top-[178px] w-full justify-center text-center font-['Poppins'] text-5xl leading-[65px] font-bold tracking-tight text-purple-600 dark:text-purple-400">
                              2
                            </div>
                            <div className="absolute top-[286px] left-[20px] h-[1px] w-[280px] bg-purple-600/20 dark:bg-purple-500/20" />
                            <div className="from 57% absolute top-0 left-0 h-40 w-80 rounded-tl-[20px] rounded-tr-[20px] bg-linear-56 from-fuchsia-500/80 to-purple-600/80 shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)]" />
                            <div className="absolute top-[339px] left-[142px] justify-start font-['Poppins'] text-sm leading-5 font-semibold tracking-tight text-purple-600 dark:text-purple-400">
                              Peserta Uji
                              <br />
                              Kompetensi
                            </div>
                            <div className="absolute top-[299px] left-[142px] justify-start font-['Poppins'] text-3xl leading-10 font-bold tracking-tight text-purple-600 dark:text-purple-400">
                              30
                            </div>
                            <div className="absolute top-[308px] left-[43px] inline-flex size-16 items-start justify-start gap-2.5 rounded-[32.50px] bg-slate-50 p-2.5 dark:bg-neutral-800">
                              <div data-svg-wrapper className="relative">
                                <svg
                                  width="45"
                                  height="45"
                                  viewBox="0 0 45 45"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M23.6145 9.76536C23.2542 8.61988 21.7453 8.61988 21.385 9.76536C20.8626 11.4262 19.3452 12.5931 17.5873 12.5931C17.0434 12.5931 16.6376 12.9276 16.4725 13.4522C16.3065 13.98 16.4421 14.5346 16.9134 14.8882C18.3072 15.9343 18.8692 17.7636 18.3489 19.4176C18.1568 20.0283 18.3867 20.5512 18.7898 20.8537C19.1862 21.1512 19.6827 21.195 20.1376 20.8537C21.5429 19.799 23.4565 19.799 24.8619 20.8537C25.3167 21.195 25.8132 21.1512 26.2097 20.8537C26.6127 20.5512 26.8426 20.0283 26.6505 19.4176C26.1303 17.7636 26.6923 15.9343 28.0861 14.8882C28.5573 14.5346 28.6929 13.98 28.5269 13.4522C28.3619 12.9276 27.956 12.5931 27.4122 12.5931C25.6543 12.5931 24.1369 11.4262 23.6145 9.76536Z"
                                    fill="url(#paint0_linear_ukom_icon)"
                                  />
                                  <path
                                    fill-rule="evenodd"
                                    clip-rule="evenodd"
                                    d="M6.09347 16.875C6.09347 7.81408 13.4388 0.46875 22.4997 0.46875C31.5606 0.46875 38.906 7.81408 38.906 16.875C38.906 17.6757 38.8485 18.4634 38.7375 19.234C38.5 19.8649 38.2267 20.4783 37.9203 21.0716C35.4608 25.834 30.8613 29.3085 25.4006 30.2275C24.4582 30.386 23.4892 30.4687 22.4998 30.4687C21.3428 30.4687 20.2137 30.3557 19.1224 30.1404C13.7744 29.0853 9.30452 25.5679 6.9492 20.8146C6.69494 20.3014 6.46532 19.7739 6.2619 19.2334C6.1509 18.463 6.09347 17.6755 6.09347 16.875ZM18.7021 8.92147C19.888 5.15118 25.1115 5.15118 26.2974 8.92147C26.4665 9.45901 26.9323 9.78059 27.4122 9.78059C31.3666 9.78059 32.7974 14.8688 29.7743 17.1377C29.3577 17.4503 29.1622 18.0294 29.3334 18.5737C29.9145 20.421 29.1693 22.149 27.8979 23.1031C26.62 24.0622 24.7428 24.2808 23.1736 23.1031C22.7686 22.7991 22.2308 22.7991 21.8258 23.1031C20.2566 24.2808 18.3794 24.0622 17.1015 23.1031C15.8302 22.149 15.085 20.421 15.666 18.5737C15.8372 18.0294 15.6417 17.4503 15.2252 17.1377C12.202 14.8688 13.6328 9.78059 17.5873 9.78059C18.0671 9.78059 18.533 9.45901 18.7021 8.92147Z"
                                    fill="url(#paint1_linear_ukom_icon)"
                                  />
                                  <path
                                    d="M6.119 24.8723C5.95278 25.1536 5.77769 25.457 5.58913 25.7838L2.16542 31.7138C1.74266 32.4458 1.35176 33.1227 1.12639 33.683C0.90564 34.2318 0.627629 35.1834 1.24199 36.0643C1.86414 36.9563 2.86281 37.0092 3.45466 36.9797C4.05391 36.9499 4.81568 36.8 5.634 36.6389L7.11762 36.3471C7.94011 36.1853 8.4281 36.092 8.79017 36.0671C8.95553 36.0557 9.04432 36.0634 9.08801 36.0707C9.10808 36.0741 9.11992 36.0781 9.11992 36.0781L9.12543 36.0806L9.1304 36.0841C9.1304 36.0841 9.13978 36.0924 9.15273 36.1081C9.18093 36.1422 9.23195 36.2153 9.30478 36.3642C9.46425 36.6902 9.62744 37.1595 9.89858 37.9527L10.3876 39.3833C10.6573 40.1726 10.9083 40.9073 11.1822 41.4412C11.4526 41.9685 11.9977 42.8069 13.0813 42.8997C14.1513 42.9913 14.8365 42.2747 15.2014 41.8092C15.5739 41.3338 15.9647 40.6568 16.3872 39.9247L19.7421 34.1139C19.9418 33.768 20.1244 33.4518 20.2889 33.1613C19.7111 33.0982 19.1405 33.0107 18.578 32.8997C13.4643 31.8909 9.04858 28.9505 6.119 24.8723Z"
                                    fill="url(#paint2_linear_ukom_icon)"
                                  />
                                  <path
                                    d="M38.5898 25.2669C38.675 25.4137 38.7626 25.5656 38.8533 25.7227L42.3122 31.7139C42.7349 32.4458 43.1258 33.1227 43.3512 33.683C43.5719 34.2318 43.85 35.1834 43.2356 36.0643C42.6134 36.9563 41.6148 37.0092 41.0229 36.9797C40.4237 36.9499 39.6619 36.8 38.8436 36.6389L37.36 36.3471C36.5375 36.1853 36.0495 36.092 35.6874 36.0671C35.522 36.0557 35.4333 36.0634 35.3896 36.0707C35.3695 36.0741 35.3577 36.0781 35.3577 36.0781L35.3522 36.0806L35.3495 36.0823L35.3472 36.0841C35.3472 36.0841 35.3378 36.0924 35.3323 36.1081C35.2966 36.1422 35.2456 36.2153 35.1728 36.3642C35.0133 36.6902 34.8501 37.1595 34.579 37.9527L34.09 39.3833C33.8203 40.1726 33.5692 40.9073 33.2954 41.4412C33.025 41.9685 32.4798 42.8069 31.3963 42.8997C30.3262 42.9913 29.6411 42.2747 29.2762 41.8092C28.9036 41.3338 28.5129 40.6569 28.0904 39.9247L24.7354 34.1137C24.5467 33.7868 24.3732 33.4864 24.2158 33.2091C24.7729 33.2091 25.3237 33.0924 25.8673 33.001C31.0478 32.1292 35.5541 29.2837 38.5898 25.2669Z"
                                    fill="url(#paint3_linear_ukom_icon)"
                                  />
                                  <defs>
                                    <linearGradient
                                      id="paint0_linear_ukom_icon"
                                      x1="-14.2432"
                                      y1="15.4732"
                                      x2="15.765"
                                      y2="45.6951"
                                      gradientUnits="userSpaceOnUse"
                                    >
                                      <stop stop-color="#A855F7" />
                                      <stop offset="1" stop-color="#9333EA" />
                                    </linearGradient>
                                    <linearGradient
                                      id="paint1_linear_ukom_icon"
                                      x1="-14.2432"
                                      y1="15.4732"
                                      x2="15.765"
                                      y2="45.6951"
                                      gradientUnits="userSpaceOnUse"
                                    >
                                      <stop stop-color="#A855F7" />
                                      <stop offset="1" stop-color="#9333EA" />
                                    </linearGradient>
                                    <linearGradient
                                      id="paint2_linear_ukom_icon"
                                      x1="-14.2432"
                                      y1="15.4732"
                                      x2="15.765"
                                      y2="45.6951"
                                      gradientUnits="userSpaceOnUse"
                                    >
                                      <stop stop-color="#A855F7" />
                                      <stop offset="1" stop-color="#9333EA" />
                                    </linearGradient>
                                    <linearGradient
                                      id="paint3_linear_ukom_icon"
                                      x1="-14.2432"
                                      y1="15.4732"
                                      x2="15.765"
                                      y2="45.6951"
                                      gradientUnits="userSpaceOnUse"
                                    >
                                      <stop stop-color="#A855F7" />
                                      <stop offset="1" stop-color="#9333EA" />
                                    </linearGradient>
                                  </defs>
                                </svg>
                              </div>
                            </div>
                            <div className="absolute top-[111px] w-full justify-center text-center font-['Poppins'] text-xl leading-8 font-semibold tracking-tight text-slate-50">
                              Layanan Uji Kompetensi
                            </div>
                            <ImageWithFallback
                              className="absolute top-[25px] left-1/2 h-20 w-28 -translate-x-1/2"
                              src="/assets/layanan_ukom_thumb.webp"
                              alt="Layanan Uji Kompetensi"
                              imgClassName="object-contain"
                            />
                          </div>
                        </div>

                        {/* Map & Sebaran Perusahaan Card */}
                        <div className="flex w-full justify-center overflow-x-auto pb-4">
                          <div className="relative h-[499px] w-[954px] shrink-0">
                            <div className="absolute top-0 left-0 w-[954px] justify-start font-['Poppins'] text-2xl leading-8 font-semibold tracking-tight text-blue-700 dark:text-blue-400">
                              Wilayah Kerja Balai K3 Samarinda{" "}
                            </div>
                            <div className="absolute top-[84px] left-[533px] h-[390px] w-96 rounded-[20px] border-2 border-blue-700 bg-slate-50 shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] dark:border-blue-500 dark:bg-neutral-900" />
                            <div className="absolute top-[84px] left-[533px] h-16 w-96 rounded-tl-[20px] rounded-tr-[20px] bg-blue-700 dark:bg-blue-800" />
                            <div className="absolute top-[164px] left-[557px] inline-flex w-[336px] flex-col items-start justify-start gap-[14px]">
                              {provinces.map((prov) => {
                                const isHovered = hoveredProvince === prov.id;
                                return (
                                  <div
                                    key={prov.id}
                                    onMouseEnter={() =>
                                      setHoveredProvince(prov.id)
                                    }
                                    onMouseLeave={() =>
                                      setHoveredProvince(null)
                                    }
                                    className={`-mx-2 inline-flex cursor-pointer items-center justify-between gap-2.5 self-stretch rounded-lg px-2 py-1 transition-colors duration-200 ${
                                      isHovered
                                        ? "bg-blue-50/50 dark:bg-blue-950/20"
                                        : ""
                                    }`}
                                  >
                                    <div
                                      className={`w-[130px] shrink-0 font-['Poppins'] text-base leading-tight font-semibold tracking-tight transition-colors duration-200 ${
                                        isHovered
                                          ? "text-blue-700 dark:text-blue-400"
                                          : "text-black dark:text-neutral-100"
                                      }`}
                                    >
                                      {prov.name}
                                    </div>
                                    <div className="flex min-w-0 flex-1 items-center gap-1 text-[10px] text-neutral-500 select-none">
                                      <span className="shrink-0 text-neutral-600 dark:text-neutral-400">
                                        Perusahaan
                                      </span>
                                      <span className="mb-[2px] min-w-[8px] flex-1 border-b border-dotted border-neutral-300 dark:border-neutral-700"></span>
                                      <span className="shrink-0 text-neutral-600 dark:text-neutral-400">
                                        Perusahaan
                                      </span>
                                    </div>
                                    <div
                                      className={`w-8 shrink-0 text-right font-['Poppins'] text-xl font-bold tracking-tight transition-colors duration-200 ${
                                        isHovered
                                          ? "text-blue-700 dark:text-blue-400"
                                          : "text-black dark:text-neutral-100"
                                      }`}
                                    >
                                      {prov.count}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="absolute top-[105px] left-[559px] justify-start font-['Poppins'] text-2xl leading-8 font-semibold tracking-tight text-white">
                              Sebaran Perusahaan
                            </div>

                            {/* Map Container */}
                            <div
                              data-property-1="Group 75"
                              className="absolute top-[108px] left-[20px] h-[383.22px] w-[439.17px]"
                            >
                              {/* Kalimantan Barat (Kalbar) */}
                              <div
                                data-svg-wrapper
                                className="absolute top-[108.79px] left-0 cursor-pointer"
                                onMouseEnter={() =>
                                  setHoveredProvince("kalbar")
                                }
                                onMouseLeave={() => setHoveredProvince(null)}
                              >
                                <svg
                                  width="235"
                                  height="220"
                                  viewBox="0 0 235 220"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M35.0029 13.0665C34.87 12.8006 34.1255 10.2746 32.211 2.29769L31.8122 1.89884C31.4931 1.57977 30.0839 1.5 29.4191 1.5H24.2341L19.0492 2.69653C16.1775 3.33468 14.6619 5.62139 14.263 6.68498L13.4653 10.6734L11.87 15.8584L9.87573 22.2399L7.48267 28.6214L4.69076 34.6041L2.29769 43.3787L1.5 47.766V55.344L2.29769 59.3324L3.49422 63.7197L6.68498 70.5001L9.87573 76.8816L11.4711 80.4712L11.87 82.8643V90.0435L11.4711 96.425V105.598L11.87 110.385C11.87 112.937 12.9335 116.5 13.4653 117.963L15.4596 122.35L18.2515 127.934L21.8411 133.916C23.4364 136.469 25.8295 137.506 27.4249 136.708L29.818 135.113L32.6099 133.119C35.1625 131.204 38.7255 131.789 40.1879 132.321L43.3787 133.916L45.7717 135.512C49.7602 138.304 51.3556 143.622 51.7544 146.679V151.067L50.5579 158.246C49.6006 161.118 49.6272 163.963 49.7602 165.026L52.5521 170.211C53.8284 171.807 54.9452 177.257 55.344 179.783V187.76V198.928L56.1417 203.714L57.7371 210.893C58.6943 214.403 62.9221 213.951 64.9163 213.286C67.4689 212.329 72.0955 212.09 74.0897 212.09C75.2862 212.755 77.6635 214.467 78.477 215.281C79.2747 216.078 81.4018 217.541 82.4654 218.073L88.0493 210.494L92.4365 200.922C94.0319 197.093 92.3036 191.35 91.24 188.957C89.6446 185.766 89.7776 182.309 90.0435 180.98L90.8412 175.795L91.6389 169.812L92.0377 164.229L91.24 157.448C91.24 155.534 92.0377 154.523 92.4365 154.257L96.0261 151.466L98.4192 149.87L104.402 146.281L108.39 143.09L111.581 139.899L116.367 133.916L123.945 127.535L137.107 118.76C142.212 114.612 149.604 113.575 152.662 113.575H160.639L168.217 112.778L175.795 110.783L180.182 108.39C183.692 107.433 186.963 102.939 188.159 100.812L189.755 97.2227C190.074 94.0319 194.142 91.107 196.136 90.0435C199.327 88.4481 199.859 84.5926 199.726 82.8643L200.125 74.4885C199.805 70.0215 203.98 66.7775 206.107 65.714C208.022 64.7567 211.957 62.3903 213.685 61.3267L216.078 57.7371C216.716 56.1417 217.674 52.818 218.073 51.3556L219.269 46.5694C219.588 43.3787 222.061 40.9856 223.258 40.1879C225.491 39.2307 227.379 37.9278 228.044 37.396L229.639 35.4018L231.234 33.0087C231.553 32.3706 231.899 29.818 232.032 28.6214L232.431 25.0318H231.633C229.4 25.3509 223.789 28.0896 221.263 29.4191L215.679 32.211C209.936 34.4446 204.246 33.6735 202.119 33.0087L196.136 31.0145L175.396 23.4364C169.015 21.8411 161.304 24.1012 158.246 25.4307L149.87 29.4191L135.512 39.3902C131.045 42.581 127.269 43.6446 125.939 43.7775L116.367 43.3787L105.598 41.7833C97.3024 39.5498 91.5059 41.1185 89.6446 42.1821L82.0666 46.9683C75.0469 52.3926 69.5695 49.7602 67.7082 47.766L63.7197 44.974L54.9452 36.9972L44.1764 27.026C41.3047 25.1116 38.4596 20.9104 37.396 19.0492L35.0029 13.0665Z"
                                    fill={
                                      hoveredProvince === "kalbar"
                                        ? "#1061D6"
                                        : "#609BDD"
                                    }
                                    stroke="white"
                                    strokeWidth="3"
                                    className="transition-colors duration-200"
                                  />
                                </svg>
                              </div>

                              {/* Kalimantan Utara (Kaltara) */}
                              <div
                                data-svg-wrapper
                                className="absolute top-0 left-[245.29px] cursor-pointer"
                                onMouseEnter={() =>
                                  setHoveredProvince("kaltara")
                                }
                                onMouseLeave={() => setHoveredProvince(null)}
                              >
                                <svg
                                  width="152"
                                  height="144"
                                  viewBox="0 0 152 144"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M8.45508 133.222L2.26044 129.867C0.837707 129.096 0.201143 126.266 0.635575 124.707C0.927958 123.658 1.13794 122.576 1.25539 121.795C1.26947 121.702 1.2753 121.609 1.27785 121.514C1.32163 119.885 2.08509 116.964 2.47241 115.673L3.2701 113.28L5.66317 107.297C6.6204 105.064 8.72098 102.378 9.65161 101.315L14.8366 96.1297L20.0216 90.9447C21.4742 89.4921 22.3758 86.8269 22.7262 85.9603C22.7809 85.825 22.8324 85.6887 22.8633 85.546C23.4093 83.026 22.6732 79.8732 22.4146 78.5805C22.1316 77.1652 22.1415 76.0638 22.0545 74.9978C22.0326 74.7298 22.0555 74.4584 22.1343 74.2012C23.2397 70.5941 23.6381 70.4483 24.4089 69.806L28.3973 66.2164L31.9869 63.4245L37.0236 59.9375C37.1223 59.8692 37.2153 59.7928 37.2972 59.7052C38.4867 58.4322 39.0376 56.6175 39.1661 55.8464L40.7615 49.8637L41.958 43.4822L43.5534 35.1065L44.3511 30.7192L45.5476 23.9388C46.1858 18.5146 48.6054 15.2972 49.9349 14.3666L54.721 10.777L59.5072 7.98507L67.8829 3.59778C69.4213 2.67474 72.0723 1.67752 73.3326 1.24985C73.4222 1.21944 73.5078 1.18329 73.5938 1.14389C76.1954 -0.0473706 81.4826 0.68159 83.8367 1.20471L92.2124 2.0024L100.987 2.80009L106.97 3.59778L117.738 4.39547L127.71 5.19316L136.085 5.592L142.733 5.96133C142.939 5.97273 143.034 6.22172 142.888 6.36716C142.873 6.38211 142.856 6.39501 142.838 6.4055L140.353 7.82553C140.168 7.93121 140.001 8.06576 139.859 8.22408L136.696 11.7377C136.556 11.8939 136.439 12.071 136.36 12.2655C135.361 14.7057 135.619 16.7072 135.96 17.6579C136.032 17.8603 136.163 18.0337 136.315 18.1857L139.276 21.1469C141.65 23.8179 140.528 26.2358 139.504 27.3096C139.359 27.4614 139.178 27.5705 138.985 27.6531L133.692 29.9215L128.766 32.5743C128.594 32.6665 128.437 32.7833 128.3 32.921L126.288 34.9324C126.173 35.048 126.072 35.1774 125.988 35.3176L123.721 39.0949C122.805 41.232 124.007 43.5396 124.811 44.55C124.811 44.6374 124.961 44.7138 125.045 44.7874C126.831 46.35 128.504 49.3557 129.215 50.8651C129.276 50.9953 129.32 51.1312 129.35 51.2718L130.501 56.6441L130.9 61.4302C130.9 62.0176 131.351 63.326 131.63 64.0488C131.675 64.1647 131.732 64.2749 131.798 64.3797L134.39 68.4517C134.456 68.5566 134.533 68.6551 134.618 68.7458L140.473 74.9909L146.056 80.9736L150.444 86.5574C150.903 87.3233 150.236 88.2707 149.36 88.0956L145.658 87.3551L138.478 85.3609C133.692 83.7655 129.039 79.91 127.311 78.1817L124.548 75.419C124.269 75.1398 123.914 74.9437 123.522 74.8944C122.112 74.7172 120.714 74.8745 120.132 74.9909L114.548 75.7886L104.975 76.1875C100.702 76.1875 97.5485 76.9174 96.3517 77.3299C96.2499 77.365 96.1483 77.3937 96.0435 77.4181C92.8971 78.1491 89.5316 81.9348 88.224 83.7655L83.4379 92.1413L78.2529 104.107L71.8714 119.263L68.2818 126.043C66.4278 128.824 62.6786 131.829 60.8739 133.103C60.7611 133.183 60.6395 133.249 60.5122 133.303L53.1257 136.413L41.1603 140.8C37.0123 142.396 31.9869 142.794 29.9927 142.794C26.8019 142.794 22.5476 140.667 20.8193 139.604L14.4377 136.413L8.45508 133.222Z"
                                    fill={
                                      hoveredProvince === "kaltara"
                                        ? "#1061D6"
                                        : "#4598EA"
                                    }
                                    stroke="white"
                                    strokeWidth="3"
                                    className="transition-colors duration-200"
                                  />
                                </svg>
                              </div>

                              {/* Kalimantan Timur (Kaltim) */}
                              <div
                                data-svg-wrapper
                                className="absolute top-[74.49px] left-[213.78px] cursor-pointer"
                                onMouseEnter={() =>
                                  setHoveredProvince("kaltim")
                                }
                                onMouseLeave={() => setHoveredProvince(null)}
                              >
                                <svg
                                  width="229"
                                  height="223"
                                  viewBox="0 0 229 223"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M15.5186 91.6388C10.7324 92.9151 4.74976 92.9683 2.35669 92.8354H2.052C1.64226 92.8354 1.37576 92.4042 1.559 92.0377L2.60242 90.2987C2.70394 90.1295 2.77986 89.9462 2.82771 89.7548L3.55322 86.8527L5.1486 80.0724C6.07912 76.3503 9.59764 74.0856 11.3809 73.3514C11.4802 73.3106 11.5778 73.2646 11.6698 73.2094C15.1681 71.1159 16.6652 68.2063 17.0523 66.7719C17.0986 66.6002 17.1571 66.4331 17.218 66.2661C17.6274 65.144 17.8112 62.6852 17.8787 60.7228C17.9138 59.7043 18.6779 58.8485 19.6908 58.7359L21.5012 58.5348C25.8204 58.2648 29.8731 56.6436 32.0653 55.5067C32.6972 55.179 33.4537 55.1519 34.0812 55.4881L44.2354 60.9278L58.1949 68.107C60.4284 69.3833 66.0389 69.1706 68.5649 68.9047L73.7498 67.7082L79.7325 65.714L88.9059 62.1244C92.3444 61.1866 96.574 58.1307 98.3696 56.6318C98.4431 56.5704 98.5187 56.5159 98.5987 56.4632C101.101 54.8158 103.277 50.7944 104.062 48.9625L106.854 43.3787L111.241 32.211L116.825 19.448L121.611 11.0723C123.207 7.88151 126.796 5.48844 128.392 4.69076C130.625 3.41445 134.374 2.82948 135.97 2.69653H141.952L147.935 2.29769L155.912 1.5C157.188 1.5 158.039 2.03179 158.305 2.29769L164.288 7.48267C167.478 10.0353 171.999 11.737 173.86 12.2688L178.646 13.4653L184.434 14.623C184.564 14.6489 184.696 14.6579 184.827 14.6729C186.539 14.8695 186.48 17.6391 186.224 19.0492C186.113 20.6054 185.966 21.7227 185.811 22.5125C185.598 23.5963 184.627 25.035 184.133 26.023L183.432 27.4249C182.268 29.1714 182.564 31.7145 182.928 33.0557C182.991 33.2905 183.112 33.5041 183.266 33.6924L190.212 42.1821L204.571 57.7371L210.155 63.7197L210.155 63.7197C210.155 63.7197 210.155 63.7197 210.155 63.7197L216.137 69.3036L221.322 73.292L225.311 76.0839C227.544 77.3602 226.241 79.2747 225.311 80.0724C223.616 81.7671 222.005 82.545 221.196 82.7935C221.017 82.8485 220.829 82.8564 220.642 82.8408L216.137 82.4654H209.756L202.975 82.8643L191.808 83.2631C188.765 83.2631 185.481 83.9884 184.03 84.4016C183.896 84.4396 183.769 84.4935 183.647 84.5606C180.512 86.2943 178.667 87.9253 177.992 88.6787C177.893 88.7887 177.789 88.8917 177.68 88.9907C176.156 90.3659 174.33 94.0299 173.524 95.88C173.482 95.9778 173.448 96.0794 173.422 96.1828L172.663 99.2169L170.27 105.598L164.686 118.76C162.772 121.951 162.027 125.408 161.894 126.737C161.584 131.091 163.015 135.293 163.827 136.981C163.868 137.066 163.904 137.152 163.933 137.242C164.862 140.092 165.353 143.644 165.484 145.084C165.484 148.594 162.559 151.067 161.097 151.864L153.12 155.454L143.149 160.639L135.571 165.425C130.9 168.228 129.141 172.524 128.812 174.459C128.796 174.553 128.791 174.646 128.79 174.74C128.758 178.536 127.453 182.863 126.796 184.57C125.839 187.76 123.207 190.951 122.01 192.148L117.786 195.604C117.678 195.692 117.577 195.794 117.492 195.905C115.352 198.719 116.332 201.098 117.312 202.206C117.504 202.424 117.686 202.652 117.79 202.924C118.902 205.838 119.205 211.038 119.218 213.522C119.218 213.632 119.228 213.739 119.241 213.849C119.421 215.404 118.708 218.085 118.083 219.97C117.822 220.756 117.077 221.263 116.249 221.263H112.039C107.891 220.944 105.524 220.067 104.86 219.668C102.626 218.711 101.536 215.812 101.27 214.483L100.871 212.09L100.074 205.31L98.8771 198.928L97.3391 194.314C97.3009 194.2 97.2524 194.089 97.1942 193.983L92.8944 186.165L92.8944 186.165C92.8944 186.165 92.8944 186.165 92.8944 186.165L89.4471 180.803C89.3526 180.656 89.2393 180.522 89.1101 180.404L84.9175 176.593L82.4749 174.848C82.2447 174.684 81.9665 174.591 81.7344 174.429C80.5087 173.573 80.4091 170.034 80.5302 168.217C80.8493 165.026 80.3973 162.633 80.1314 161.835C80.1314 161.835 80.1314 161.835 80.1314 161.835C79.4932 159.921 76.9406 157.049 75.7441 155.853C72.8724 153.3 70.825 148.408 70.1602 146.281L68.9637 140.697C68.5649 138.171 67.7672 133.039 67.7672 132.72C67.7672 132.401 67.2354 128.333 66.9695 126.338C66.9695 124.424 65.9059 120.754 65.3741 119.159C64.4169 116.926 62.5822 115.304 61.7845 114.772C59.8701 113.815 56.2007 114.107 54.6053 114.373C50.4573 114.692 49.4203 110.783 49.4203 108.789L49.8192 101.211V97.2227C49.5001 94.6701 48.6227 92.7024 48.2238 92.0377C46.3094 89.166 41.5764 88.1822 39.4492 88.0492C33.0677 87.7302 26.6862 88.9799 24.2931 89.6446L15.5186 91.6388Z"
                                    fill={
                                      hoveredProvince === "kaltim"
                                        ? "#1061D6"
                                        : "#1D62BB"
                                    }
                                    stroke="white"
                                    strokeWidth="3"
                                    className="transition-colors duration-200"
                                  />
                                </svg>
                              </div>

                              {/* Kalimantan Tengah (Kalteng) */}
                              <div
                                data-svg-wrapper
                                className="absolute top-[161.04px] left-[80.17px] cursor-pointer"
                                onMouseEnter={() =>
                                  setHoveredProvince("kalteng")
                                }
                                onMouseLeave={() => setHoveredProvince(null)}
                              >
                                <svg
                                  width="221"
                                  height="194"
                                  viewBox="0 0 221 194"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M12.8751 166.622C5.1507 167.549 2.28823 166.805 1.7526 166.274C1.722 166.244 1.68209 166.223 1.63901 166.223C1.51708 166.223 1.45602 166.075 1.54224 165.989L1.70744 165.824L5.29704 161.437C6.25427 160.479 8.62074 156.252 9.68433 154.257C11.2797 152.024 12.2103 148.009 12.4762 146.281C13.1005 144.096 11.9944 139.697 11.3237 137.639C11.2944 137.55 11.2585 137.463 11.2161 137.379L9.81882 134.584C9.72966 134.406 9.66636 134.217 9.64115 134.019C9.39142 132.06 9.5473 128.352 9.67225 126.512C9.6801 126.396 9.69846 126.282 9.72656 126.169L10.8809 121.552C11.193 120.303 11.5307 115.389 11.6696 112.936C11.6757 112.83 11.6729 112.724 11.6617 112.618L10.8809 105.2C10.8809 103.923 11.1468 103.338 11.2797 103.205C12.8751 101.291 15.1352 99.7487 16.0658 99.2169L22.633 94.9675C22.7746 94.876 22.9277 94.8046 23.0762 94.7247C24.3508 94.0388 28.2681 90.7288 30.2977 88.9575C30.383 88.8831 30.4601 88.8028 30.5315 88.715L35.5109 82.5865C35.5763 82.5059 35.648 82.4305 35.7252 82.3611L39.5977 78.8758L49.9676 71.2978L57.5457 66.1128C60.0983 64.1984 63.6613 62.9221 65.1237 62.5232C67.9954 61.566 73.4994 61.3267 75.8925 61.3267L83.4706 60.9278C87.2995 60.9278 92.7769 59.3324 95.037 58.5348L99.6961 56.2053C99.7807 56.1629 99.8677 56.1278 99.9563 56.0944C101.818 55.3941 104.491 52.7966 105.71 51.4612C105.774 51.3906 105.842 51.3261 105.914 51.2625C107.778 49.5957 109.273 45.3353 109.794 43.3787C110.411 41.2204 113.063 39.3849 114.441 38.6639C114.534 38.6154 114.623 38.562 114.708 38.5013L117.074 36.8114C117.271 36.6705 117.441 36.495 117.576 36.2933L118.968 34.2052C119.606 32.9289 119.765 29.685 119.765 28.2226V23.4364C119.446 19.9266 120.962 17.4538 121.76 16.6561C123.036 15.0607 125.482 13.5983 126.546 13.0665L131.839 10.4197C132.032 10.3236 132.207 10.1972 132.359 10.0452L134.124 8.28036C134.369 8.03519 134.944 7.14641 135.378 6.44627C135.592 6.10078 135.968 5.88729 136.374 5.88729C136.469 5.88729 136.563 5.8995 136.655 5.91877C138.063 6.21166 141.898 6.28613 143.696 6.28613C145.93 6.28613 147.552 6.02024 148.083 5.88729L152.471 4.69076L159.251 3.09538L166.43 1.89884C168.026 1.57977 170.552 1.5 171.615 1.5C173.53 1.5 176.667 2.03179 177.997 2.29769C180.23 2.61676 181.586 4.29191 181.985 5.0896C182.942 7.64221 183.182 9.87573 183.182 10.6734V15.0607V23.4364C183.501 27.2654 186.239 27.9567 187.569 27.8237L193.153 27.4249C196.663 27.4249 198.87 31.9451 199.534 34.2052C199.853 35.1625 200.465 37.7948 200.731 38.9914L201.13 43.7775L201.927 49.7602C201.927 51.9937 203.257 57.3382 203.922 59.7313C205.755 65.232 208.467 68.2449 209.744 69.1905C209.85 69.2688 209.951 69.3492 210.041 69.4454C211.005 70.4773 212.461 72.6765 213.095 73.6908C214.69 77.2007 214.557 82.3325 214.292 84.4597C214.292 86.6932 215.621 88.0493 216.286 88.4481L218.131 89.7398C219.211 90.4956 219.277 92.071 218.265 92.9147L217.881 93.2342C215.157 95.3531 211.26 96.9216 209.392 97.5311C209.202 97.5929 209.004 97.6188 208.805 97.6296C204.882 97.8428 203.383 102.197 203.124 104.402L202.725 110.385L202.326 114.373C201.688 118.521 199.933 121.951 199.135 123.148C197.54 126.338 191.026 128.2 187.968 128.731C183.816 129.325 181.41 131.342 180.557 132.478C180.439 132.634 180.313 132.784 180.173 132.92C177.786 135.244 176.929 140.097 176.8 142.292C176.8 143.845 175.792 147.793 175.248 149.718C175.219 149.82 175.182 149.919 175.137 150.015C172.906 154.702 169.74 156.922 168.424 157.448C165.872 158.405 162.575 158.645 161.245 158.645C156.123 158.343 153.443 160.153 152.6 161.251C152.508 161.371 152.415 161.489 152.315 161.602C151.146 162.915 150.604 165.204 150.476 166.223V172.604L150.875 176.992C150.875 178.104 151.263 180.961 151.633 183.4C151.839 184.757 150.664 185.93 149.31 185.705L149.31 185.705C149.31 185.705 149.31 185.705 149.31 185.705L147.286 185.367C143.138 184.729 138.378 185.367 136.517 185.766C132.688 186.723 130.135 186.963 129.338 186.963C126.785 187.282 125.083 185.5 124.552 184.57C123.913 183.612 123.488 181.778 123.355 180.98L122.557 174.997C122.238 172.764 120.031 173.269 118.968 173.801L113.122 176.529C113.031 176.571 112.941 176.622 112.857 176.677C109.087 179.112 106.06 177.644 105.008 176.593L102.216 173.801L99.2288 170.44C99.0941 170.288 98.9393 170.152 98.7546 170.068C97.3843 169.444 97.0313 170.931 97.0313 171.807V178.188C96.7122 181.698 94.2394 182.575 93.0428 182.575L87.8578 182.974H77.695H66.3202C62.4913 183.293 60.2046 184.437 59.5399 184.968L55.9503 187.362L50.5314 191.232C50.4217 191.311 50.3038 191.379 50.1793 191.43C47.8433 192.401 46.0751 191.858 45.1869 191.274C44.9029 191.087 44.7336 190.78 44.6403 190.453L44.0387 188.347C44.003 188.222 43.9795 188.094 43.9687 187.964L43.5861 183.373L43.1873 174.997L42.8055 169.271C42.8055 169.271 42.8055 169.271 42.8055 169.271C42.7942 169.101 42.7631 168.931 42.7005 168.773C42.0223 167.059 40.6323 166.622 39.9965 166.622L34.0138 166.223H24.8404L12.8751 166.622Z"
                                    fill={
                                      hoveredProvince === "kalteng"
                                        ? "#1061D6"
                                        : "#2C78D5"
                                    }
                                    stroke="white"
                                    strokeWidth="3"
                                    className="transition-colors duration-200"
                                  />
                                </svg>
                              </div>

                              {/* Kalimantan Selatan (Kalsel) */}
                              <div
                                data-svg-wrapper
                                className="absolute top-[250.92px] left-[228.94px] cursor-pointer"
                                onMouseEnter={() =>
                                  setHoveredProvince("kalsel")
                                }
                                onMouseLeave={() => setHoveredProvince(null)}
                              >
                                <svg
                                  width="105"
                                  height="136"
                                  viewBox="0 0 105 136"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M12.6676 97.0871C11.5073 97.0871 6.74293 96.6476 3.88861 96.3679C3.43793 96.3238 3.09538 95.9446 3.09538 95.4917V94.2952L2.69653 91.1045L2.32319 88.4911C2.30679 88.3763 2.27986 88.2655 2.25249 88.1529L2.24966 88.1412C1.94458 86.8856 1.6263 82.4828 1.5 80.3356C1.5 78.8344 1.73544 76.7446 1.874 75.7278C1.8902 75.6089 1.91837 75.4905 1.95689 75.3768C2.85901 72.7158 3.67654 71.3552 4.20995 70.7536C4.47984 70.4492 4.81004 70.1739 5.13035 69.9231C6.2937 69.0123 8.43238 68.7692 9.47689 68.7692H14.263C20.3255 68.7692 23.7023 65.5784 24.633 63.983C26.8665 61.1113 27.9567 55.6073 28.2226 53.2142C28.5224 49.3161 29.5502 46.7565 30.1143 45.8003C30.1798 45.6892 30.2415 45.5752 30.2935 45.4573C31.9245 41.7525 35.4268 40.0461 36.9972 39.6535L42.1821 38.457C47.3563 36.6308 49.7965 34.1756 50.4721 33.0299C50.5331 32.9266 50.5948 32.8265 50.6602 32.7259C51.6235 31.244 53.1071 26.4082 53.7486 24.0986C54.0677 22.1841 54.4134 17.7171 54.5463 15.7228L54.9452 12.5321C55.2561 9.11186 59.1272 7.68633 61.17 7.36973C61.2747 7.35349 61.3769 7.33238 61.4781 7.30063C64.4716 6.36096 68.113 4.0116 69.8269 2.76356C70.0102 2.63009 70.1625 2.46034 70.3025 2.28196C71.3986 0.885078 72.3512 1.65546 72.7906 2.37596C72.8639 2.49622 72.9375 2.61643 73.0255 2.72643L74.4885 4.5552L76.8816 7.74595C79.1151 10.2986 82.0666 17.5841 83.2631 20.9078C84.5394 24.0986 85.1244 27.2893 85.2573 28.4859L86.0359 36.2713C86.0486 36.3987 86.0735 36.5245 86.1103 36.647L87.2516 40.4512C88.5279 43.3229 92.3036 44.3067 94.0319 44.4396C95.5548 44.7442 100.106 44.5885 102.483 44.458C102.659 44.4483 102.807 44.5889 102.807 44.7659C102.807 44.8136 102.796 44.8587 102.775 44.9013C102.112 46.2113 99.9676 50.0041 98.8929 51.8867C98.8426 51.9747 98.7998 52.0652 98.7634 52.1598L96.8238 57.2027C96.1857 58.798 95.2285 63.1853 94.8296 65.1796L94.0319 70.3645L93.6331 76.3472V83.1276V87.5148V98.517C93.6331 98.6271 93.6431 98.7358 93.656 98.8452C93.8996 100.906 92.954 106.465 92.4365 109.052C91.7984 113.2 90.5753 116.099 90.0435 117.029C87.4909 121.177 86.3209 118.758 86.055 117.029C85.0978 112.243 81.4018 111.313 79.6735 111.446C75.8446 111.446 71.4307 112.775 69.7024 113.44L57.3382 117.428L45.9367 120.573C45.8269 120.604 45.72 120.643 45.6169 120.692L38.9914 123.81L33.4076 127L25.4307 132.185C17.4538 136.652 15.4596 130.856 15.4596 127.399V121.018L15.8584 115.434L15.4596 109.052L15.0607 103.07C14.6619 99.879 14.263 97.0871 12.6676 97.0871Z"
                                    fill={
                                      hoveredProvince === "kalsel"
                                        ? "#1061D6"
                                        : "#4F8AD3"
                                    }
                                    stroke="white"
                                    strokeWidth="3"
                                    className="transition-colors duration-200"
                                  />
                                </svg>
                              </div>

                              {/* Floating Badges */}
                              {provinces.map((prov) => {
                                if (hoveredProvince !== prov.id) return null;
                                return (
                                  <div
                                    key={prov.id}
                                    style={{
                                      left: `${prov.badgeLeft}px`,
                                      top: `${prov.badgeTop}px`,
                                    }}
                                    className="pointer-events-none absolute z-10 flex h-[68px] w-[68px] flex-col items-center justify-center rounded-[10px] border border-neutral-100 bg-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] dark:border-neutral-700 dark:bg-neutral-800"
                                  >
                                    <div className="font-['Poppins'] text-[14px] leading-[21px] font-semibold text-black dark:text-white">
                                      {prov.shortName}
                                    </div>
                                    <div className="-mt-1 font-roboto text-[30px] leading-[42px] font-bold text-black dark:text-white">
                                      {prov.count}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}

/**
 * Komponen Ikon BarChart3 kustom untuk mendukung Lucide yang kompatibel.
 */
function BarChart3Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}

// ##################
// end authored
// ##################
