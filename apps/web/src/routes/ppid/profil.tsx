import LandingNavbar from "@/components/navbar";
import Footer from "@/components/footer";
import ImageWithFallback from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { pageHead } from "@/utils/page-head";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/ppid/profil")({
  component: PPIDProfilePage,
  head: () => pageHead("Profil PPID - Balai K3 Samarinda"),
});

function PPIDProfilePage() {
  const navigate = useNavigate();

  const [selectedYear, setSelectedYear] = useState<"2026" | "2025" | "2024">(
    "2026",
  );

  const yearlyData = {
    "2026": {
      total: 248,
      fulfilled: 214,
      processed: 24,
      rejected: 10,
      monthly: [
        { name: "Jan", count: 12 },
        { name: "Feb", count: 15 },
        { name: "Mar", count: 14 },
        { name: "Apr", count: 21 },
        { name: "Mei", count: 30 },
        { name: "Jun", count: 23 },
        { name: "Jul", count: 20 },
        { name: "Agt", count: 28 },
        { name: "Sep", count: 40 },
        { name: "Okt", count: 26 },
        { name: "Nov", count: 26 },
        { name: "Des", count: 10 },
      ],
    },
    "2025": {
      total: 185,
      fulfilled: 160,
      processed: 15,
      rejected: 10,
      monthly: [
        { name: "Jan", count: 8 },
        { name: "Feb", count: 12 },
        { name: "Mar", count: 10 },
        { name: "Apr", count: 14 },
        { name: "Mei", count: 18 },
        { name: "Jun", count: 15 },
        { name: "Jul", count: 17 },
        { name: "Agt", count: 22 },
        { name: "Sep", count: 25 },
        { name: "Okt", count: 20 },
        { name: "Nov", count: 14 },
        { name: "Des", count: 10 },
      ],
    },
    "2024": {
      total: 142,
      fulfilled: 120,
      processed: 14,
      rejected: 8,
      monthly: [
        { name: "Jan", count: 5 },
        { name: "Feb", count: 8 },
        { name: "Mar", count: 7 },
        { name: "Apr", count: 12 },
        { name: "Mei", count: 14 },
        { name: "Jun", count: 10 },
        { name: "Jul", count: 12 },
        { name: "Agt", count: 16 },
        { name: "Sep", count: 20 },
        { name: "Okt", count: 15 },
        { name: "Nov", count: 13 },
        { name: "Des", count: 10 },
      ],
    },
  };

  const currentData = yearlyData[selectedYear];

  const donutData = [
    {
      name: "Permohonan Dipenuhi",
      value: currentData.fulfilled,
      color: "#39CB70",
    },
    {
      name: "Permohonan Diproses",
      value: currentData.processed,
      color: "#F6B939",
    },
    {
      name: "Permohonan Ditolak",
      value: currentData.rejected,
      color: "#F43F5E",
    },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden overflow-y-auto bg-white dark:bg-neutral-950">
      <LandingNavbar />

      {/* Back Button */}
      <div className="container mx-auto px-4 pt-8 sm:px-6 md:px-10">
        <Button
          variant="ghost"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate({ to: "/ppid" })}
        >
          <ArrowLeft className="size-4" />
          Kembali ke Portal PPID
        </Button>
      </div>

      {/* Tentang PPID Section — sesuai Figma node 1986:15881 */}
      <section className="mx-auto w-full max-w-7xl bg-white px-6 py-16 md:px-16 lg:px-24 dark:bg-neutral-950">
        <div className="flex flex-col items-center justify-between gap-12 lg:flex-row lg:items-start lg:gap-16">
          {/* Kolom Kiri: Teks & Header */}
          <div className="flex w-full flex-col gap-8 lg:max-w-[700px]">
            {/* Header Frame */}
            <div className="flex w-full max-w-[424px] flex-col gap-5">
              <h2 className="font-poppins text-4xl font-semibold text-[#1061D6] md:text-5xl lg:text-[60px] lg:leading-[1.18]">
                Tentang PPID
              </h2>
              {/* Garis gradien dekoratif */}
              <div className="h-3 w-full rounded-[2px] bg-gradient-to-r from-[#1061D6] via-[#78E275] to-white" />
            </div>

            {/* Paragraf Deskripsi */}
            <div className="flex flex-col gap-6">
              <p className="font-poppins text-lg font-medium tracking-[0.005em] text-[#4D4D4D] md:text-xl lg:text-[24px] lg:leading-[1.4] dark:text-neutral-400">
                Pejabat Pengelola Informasi dan Dokumentasi (PPID) adalah
                pejabat yang bertanggung jawab dalam pengelolaan dan pelayanan
                informasi publik.
              </p>
              <p className="font-poppins text-lg font-medium tracking-[0.005em] text-[#4D4D4D] md:text-xl lg:text-[24px] lg:leading-[1.4] dark:text-neutral-400">
                PPID berperan dalam mewujudkan keterbukaan informasi publik yang
                transparan, akuntabel, dan mudah diakses oleh masyarakat sesuai
                dengan ketentuan peraturan perundang-undangan.
              </p>
            </div>
          </div>

          {/* Kolom Kanan: Ilustrasi / Gambar */}
          <div className="flex w-full max-w-[429px] items-center justify-center lg:h-[445px] lg:w-[429px]">
            <ImageWithFallback
              src="/assets/tentang_ppid.webp"
              alt="Tentang PPID Balai K3 Samarinda"
              className="h-full w-full"
              imgClassName="object-contain"
            />
          </div>
        </div>
      </section>

      {/* ################## */}
      {/* authored (generated by gemini, Jun 13 2026 21:00 WITA) */}
      {/* ################## */}
      {/* Tugas PPID Section — sesuai Figma node 1986:17363 */}
      <section className="mx-auto w-full max-w-7xl bg-white px-6 py-16 md:px-16 lg:px-24 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-12">
          {/* Header Seksi */}
          <div className="flex w-full max-w-[336px] flex-col items-center gap-5 text-center">
            <h2 className="font-poppins text-4xl font-semibold text-[#1061D6] md:text-5xl lg:text-[60px] lg:leading-[1.18]">
              Tugas PPID
            </h2>
            {/* Garis gradien dekoratif */}
            <div className="h-3 w-full rounded-[2px] bg-gradient-to-r from-[#1061D6] via-[#78E275] to-white" />
          </div>

          {/* Kolom Kartu (Kewajiban & Hak) */}
          <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Kartu Kewajiban */}
            <div className="flex flex-col overflow-hidden rounded-[30px] bg-white shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] dark:bg-neutral-900">
              {/* Header Kartu */}
              <div className="flex h-[97px] items-center justify-center bg-gradient-to-r from-[#169AF9] to-[#0C74EA]">
                <h3 className="font-poppins text-2xl font-semibold text-white md:text-3xl lg:text-[40px] lg:leading-[1.18]">
                  Kewajiban
                </h3>
              </div>
              {/* Content Kartu */}
              <div className="flex flex-col gap-6 p-6 md:p-10 lg:p-12">
                {[
                  "Menyediakan dan memberikan informasi publik yang akurat.",
                  "Menyediakan, menyimpan, mendokumentasikan, dan mengamankan informasi publik.",
                  "PPID wajib menyusun dan memperbarui Daftar Informasi Publik secara berkala.",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 sm:gap-5">
                    <ImageWithFallback
                      src="/assets/icon_check.svg"
                      alt=""
                      className="size-8 shrink-0 sm:size-10"
                      imgClassName="object-contain"
                    />
                    <p className="font-poppins text-base leading-relaxed font-normal break-words text-[#4D4D4D] md:text-lg lg:text-[20px] lg:leading-[1.4] xl:text-[22px] dark:text-neutral-300">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Kartu Hak */}
            <div className="flex flex-col overflow-hidden rounded-[30px] bg-white shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] dark:bg-neutral-900">
              {/* Header Kartu */}
              <div className="flex h-[97px] items-center justify-center bg-gradient-to-r from-[#169AF9] to-[#0C74EA]">
                <h3 className="font-poppins text-2xl font-semibold text-white md:text-3xl lg:text-[40px] lg:leading-[1.18]">
                  Hak
                </h3>
              </div>
              {/* Content Kartu */}
              <div className="flex flex-col gap-6 p-6 md:p-10 lg:p-12">
                {[
                  "Berhak menolak memberikan informasi yang dikecualikan oleh instansi.",
                  "PPID berhak meminta pemohon untuk melengkapi identitas serta tujuan penggunaan informasi guna kepentingan administrasi.",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 sm:gap-5">
                    <ImageWithFallback
                      src="/assets/icon_check.svg"
                      alt=""
                      className="size-8 shrink-0 sm:size-10"
                      imgClassName="object-contain"
                    />
                    <p className="font-poppins text-base leading-relaxed font-normal break-words text-[#4D4D4D] md:text-lg lg:text-[20px] lg:leading-[1.4] xl:text-[22px] dark:text-neutral-300">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ################## */}
      {/* authored (generated by gemini, Jun 13 2026 21:04 WITA) */}
      {/* ################## */}
      {/* Fungsi PPID Section — sesuai Figma node 1986:17421 */}
      <section className="mx-auto w-full max-w-7xl bg-white px-6 py-16 md:px-16 lg:px-24 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-16">
          {/* Header Seksi */}
          <div className="flex w-full max-w-[349px] flex-col items-center gap-5 text-center">
            <h2 className="font-poppins text-4xl font-semibold text-[#1061D6] md:text-5xl lg:text-[60px] lg:leading-[1.18]">
              Fungsi PPID
            </h2>
            {/* Garis gradien dekoratif */}
            <div className="h-3 w-full rounded-[2px] bg-gradient-to-r from-[#1061D6] via-[#78E275] to-white" />
          </div>

          {/* Grid Kartu Fungsi */}
          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: "/assets/icon_fungsi_1.svg",
                text: "Mengelola dan mendokumentasikan informasi publik.",
              },
              {
                icon: "/assets/icon_fungsi_2.svg",
                text: "Menyediakan dan melayani permohonan informasi.",
              },
              {
                icon: "/assets/icon_fungsi_3.svg",
                text: "Melakukan pengklasifikasian informasi (terbuka dan dikecualikan).",
              },
              {
                icon: "/assets/icon_fungsi_4.svg",
                text: "Menjamin ketersediaan informasi yang akurat dan dapat diakses.",
              },
            ].map((card, idx) => (
              <div
                key={idx}
                className="flex min-h-[338px] flex-col gap-6 rounded-[20px] border-2 border-[#169AF9]/30 bg-white p-5 shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] transition-all duration-300 hover:scale-[1.02] hover:border-[#169AF9] sm:p-6 lg:p-5 xl:p-8 dark:bg-neutral-900"
              >
                {/* Icon Container */}
                <div className="size-20 shrink-0">
                  <ImageWithFallback
                    src={card.icon}
                    alt=""
                    className="h-full w-full"
                    imgClassName="object-contain"
                  />
                </div>
                {/* Deskripsi */}
                <p className="font-poppins text-sm leading-relaxed font-normal break-words text-[#4D4D4D] sm:text-base lg:text-base xl:text-[20px] xl:leading-[1.4] dark:text-neutral-300">
                  {card.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistik Layanan Informasi Section — sesuai Figma node 1986:17458 */}
      <section className="mx-auto w-full max-w-7xl bg-white px-6 py-16 md:px-16 lg:px-24 dark:bg-neutral-950">
        <div className="flex flex-col gap-10">
          {/* Header Seksi (Tengah) */}
          <div className="mx-auto flex w-full flex-col items-center gap-5 text-center">
            <h2 className="font-poppins text-4xl font-semibold text-[#1061D6] md:text-5xl lg:text-[60px] lg:leading-[1.18]">
              Statistik Layanan Informasi
            </h2>
            {/* Garis gradien dekoratif */}
            <div className="h-3 w-full max-w-[827px] rounded-[2px] bg-gradient-to-r from-[#1061D6] via-[#78E275] to-transparent" />
          </div>

          {/* Filter Dropdown (Di bawah, tidak sejajar judul) */}
          <div className="flex w-full items-center justify-end gap-3 pr-1">
            <span className="font-poppins text-sm font-semibold text-[#4D4D4D] dark:text-neutral-400">
              Pilih Tahun:
            </span>
            <Select
              value={selectedYear}
              onValueChange={(val) =>
                setSelectedYear(val as "2026" | "2025" | "2024")
              }
            >
              <SelectTrigger className="font-poppins w-[120px] rounded-lg border-2 border-slate-200 font-semibold dark:border-neutral-800">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grid Kartu Statistik Utama */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Total Permintaan */}
            <div className="relative flex min-h-[140px] flex-col justify-center rounded-[20px] border border-slate-100 bg-white p-5 pr-16 shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] xl:min-h-[195px] xl:p-6 xl:pr-20 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-col gap-1.5">
                <span className="font-poppins text-sm leading-tight font-semibold text-[#4D4D4D] sm:text-base xl:text-lg dark:text-neutral-300">
                  Total
                  <br /> Permintaan
                </span>
                <span className="font-poppins my-1 text-2xl leading-none font-bold text-[#1061D6] sm:text-3xl xl:text-4xl">
                  {currentData.total}
                </span>
                <span className="font-poppins text-xs font-normal text-[#8A8A8A]">
                  Permintaan
                </span>
              </div>
              <div className="absolute top-1/2 right-5 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-[#CCE2FF]/70 xl:right-6 xl:size-[55px]">
                <ImageWithFallback
                  src="/assets/icon_stats_total.svg"
                  alt=""
                  className="size-5 xl:size-6"
                  imgClassName="object-contain"
                />
              </div>
            </div>

            {/* Card 2: Permohonan Dipenuhi */}
            <div className="relative flex min-h-[140px] flex-col justify-center rounded-[20px] border border-slate-100 bg-white p-5 pr-16 shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] xl:min-h-[195px] xl:p-6 xl:pr-20 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-col gap-1.5">
                <span className="font-poppins text-sm leading-tight font-semibold text-[#4D4D4D] sm:text-base xl:text-lg dark:text-neutral-300">
                  Permohonan
                  <br /> Dipenuhi
                </span>
                <span className="font-poppins my-1 text-2xl leading-none font-bold text-[#39CB70] sm:text-3xl xl:text-4xl">
                  {currentData.fulfilled}
                </span>
                <span className="font-poppins text-xs font-normal text-[#8A8A8A]">
                  Permintaan
                </span>
              </div>
              <div className="absolute top-1/2 right-5 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-[#39CB70]/20 xl:right-6 xl:size-[55px]">
                <ImageWithFallback
                  src="/assets/icon_stats_fulfilled.svg"
                  alt=""
                  className="size-5 xl:size-6"
                  imgClassName="object-contain"
                />
              </div>
            </div>

            {/* Card 3: Permohonan Diproses */}
            <div className="relative flex min-h-[140px] flex-col justify-center rounded-[20px] border border-slate-100 bg-white p-5 pr-16 shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] xl:min-h-[195px] xl:p-6 xl:pr-20 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-col gap-1.5">
                <span className="font-poppins text-sm leading-tight font-semibold text-[#4D4D4D] sm:text-base xl:text-lg dark:text-neutral-300">
                  Permohonan
                  <br /> Diproses
                </span>
                <span className="font-poppins my-1 text-2xl leading-none font-bold text-[#F6B939] sm:text-3xl xl:text-4xl">
                  {currentData.processed}
                </span>
                <span className="font-poppins text-xs font-normal text-[#8A8A8A]">
                  Permintaan
                </span>
              </div>
              <div className="absolute top-1/2 right-5 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-[#F6B939]/20 xl:right-6 xl:size-[55px]">
                <ImageWithFallback
                  src="/assets/icon_stats_processed.svg"
                  alt=""
                  className="size-5 xl:size-6"
                  imgClassName="object-contain"
                />
              </div>
            </div>

            {/* Card 4: Permohonan Ditolak */}
            <div className="relative flex min-h-[140px] flex-col justify-center rounded-[20px] border border-slate-100 bg-white p-5 pr-16 shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] xl:min-h-[195px] xl:p-6 xl:pr-20 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-col gap-1.5">
                <span className="font-poppins text-sm leading-tight font-semibold text-[#4D4D4D] sm:text-base xl:text-lg dark:text-neutral-300">
                  Permohonan
                  <br /> Ditolak
                </span>
                <span className="font-poppins my-1 text-2xl leading-none font-bold text-[#F43F5E] sm:text-3xl xl:text-4xl">
                  {currentData.rejected}
                </span>
                <span className="font-poppins text-xs font-normal text-[#8A8A8A]">
                  Permintaan
                </span>
              </div>
              <div className="absolute top-1/2 right-5 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-[#F43F5E]/20 xl:right-6 xl:size-[55px]">
                <ImageWithFallback
                  src="/assets/icon_stats_rejected.svg"
                  alt=""
                  className="size-5 xl:size-6"
                  imgClassName="object-contain"
                />
              </div>
            </div>
          </div>

          {/* Row Grafik (Line Chart & Donut Chart) */}
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Grafik Garis per-Bulan */}
            <div className="flex-1 rounded-[20px] border border-slate-100 bg-white p-6 shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] md:p-8 dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="font-poppins mb-6 text-lg font-semibold text-[#4D4D4D] dark:text-neutral-300">
                Jumlah Permintaan per-Bulan
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={currentData.monthly}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E2E8F0"
                      className="dark:stroke-neutral-800"
                    />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fill: "#8A8A8A",
                        fontSize: 12,
                        fontFamily: "Poppins",
                      }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fill: "#8A8A8A",
                        fontSize: 12,
                        fontFamily: "Poppins",
                      }}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderColor: "#E2E8F0",
                        borderRadius: "8px",
                        fontFamily: "Poppins",
                        fontSize: "12px",
                      }}
                      itemStyle={{ color: "#1061D6" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#1061D6"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: "#FFFFFF" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut Chart Statistik Status */}
            <div className="flex w-full flex-col justify-between rounded-[20px] border border-slate-100 bg-white p-6 shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] md:p-8 lg:max-w-[380px] dark:border-neutral-800 dark:bg-neutral-900">
              <div>
                <h3 className="font-poppins mb-6 text-lg font-semibold text-[#4D4D4D] dark:text-neutral-300">
                  Statistik Permintaan
                </h3>
                <div className="relative flex h-[200px] w-full items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          borderColor: "#E2E8F0",
                          borderRadius: "8px",
                          fontFamily: "Poppins",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Label */}
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="font-poppins text-3xl font-bold text-[#4D4D4D] dark:text-neutral-200">
                      {currentData.total}
                    </span>
                    <span className="font-poppins text-[10px] tracking-wider text-[#8A8A8A] uppercase">
                      Total
                    </span>
                  </div>
                </div>
              </div>

              {/* Custom Legend */}
              <div className="mt-6 flex flex-col gap-3">
                {donutData.map((item, index) => (
                  <div
                    key={index}
                    className="font-poppins flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-[#8A8A8A]">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-semibold text-[#4D4D4D] dark:text-neutral-300">
                      {item.value} (
                      {Math.round((item.value / currentData.total) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ################## */}
      {/* authored (generated by gemini, Jun 13 2026 21:36 WITA) */}
      {/* ################## */}
      {/* Butuh Informasi Lebih Lanjut Section — sesuai Figma node 1986:17600 */}
      <section className="mx-auto w-full max-w-7xl bg-white px-6 py-16 md:px-16 lg:px-24 dark:bg-neutral-950">
        <div className="flex flex-col items-center justify-between gap-10 md:flex-row md:items-center lg:gap-16">
          {/* Kolom Kiri: Ilustrasi Customer Service */}
          <div className="flex size-40 shrink-0 items-center justify-center rounded-full bg-white p-2 shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] lg:size-[181px] dark:bg-neutral-900">
            <ImageWithFallback
              src="/assets/customer_service.webp"
              alt="Customer Service"
              className="h-full w-full rounded-full"
              imgClassName="object-cover"
            />
          </div>

          {/* Kolom Kanan: Teks & Aksi */}
          <div className="flex flex-1 flex-col gap-6 text-center md:text-left">
            <div className="flex flex-col gap-3">
              <h2 className="font-poppins text-2xl font-semibold text-[#4D4D4D] md:text-3xl lg:text-[32px] dark:text-neutral-200">
                Butuh Informasi Lebih Lanjut?
              </h2>
              <p className="font-poppins text-base leading-relaxed font-normal text-[#8A8A8A] md:text-lg lg:text-[20px] dark:text-neutral-400">
                Akses informasi publik yang tersedia atau ajukan permohonan
                informasi
                <br className="hidden lg:inline" /> sesuai kebutuhan Anda.
              </p>
            </div>

            {/* Container Tombol Aksi */}
            <div className="flex flex-col justify-center gap-4 sm:flex-row sm:items-center md:justify-start">
              {/* Tombol 1: Akses Informasi Publik */}
              <div
                onClick={() => navigate({ to: "/ppid" })}
                className="group flex h-[71px] w-full cursor-pointer items-center justify-between gap-4 rounded-[10px] border border-[#1061D6]/5 bg-[#1061D6]/10 px-6 py-4 text-[#1061D6] transition-all duration-300 hover:bg-[#1061D6]/20 sm:w-[360px] lg:w-[416px]"
              >
                <div className="flex items-center gap-4">
                  <ImageWithFallback
                    src="/assets/icon_akses_informasi.svg"
                    alt=""
                    className="size-10 shrink-0"
                    imgClassName="object-contain"
                  />
                  <span className="font-poppins text-base font-semibold lg:text-lg">
                    Akses Informasi Publik
                  </span>
                </div>
                <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
              </div>

              {/* Tombol 2: Permohonan Informasi */}
              <div
                onClick={() => navigate({ to: "/ppid/permohonan" })}
                className="group flex h-[71px] w-full cursor-pointer items-center justify-between gap-4 rounded-[10px] border border-[#39CB70]/5 bg-[#39CB70]/10 px-6 py-4 text-emerald-700 transition-all duration-300 hover:bg-[#39CB70]/20 sm:w-[360px] lg:w-[416px] dark:text-[#39CB70]"
              >
                <div className="flex items-center gap-4">
                  <ImageWithFallback
                    src="/assets/icon_permohonan_informasi.svg"
                    alt=""
                    className="size-10 shrink-0"
                    imgClassName="object-contain"
                  />
                  <span className="font-poppins text-base font-semibold lg:text-lg">
                    Permohonan Informasi
                  </span>
                </div>
                <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
