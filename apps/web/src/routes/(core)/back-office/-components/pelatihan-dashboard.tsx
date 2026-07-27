import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import {
  Cell,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

interface PelatihanDashboardProps {
  profileName: string;
  roles?: any[];
}

function getRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

export function PelatihanDashboard({ profileName }: PelatihanDashboardProps) {
  const [lastUpdated, setLastUpdated] = useState<string>("2 menit lalu");

  const { data: stats, refetch: refetchPelatihanStats } = useQuery(
    trpc.pelatihan.base.getDashboardStats.queryOptions(undefined),
  );

  const { data: ordersData, refetch: refetchPelatihanOrders } = useQuery(
    trpc.pelatihan.order.getAllOrders.queryOptions({
      page: 1,
      perPage: 10,
      status: "waiting_verification",
    }),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated("Baru saja");
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const formattedToday = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleRefresh = () => {
    refetchPelatihanStats();
    refetchPelatihanOrders();
    setLastUpdated("Baru saja");
  };

  // Safe fallback counts for statistics
  const totalPeserta = stats?.totalEnrollments ?? 0;
  const elearningAktif = stats?.enrollmentTypeCounts?.elearning ?? 0;
  const pelatihanAktif = stats?.enrollmentTypeCounts?.bimtek ?? 0;
  const sertifikatDiterbitkan = stats?.totalCertificates ?? 0;

  // Chart Data breakdowns
  const chartPelatihan = [
    {
      name: "Bimtek",
      value: stats?.pelatihanTypeCounts?.bimtek ?? 0,
      color: "#009099",
    },
    {
      name: "E-Learning",
      value: stats?.pelatihanTypeCounts?.elearning ?? 0,
      color: "#BC76FF",
    },
    {
      name: "Webinar",
      value: stats?.pelatihanTypeCounts?.webinar ?? 0,
      color: "#1061D6",
    },
  ];

  const totalPelatihanChart = chartPelatihan.reduce(
    (acc, curr) => acc + curr.value,
    0,
  );

  const chartStatusPeserta = [
    {
      name: "Bimtek",
      value: stats?.enrollmentTypeCounts?.bimtek ?? 0,
      color: "#009099",
    },
    {
      name: "E-Learning",
      value: stats?.enrollmentTypeCounts?.elearning ?? 0,
      color: "#BC76FF",
    },
    {
      name: "Webinar",
      value: stats?.enrollmentTypeCounts?.webinar ?? 0,
      color: "#1061D6",
    },
  ];

  const totalEnrollmentsChart = chartStatusPeserta.reduce(
    (acc, curr) => acc + curr.value,
    0,
  );

  const dbOrders = ordersData?.data || [];
  const verificationQueue = dbOrders.map((o) => ({
    id: o.id,
    name: o.user?.name || "Peserta Pelatihan",
    instansi: "PT Cahaya Abadi",
    program: o.items?.[0]?.pelatihan?.title || "K3 Industri",
    status: o.status === "waiting_verification" ? "Menunggu" : "Terdaftar",
    statusColor: "bg-black/20 text-neutral-700 dark:text-neutral-300",
    time: getRelativeTime(o.createdAt),
  }));

  const mockQueue = [
    {
      id: "1",
      name: "Rizky Pratama",
      instansi: "PT Cahaya Abadi",
      program: "K3 Industri",
      status: "Menunggu",
      statusColor: "bg-black/20 text-neutral-700 dark:text-neutral-300",
      time: "2 jam lalu",
    },
    {
      id: "2",
      name: "Dewi Lestari",
      instansi: "PT Bintang Jaya",
      program: "K3 Industri",
      status: "Menunggu",
      statusColor: "bg-black/20 text-neutral-700 dark:text-neutral-300",
      time: "2 jam lalu",
    },
    {
      id: "3",
      name: "Agus Santoso",
      instansi: "PT Mega Sentosa",
      program: "K3 Industri",
      status: "Terdaftar",
      statusColor: "bg-green-600 text-white",
      time: "2 jam lalu",
    },
    {
      id: "4",
      name: "Sari Wulandari",
      instansi: "PT Surya Mandiri",
      program: "K3 Industri",
      status: "Menunggu",
      statusColor: "bg-black/20 text-neutral-700 dark:text-neutral-300",
      time: "2 jam lalu",
    },
    {
      id: "5",
      name: "Hendra Wijaya",
      instansi: "PT Prima Kencana",
      program: "K3 Industri",
      status: "Revisi",
      statusColor: "bg-amber-400 text-white",
      time: "2 jam lalu",
    },
  ];

  const displayedQueue =
    verificationQueue.length > 0 ? verificationQueue.slice(0, 5) : mockQueue;

  return (
    <div className="w-full flex-1 bg-slate-50/50 p-6 font-['Poppins'] lg:p-8">
      {/* Upper Navigation / Summary Row */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-800">
            Dashboard Layanan Pelatihan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Selamat datang kembali, {profileName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Last Updated Refresh Indicator */}
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <span>Terakhir diperbarui: {lastUpdated}</span>
            <button
              onClick={handleRefresh}
              className="cursor-pointer rounded-full p-1 transition-colors hover:bg-slate-100"
              title="Refresh Data"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2.5 10C2.5 8.01088 3.29018 6.10322 4.6967 4.6967C6.10322 3.29018 8.01088 2.5 10 2.5C12.0967 2.50789 14.1092 3.32602 15.6167 4.78333L17.5 6.66667M13.3333 6.66667H17.5V2.5M17.5 10C17.5 11.9891 16.7098 13.8968 15.3033 15.3033C13.8968 16.7098 11.9891 17.5 10 17.5C7.90329 17.4921 5.89081 16.674 4.38333 15.2167L2.5 13.3333M2.5 17.5V13.3333H6.66667"
                  stroke="#768094"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Date Picker Button Mockup */}
          <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-2 shadow-sm outline outline-1 outline-slate-200">
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.66667 1.66406V4.9974M13.3333 1.66406V4.9974M2.5 8.33073H17.5M4.16667 3.33073H15.8333C16.7538 3.33073 17.5 4.07692 17.5 4.9974V16.6641C17.5 17.5845 16.7538 18.3307 15.8333 18.3307H4.16667C3.24619 18.3307 2.5 17.5845 2.5 16.6641V4.9974C2.5 4.07692 3.24619 3.33073 4.16667 3.33073Z"
                stroke="#768094"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm font-medium text-neutral-600">
              {formattedToday}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Stats Grid Cards */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Peserta */}
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="flex gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
              <svg
                width="20"
                height="20"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.6663 7.33333L11.9997 8.66667L14.6663 6M10.6663 14V12.6667C10.6663 11.9594 10.3854 11.2811 9.88529 10.781C9.3852 10.281 8.70692 10 7.99967 10H3.99967C3.29243 10 2.61415 10.281 2.11406 10.781C1.61396 11.2811 1.33301 11.9594 1.33301 12.6667V14M8.66634 4.66667C8.66634 6.13943 7.47243 7.33333 5.99967 7.33333C4.52691 7.33333 3.33301 6.13943 3.33301 4.66667C3.33301 3.19391 4.52691 2 5.99967 2C7.47243 2 8.66634 3.19391 8.66634 4.66667Z"
                  stroke="#1061D6"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-500">
                Total Peserta
              </span>
              <span className="my-1 text-3xl font-bold tracking-tight text-neutral-800">
                {totalPeserta > 0 ? totalPeserta : 1423}
              </span>
              <div className="flex items-center gap-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 11 11"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8.70866 5.50033L5.50033 2.29199L2.29199 5.50033M5.50033 2.29199V8.70866"
                    stroke="#33AC61"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-xs font-semibold text-green-600">
                  25%
                </span>
                <span className="text-xs font-medium text-slate-400">
                  bulan ini
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Peserta E-Learning */}
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="flex gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-fuchsia-50">
              <svg
                width="20"
                height="20"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.00065 4.66667V14M8.00065 4.66667C8.00065 3.95942 7.7197 3.28115 7.2196 2.78105C6.71951 2.28095 6.04123 2 5.33398 2H2.00065C1.82384 2 1.65427 2.07024 1.52925 2.19526C1.40422 2.32029 1.33398 2.48986 1.33398 2.66667V11.3333C1.33398 11.5101 1.40422 11.6797 1.52925 11.8047C1.65427 11.9298 1.82384 12 2.00065 12H6.00065C6.53108 12 7.03979 12.2107 7.41486 12.5858C7.78994 12.9609 8.00065 13.4696 8.00065 14M8.00065 4.66667C8.00065 3.95942 8.2816 3.28115 8.7817 2.78105C9.2818 2.28095 9.96007 2 10.6673 2H14.0007C14.1775 2 14.347 2.07024 14.4721 2.19526C14.5971 2.32029 14.6673 2.48986 14.6673 2.66667V11.3333C14.6673 11.5101 14.5971 11.6797 14.4721 11.8047C14.347 11.9298 14.1775 12 14.0007 12H10.0007C9.47022 12 8.96151 12.2107 8.58644 12.5858C8.21136 12.9609 8.00065 13.4696 8.00065 14"
                  stroke="#BC76FF"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-500">
                Peserta E-Learning
              </span>
              <span className="my-1 text-3xl font-bold tracking-tight text-neutral-800">
                {elearningAktif > 0 ? elearningAktif : 533}
              </span>
              <div className="flex items-center gap-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 11 11"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8.70866 5.50033L5.50033 2.29199L2.29199 5.50033M5.50033 2.29199V8.70866"
                    stroke="#33AC61"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-xs font-semibold text-green-600">
                  25%
                </span>
                <span className="text-xs font-medium text-slate-400">
                  bulan ini
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Peserta Bimtek */}
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="flex gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.3327 10.8333L17.6852 13.735C17.7479 13.7768 17.8208 13.8007 17.8961 13.8043C17.9714 13.8079 18.0462 13.791 18.1127 13.7555C18.1791 13.7199 18.2347 13.6669 18.2734 13.6023C18.3122 13.5376 18.3326 13.4637 18.3327 13.3883V6.55833C18.3327 6.48502 18.3134 6.413 18.2767 6.34954C18.2399 6.28608 18.1871 6.23344 18.1236 6.19692C18.06 6.1604 17.9879 6.1413 17.9146 6.14155C17.8413 6.14179 17.7693 6.16138 17.706 6.19833L13.3327 8.75M3.33268 5H11.666C12.5865 5 13.3327 5.74619 13.3327 6.66667V13.3333C13.3327 14.2538 12.5865 15 11.666 15H3.33268C2.41221 15 1.66602 14.2538 1.66602 13.3333V6.66667C1.66602 5.74619 2.41221 5 3.33268 5Z"
                  stroke="#009099"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-500">
                Peserta Bimtek
              </span>
              <span className="my-1 text-3xl font-bold tracking-tight text-neutral-800">
                {pelatihanAktif > 0 ? pelatihanAktif : 254}
              </span>
              <div className="flex items-center gap-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 11 11"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8.70866 5.50033L5.50033 2.29199L2.29199 5.50033M5.50033 2.29199V8.70866"
                    stroke="#33AC61"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-xs font-semibold text-green-600">
                  25%
                </span>
                <span className="text-xs font-medium text-slate-400">
                  bulan ini
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Sertifikat Terbit */}
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="flex gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-50">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.8975 10.742L14.16 17.847C14.1741 17.9307 14.1624 18.0166 14.1264 18.0935C14.0903 18.1703 14.0317 18.2342 13.9583 18.2768C13.8849 18.3194 13.8002 18.3386 13.7157 18.3317C13.6311 18.3249 13.5506 18.2925 13.485 18.2387L10.5017 15.9995C10.3576 15.8919 10.1827 15.8338 10.0029 15.8338C9.82314 15.8338 9.64819 15.8919 9.50417 15.9995L6.51583 18.2378C6.45027 18.2915 6.36989 18.3239 6.28541 18.3308C6.20094 18.3376 6.11639 18.3185 6.04305 18.276C5.96971 18.2336 5.91106 18.1698 5.87493 18.0931C5.8388 18.0164 5.82691 17.9306 5.84083 17.847L7.1025 10.742M15 6.66699C15 9.42842 12.7614 11.667 10 11.667C7.23858 11.667 5 9.42842 5 6.66699C5 3.90557 7.23858 1.66699 10 1.66699C12.7614 1.66699 15 3.90557 15 6.66699Z"
                  stroke="#F28D00"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-500">
                Sertifikat Terbit
              </span>
              <span className="my-1 text-3xl font-bold tracking-tight text-neutral-800">
                {sertifikatDiterbitkan > 0 ? sertifikatDiterbitkan : 232}
              </span>
              <div className="flex items-center gap-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 11 11"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8.70866 5.50033L5.50033 2.29199L2.29199 5.50033M5.50033 2.29199V8.70866"
                    stroke="#33AC61"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-xs font-semibold text-green-600">
                  25%
                </span>
                <span className="text-xs font-medium text-slate-400">
                  bulan ini
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Block: Antrian Verifikasi Table */}
      <Card className="mb-8 overflow-hidden border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-600">
            Antrian Verifikasi
          </h2>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white font-['Poppins'] font-medium text-slate-500 shadow-sm hover:bg-slate-50"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.20047 15.6313C9.20042 15.7584 9.23402 15.8831 9.29752 15.9912C9.36102 16.0994 9.45191 16.1868 9.55997 16.2436L10.8601 16.9278C10.9593 16.98 11.0694 17.0046 11.1802 16.9993C11.2909 16.994 11.3985 16.959 11.4927 16.8977C11.587 16.8977 11.6647 16.7506 11.7187 16.6487C11.7726 16.5468 11.8009 16.4321 11.8008 16.3155V11.5261C11.801 11.187 11.9207 10.8601 12.1369 10.6086L16.8325 5.1426C16.9167 5.04446 16.972 4.92276 16.9918 4.79222C17.0117 4.66167 16.9952 4.52788 16.9443 4.40701C16.8934 4.28614 16.8103 4.18338 16.7051 4.11115C16.5999 4.03892 16.4771 4.00031 16.3514 4H4.64985C4.52413 4.00005 4.40112 4.03846 4.29572 4.11059C4.19032 4.18272 4.10705 4.28547 4.056 4.40639C4.00495 4.52731 3.98832 4.66121 4.0081 4.79188C4.02789 4.92255 4.08325 5.04438 4.16749 5.1426L8.86438 10.6086C9.08056 10.8601 9.20033 11.187 9.20047 11.5261V15.6313Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Filter
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white font-['Poppins'] font-medium text-neutral-600 shadow-sm hover:bg-slate-50"
            >
              <Link
                to="/back-office/order-pelatihan"
                search={{ status: "waiting_verification" }}
              >
                Lihat semua
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 12L10 8L6 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </Button>
          </div>
        </div>

        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-sm font-semibold text-neutral-600">
                  Nama
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-neutral-600">
                  Instansi
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-neutral-600">
                  Program
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-neutral-600">
                  Status
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-neutral-600">
                  Waktu
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedQueue.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-slate-50/50"
                >
                  <td className="px-6 py-4 text-xs font-semibold whitespace-nowrap text-neutral-600">
                    {row.name}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium whitespace-nowrap text-neutral-500">
                    {row.instansi}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium whitespace-nowrap text-neutral-500">
                    {row.program}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-semibold tracking-wider ${
                        row.status === "Terdaftar"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : row.status === "Revisi"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium whitespace-nowrap text-neutral-500">
                    {row.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Bottom Block: Two Pie Donut Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Chart 1: Jumlah Pelatihan */}
        <Card className="flex flex-col overflow-hidden border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-semibold tracking-tight text-neutral-600">
              Jumlah Pelatihan
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Total program pelatihan
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-8 py-4 sm:flex-row">
            <div className="relative flex h-44 w-44 shrink-0 items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      chartPelatihan.filter((c) => c.value > 0).length > 0
                        ? chartPelatihan
                        : [{ name: "Total", value: 1, color: "#cbd5e1" }]
                    }
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartPelatihan.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tracking-tight text-neutral-600">
                  {totalPelatihanChart > 0 ? totalPelatihanChart : 723}
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">
                  Total
                </span>
              </div>
            </div>

            <div className="flex w-full max-w-[200px] flex-col gap-4">
              {chartPelatihan.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-semibold text-neutral-600">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-neutral-700">
                    {item.value > 0
                      ? item.value
                      : idx === 0
                        ? 234
                        : idx === 1
                          ? 52
                          : 42}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Chart 2: Status Peserta */}
        <Card className="flex flex-col overflow-hidden border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-semibold tracking-tight text-neutral-600">
              Status Peserta
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Aktif saat ini
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-8 py-4 sm:flex-row">
            <div className="relative flex h-44 w-44 shrink-0 items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      chartStatusPeserta.filter((c) => c.value > 0).length > 0
                        ? chartStatusPeserta
                        : [{ name: "Total", value: 1, color: "#cbd5e1" }]
                    }
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartStatusPeserta.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tracking-tight text-neutral-600">
                  {totalEnrollmentsChart > 0 ? totalEnrollmentsChart : 723}
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">
                  Total
                </span>
              </div>
            </div>

            <div className="flex w-full max-w-[200px] flex-col gap-4">
              {chartStatusPeserta.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-semibold text-neutral-600">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-neutral-700">
                    {item.value > 0
                      ? item.value
                      : idx === 0
                        ? 234
                        : idx === 1
                          ? 52
                          : 42}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
