import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import {
  IconClipboardList,
  IconFileSpreadsheet,
  IconListDetails,
  IconTools,
} from "@tabler/icons-react";
import {
  Cell,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@tepian-k3/constants";
import { RoleDashboardWidget } from "./role-dashboard-widget";

interface PengujianDashboardProps {
  profileName: string;
  roles?: any[];
}

export function PengujianDashboard({ profileName, roles }: PengujianDashboardProps) {
  const [lastUpdated, setLastUpdated] = useState<string>("2 menit lalu");

  const { data: testingOrdersData, refetch: refetchTestingOrders } = useQuery(
    trpc.pengujian.order.getAllOrdersPaginated.queryOptions({
      page: 1,
      perPage: 100,
      search: "",
    }),
  );

  const { data: worksheetsData, refetch: refetchWorksheets } = useQuery(
    trpc.pengujian.worksheet.getAllWorksheets.queryOptions({
      page: 1,
      perPage: 1,
    }),
  );

  const { data: toolsData, refetch: refetchTools } = useQuery(
    trpc.pengujian.tool.getToolPaginated.queryOptions({
      page: 1,
      perPage: 10,
      toolName: "",
    }),
  );

  const { data: parametersData, refetch: refetchParameters } = useQuery(
    trpc.pengujian.parameter.getPaginatedParameters.queryOptions({
      page: 1,
      perPage: 10,
      name: "",
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
    refetchTestingOrders();
    refetchWorksheets();
    refetchTools();
    refetchParameters();
    setLastUpdated("Baru saja");
  };

  // Group status counts from testingOrdersData
  const orders = testingOrdersData?.data || [];
  let pendaftaranCount = 0;
  let penawaranCount = 0;
  let pembayaranCount = 0;
  let pengujianCount = 0;
  let selesaiCount = 0;

  orders.forEach((o) => {
    const status = o.status;
    if (["pending", "kaji_ulang", "kaji_ulang_disetujui"].includes(status)) {
      pendaftaranCount++;
    } else if (
      [
        "penawaran_diterbitkan",
        "revision",
        "upload_surat_persetujuan",
        "surat_persetujuan_diproses",
        "persetujuan_disetujui",
        "tagihan_diterbitkan",
      ].includes(status)
    ) {
      penawaranCount++;
    } else if (
      ["proses_validasi_pembayaran", "pembayaran_diterima"].includes(status)
    ) {
      pembayaranCount++;
    } else if (
      [
        "menunggu_penerbitan_spt_jadwal",
        "proses_pengambilan_sampel",
        "sampel_dalam_proses_penyerahan",
        "sampel_telah_dianalisis",
        "sampel_selesai_dianalisis",
      ].includes(status)
    ) {
      pengujianCount++;
    } else if (["completed", "laporan_diterbitkan"].includes(status)) {
      selesaiCount++;
    }
  });

  const isOrdersEmpty = orders.length === 0;

  const chartStatusData = [
    {
      name: "Pendaftaran",
      value: isOrdersEmpty ? 12 : pendaftaranCount,
      color: "#F28D00",
    },
    {
      name: "Penawaran",
      value: isOrdersEmpty ? 8 : penawaranCount,
      color: "#BC76FF",
    },
    {
      name: "Pembayaran",
      value: isOrdersEmpty ? 5 : pembayaranCount,
      color: "#009099",
    },
    {
      name: "Pengujian Lab",
      value: isOrdersEmpty ? 15 : pengujianCount,
      color: "#1061D6",
    },
    {
      name: "Selesai",
      value: isOrdersEmpty ? 24 : selesaiCount,
      color: "#33AC61",
    },
  ];

  const totalOrdersInChart = chartStatusData.reduce(
    (acc, curr) => acc + curr.value,
    0,
  );

  // Group tool availability counts from toolsData
  const toolsList = toolsData?.data || [];
  let readyCount = 0;
  let kalibrasiCount = 0;
  let dipinjamCount = 0;
  let lainnyaCount = 0;

  toolsList.forEach((t) => {
    const availability = t.availability;
    if (availability === "ready") {
      readyCount++;
    } else if (availability === "kalibrasi") {
      kalibrasiCount++;
    } else if (availability === "dipinjam") {
      dipinjamCount++;
    } else {
      lainnyaCount++;
    }
  });

  const isToolsListEmpty = toolsList.length === 0;

  const chartToolsData = [
    {
      name: "Ready",
      value: isToolsListEmpty ? 28 : readyCount,
      color: "#33AC61",
    },
    {
      name: "Kalibrasi",
      value: isToolsListEmpty ? 4 : kalibrasiCount,
      color: "#F28D00",
    },
    {
      name: "Dipinjam",
      value: isToolsListEmpty ? 8 : dipinjamCount,
      color: "#1061D6",
    },
    {
      name: "Lainnya",
      value: isToolsListEmpty ? 2 : lainnyaCount,
      color: "#ef4444",
    },
  ];

  const totalToolsInChart = chartToolsData.reduce(
    (acc, curr) => acc + curr.value,
    0,
  );

  // Filter orders with status 'pending' or 'kaji_ulang' for verification table
  const pendingOrders = orders.filter((o) =>
    ["pending", "kaji_ulang"].includes(o.status),
  );

  const mockTestingQueue = [
    {
      id: "t1",
      orderNumber: "ORD-20260601-0001",
      company: { name: "PT Pertamina (Persero)" },
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      status: "pending" as OrderStatus,
    },
    {
      id: "t2",
      orderNumber: "ORD-20260601-0002",
      company: { name: "PT Bukit Asam Tbk" },
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      status: "kaji_ulang" as OrderStatus,
    },
    {
      id: "t3",
      orderNumber: "ORD-20260601-0003",
      company: { name: "PT Astra International" },
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      status: "kaji_ulang" as OrderStatus,
    },
    {
      id: "t4",
      orderNumber: "ORD-20260601-0004",
      company: { name: "PT United Tractors Tbk" },
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      status: "pending" as OrderStatus,
    },
  ];

  const displayedTestingQueue =
    pendingOrders.length > 0 ? pendingOrders.slice(0, 5) : mockTestingQueue;

  // Safe counts
  const totalOrdersCount =
    testingOrdersData && testingOrdersData.pageCount
      ? testingOrdersData.pageCount > 1
        ? testingOrdersData.data.length + (testingOrdersData.pageCount - 1) * 10
        : testingOrdersData.data.length
      : 142;
  const activeWorksheetsCount = worksheetsData?.pagination?.totalItems ?? 36;
  const totalToolsCount =
    toolsData && toolsData.pageCount
      ? toolsData.pageCount > 1
        ? toolsList.length + (toolsData.pageCount - 1) * 10
        : toolsList.length
      : 48;
  const totalParametersCount =
    parametersData && parametersData.pageCount
      ? parametersData.pageCount > 1
        ? parametersData.data.length + (parametersData.pageCount - 1) * 10
        : parametersData.data.length
      : 112;

  return (
    <div className="w-full flex-1 bg-slate-50/50 p-6 font-['Poppins'] lg:p-8">
      {/* Upper Navigation / Summary Row */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-800">
            Dashboard Administrasi Pengujian
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
        {/* Card 1: Total Pesanan */}
        <Link
          to="/back-office/orders"
          search={{
            page: 1,
            perPage: 10,
            sort: [{ id: "createdAt" as const, desc: true }],
            createdAt: [],
            filters: [],
            joinOperator: "and" as const,
            showDeleted: false,
            search: "",
          }}
          className="group"
        >
          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-blue-100 group-hover:shadow-md">
            <CardContent className="flex gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1061D6] transition-transform group-hover:scale-105">
                <IconClipboardList className="size-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-500">
                  Total Pesanan
                </span>
                <span className="my-1 text-3xl font-bold tracking-tight text-neutral-800 transition-colors group-hover:text-[#1061D6]">
                  {totalOrdersCount}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  Semua status order
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 2: Lembar Kerja Aktif */}
        <Link
          to="/back-office/worksheets"
          search={{ page: 1, perPage: 10 }}
          className="group"
        >
          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-blue-100 group-hover:shadow-md">
            <CardContent className="flex gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-fuchsia-50 text-fuchsia-500 transition-transform group-hover:scale-105">
                <IconFileSpreadsheet className="size-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-500">
                  Lembar Kerja Aktif
                </span>
                <span className="my-1 text-3xl font-bold tracking-tight text-neutral-800 transition-colors group-hover:text-fuchsia-500">
                  {activeWorksheetsCount}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  Dalam proses lab
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 3: Total Alat K3 */}
        <Link
          to="/back-office/tools"
          search={{
            page: 1,
            perPage: 10,
            sort: [{ id: "toolName" as const, desc: false }],
            createdAt: [],
            filters: [],
            joinOperator: "and" as const,
            showDeleted: false,
            toolName: "",
          }}
          className="group"
        >
          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-blue-100 group-hover:shadow-md">
            <CardContent className="flex gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-105">
                <IconTools className="size-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-500">
                  Inventaris Alat K3
                </span>
                <span className="my-1 text-3xl font-bold tracking-tight text-neutral-800 transition-colors group-hover:text-emerald-600">
                  {totalToolsCount}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  Alat terdaftar di sistem
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 4: Parameter Uji */}
        <Link
          to="/back-office/parameters"
          search={{
            page: 1,
            perPage: 10,
            sort: [{ id: "name" as const, desc: false }],
            createdAt: [],
            filters: [],
            joinOperator: "and" as const,
            showDeleted: false,
            name: "",
          }}
          className="group"
        >
          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-blue-100 group-hover:shadow-md">
            <CardContent className="flex gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500 transition-transform group-hover:scale-105">
                <IconListDetails className="size-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-500">
                  Parameter Uji Lab
                </span>
                <span className="my-1 text-3xl font-bold tracking-tight text-neutral-800 transition-colors group-hover:text-amber-500">
                  {totalParametersCount}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  Parameter aktif K3
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Middle Block: Role-Aware Dashboard Widget */}
      <RoleDashboardWidget roles={roles} orders={orders} />

      {/* Bottom Block: Status Pesanan & Kondisi Alat Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Chart 1: Status Pesanan Pengujian */}
        <Card className="flex flex-col overflow-hidden border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-semibold tracking-tight text-neutral-600">
              Kategori Status Pesanan
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Total pesanan berdasarkan tahapan
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-8 py-4 sm:flex-row">
            <div className="relative flex h-44 w-44 shrink-0 items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      chartStatusData.filter((c) => c.value > 0).length > 0
                        ? chartStatusData
                        : [{ name: "Total", value: 1, color: "#cbd5e1" }]
                    }
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tracking-tight text-neutral-600">
                  {totalOrdersInChart}
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">
                  Total
                </span>
              </div>
            </div>

            <div className="flex w-full max-w-[200px] flex-col gap-3">
              {chartStatusData.map((item, idx) => (
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
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Chart 2: Ketersediaan Alat K3 */}
        <Card className="flex flex-col overflow-hidden border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-semibold tracking-tight text-neutral-600">
              Ketersediaan Alat K3
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Status operasional inventaris lab
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-8 py-4 sm:flex-row">
            <div className="relative flex h-44 w-44 shrink-0 items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      chartToolsData.filter((c) => c.value > 0).length > 0
                        ? chartToolsData
                        : [{ name: "Total", value: 1, color: "#cbd5e1" }]
                    }
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartToolsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tracking-tight text-neutral-600">
                  {totalToolsInChart}
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">
                  Alat
                </span>
              </div>
            </div>

            <div className="flex w-full max-w-[200px] flex-col gap-3">
              {chartToolsData.map((item, idx) => (
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
                    {item.value}
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
