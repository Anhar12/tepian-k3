import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { pageHead } from "@/utils/page-head";
import { useDashboardStore } from "@/stores/dashboard.stores";
import { IconFlask, IconBook, IconArrowRight, IconClipboardList } from "@tabler/icons-react";
import { PengujianOnboardingWizard } from "@/components/pengujian-onboarding-wizard";
import { Button } from "@/components/ui/button";
import { ContactHelp } from "@/components/contact-help";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/(core)/dashboard/")({
  component: RouteComponent,
  head: () => pageHead("Dashboard"),
});

function RouteComponent() {
  const { data: profile } = useSuspenseQuery(
    trpc.platform.auth.profile.queryOptions(),
  );
  
  const { data: companies, isLoading: isLoadingCompanies } = useQuery(
    trpc.pengujian.userCompany.getAllUserCompaniesByUserId.queryOptions()
  );

  const { data: activeOrders, isLoading: isLoadingOrders } = useQuery(
    trpc.pengujian.order.getAllOrders.queryOptions({
      status: "all"
    })
  );

  const { activeMode, setActiveMode } = useDashboardStore();
  const navigate = useNavigate();

  // If Pelatihan dashboard mode is active, automatically redirect to its route
  React.useEffect(() => {
    if (activeMode === "pelatihan") {
      navigate({ to: "/dashboard/pelatihan", search: { tab: "profil" } });
    }
  }, [activeMode, navigate]);

  // Render Premium Portal Screen if mode is null (not yet selected)
  if (activeMode === null) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center font-['Poppins']">
        <div className="max-w-2xl space-y-3">
          <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-extrabold tracking-tight text-slate-800">
            Pilih Dashboard Layanan Anda
          </h1>
          <p className="text-sm text-slate-500">
            Selamat datang kembali,{" "}
            <span className="font-bold text-slate-800">{profile.name}</span>!
            Silakan pilih layanan K3 yang ingin Anda kelola hari ini.
          </p>
        </div>

        <div className="mt-10 grid w-full max-w-4xl gap-6 md:grid-cols-2">
          {/* Layanan Pengujian Card */}
          <button
            type="button"
            onClick={() => {
              setActiveMode("pengujian");
            }}
            className="group relative flex cursor-pointer flex-col rounded-3xl border border-slate-100 bg-white p-8 text-left shadow-sm transition-all duration-300 outline-none hover:-translate-y-1.5 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1061D6] transition-transform duration-300 group-hover:scale-110">
              <IconFlask className="size-6" />
            </div>
            <h3 className="mt-6 font-['Plus_Jakarta_Sans'] text-lg font-bold text-slate-800 transition-colors group-hover:text-[#1061D6]">
              Layanan Pengujian K3
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Pantau status pendaftaran pengujian K3 perusahaan Anda, kelola
              data lokasi pengujian, verifikasi hasil, dan unduh sertifikat
              resmi.
            </p>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-[#1061D6] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span>Masuk Dashboard</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </button>

          {/* Layanan Pelatihan Card */}
          <button
            type="button"
            onClick={() => {
              setActiveMode("pelatihan");
            }}
            className="group relative flex cursor-pointer flex-col rounded-3xl border border-slate-100 bg-white p-8 text-left shadow-sm transition-all duration-300 outline-none hover:-translate-y-1.5 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1061D6] transition-transform duration-300 group-hover:scale-110">
              <IconBook className="size-6" />
            </div>
            <h3 className="mt-6 font-['Plus_Jakarta_Sans'] text-lg font-bold text-slate-800 transition-colors group-hover:text-[#1061D6]">
              Layanan Pelatihan K3
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Ikuti kelas e-learning mandiri, pantau jadwal Bimtek & Webinar K3,
              kerjakan kuis kelulusan, dan unduh sertifikat pelatihan Anda.
            </p>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-[#1061D6] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span>Masuk Dashboard</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingCompanies) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[300px] w-full rounded-2xl" />
          <Skeleton className="h-[300px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // If user doesn't have any company registered, show Onboarding Wizard
  const hasCompany = companies && companies.length > 0;
  
  if (!hasCompany) {
    return <PengujianOnboardingWizard />;
  }

  const currentDate = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const totalOrders = activeOrders?.length || 0;

  // Active dashboard structure for users with a company
  return (
    <div className="space-y-6 font-['Poppins']">
      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <CardContent className="p-8 md:p-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <p className="text-blue-100 text-sm">{currentDate}</p>
              <h2 className="text-3xl font-bold">Selamat Datang, {profile.name}!</h2>
              <p className="text-blue-50 max-w-xl text-sm leading-relaxed">
                Kelola pendaftaran pengujian K3, pantau status, dan unduh hasil laporan perusahaan Anda melalui dashboard terpadu ini.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button asChild variant="secondary" className="w-full sm:w-auto font-semibold gap-2">
                <Link to="/pengujian">
                  Ajukan Pengujian
                  <IconArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-2xl border-slate-100 shadow-sm md:col-span-2">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Pesanan Aktif</CardTitle>
                <CardDescription>Status pengujian yang sedang berjalan</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                <Link to="/pengujian/transaksi">
                  Lihat Semua
                  <IconArrowRight className="size-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingOrders ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : totalOrders > 0 && activeOrders ? (
              <div className="divide-y divide-slate-100">
                {activeOrders.slice(0, 3).map((order) => (
                  <div key={order.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{order.orderNumber}</p>
                      <p className="text-xs text-slate-500 truncate">{companies?.find(c => c.id === order.companyId)?.name || 'Pesanan Pengujian'}</p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/pengujian/status" search={{ orderId: order.id }}>
                        Cek Status
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <IconClipboardList className="size-6 text-slate-400" />
                </div>
                <h3 className="font-medium text-slate-800 mb-1">Belum Ada Pesanan</h3>
                <p className="text-sm text-slate-500 mb-4 max-w-[250px]">
                  Anda belum memiliki pesanan pengujian yang sedang berjalan.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/pengujian">
                    Mulai Pendaftaran
                    <IconArrowRight className="size-4 ml-1" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-2xl border-slate-100 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg">Statistik Pengujian</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-sm font-medium text-blue-600 mb-1">Berjalan</p>
                  <p className="text-3xl font-bold text-slate-800">{totalOrders}</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <p className="text-sm font-medium text-emerald-600 mb-1">Selesai</p>
                  <p className="text-3xl font-bold text-slate-800">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ContactHelp className="mt-8 rounded-2xl border-slate-100 shadow-sm" />
    </div>
  );
}

