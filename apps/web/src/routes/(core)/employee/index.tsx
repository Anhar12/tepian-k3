import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGate } from "@/components/permission-gate";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { pageHead } from "@/utils/page-head";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TESTING_STATUS_LABELS,
  type TestingStatus,
} from "@tepian-k3/constants";
import { format } from "date-fns";
import {
  IconClipboardList,
  IconFlask,
  IconMicroscope,
  IconAlertCircle,
} from "@tabler/icons-react";

export const Route = createFileRoute("/(core)/employee/")({
  component: RouteComponent,
  head: () => pageHead("Dashboard Karyawan"),
});

function RouteComponent() {
  const { data: profile, isLoading } = useQuery(
    trpc.platform.auth.profile.queryOptions(),
  );

  const { data: employeeProfile, isLoading: isEmployeeProfileLoading } =
    useQuery(trpc.platform.employee.getMyProfile.queryOptions());

  const { data: worksheetData, isLoading: isWorksheetLoading } = useQuery({
    ...trpc.pengujian.worksheet.getAllWorksheets.queryOptions({
      page: 1,
      perPage: 10,
      status: "in_progress",
    }),
    enabled: !!profile && profile.permissions.includes("worksheets.view"),
  });

  const { data: testingsData, isLoading: isTestingsLoading } = useQuery({
    ...trpc.pengujian.testing.getAllTestings.queryOptions({
      page: 1,
      perPage: 5,
    }),
    enabled: !!profile && profile.permissions.includes("testing.view"),
  });

  const roles = profile?.roles?.map((r: any) => typeof r === "string" ? r : r.name) || [];

  const isPetugasSampling = roles.includes("petugas_sampling");
  const isPetugasLaboratorium = roles.includes("petugas_laboratorium");
  const isPenyelia = roles.includes("penyelia");

  return (
    <div className="w-full flex-1 bg-slate-50/50 p-6 font-['Poppins'] lg:p-8">
      {/* Upper Navigation / Summary Row */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-800">
            Dashboard Karyawan
          </h1>
          {isLoading ? (
            <Skeleton className="mt-2 h-4 w-48" />
          ) : (
            <p className="mt-1 text-sm text-slate-500">
              Selamat datang kembali, {profile?.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-2 shadow-sm outline outline-1 outline-slate-200">
          <span className="text-sm font-medium text-neutral-600">
            {new Intl.DateTimeFormat("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date())}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Role-Specific Widgets */}
        
        {isPetugasSampling && (
          <Card className="md:col-span-2 lg:col-span-3 border-orange-200 shadow-sm">
            <CardHeader className="bg-orange-50/50 pb-4 border-b border-orange-100">
              <div className="flex items-center gap-2">
                <IconClipboardList className="text-orange-500 size-6" />
                <CardTitle className="text-orange-800">Tugas Sampling Hari Ini</CardTitle>
              </div>
              <CardDescription>
                Daftar pengujian lapangan yang harus dilakukan hari ini
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isWorksheetLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : worksheetData?.data?.length ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {worksheetData.data.slice(0, 3).map((ws) => (
                    <div key={ws.id} className="rounded-lg border border-slate-200 p-4 transition-shadow hover:shadow-md">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                          Siap Sampling
                        </Badge>
                        <span className="text-xs text-slate-400 font-mono">
                          {"WS-" + ws.id.substring(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 line-clamp-1 mb-1">
                        {ws.testing?.order?.company?.name || "Perusahaan tidak diketahui"}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                        Tugas sampling berjalan
                      </p>
                      <Button asChild size="sm" variant="outline" className="w-full">
                        <Link to="/employee/worksheets" search={{ page: 1, perPage: 10 }}>Buka Detail →</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="rounded-full bg-slate-100 p-3 mb-3">
                    <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-500">Tidak ada jadwal sampling aktif hari ini.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isPetugasLaboratorium && (
          <Card className="md:col-span-2 lg:col-span-3 border-blue-200 shadow-sm">
            <CardHeader className="bg-blue-50/50 pb-4 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <IconFlask className="text-blue-500 size-6" />
                <CardTitle className="text-blue-800">Antrean Uji Lab</CardTitle>
              </div>
              <CardDescription>
                Worksheet yang membutuhkan input hasil pengujian Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isWorksheetLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : worksheetData?.data?.length ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {worksheetData.data.slice(0, 3).map((ws) => (
                    <div key={ws.id} className="rounded-lg border border-slate-200 p-4 transition-shadow hover:shadow-md">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                          In Progress
                        </Badge>
                        <span className="text-xs text-slate-400 font-mono">
                          {"WS-" + ws.id.substring(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 line-clamp-1 mb-1">
                        {ws.testing?.order?.company?.name || "Perusahaan tidak diketahui"}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                          Worksheet pengujian aktif
                        </span>
                        <Button asChild size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <Link to="/employee/worksheets" search={{ page: 1, perPage: 10 }}>Input Hasil →</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="rounded-full bg-slate-100 p-3 mb-3">
                    <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-500">Tidak ada antrean uji lab saat ini.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isPenyelia && (
          <Card className="md:col-span-2 lg:col-span-3 border-fuchsia-200 shadow-sm">
            <CardHeader className="bg-fuchsia-50/50 pb-4 border-b border-fuchsia-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconMicroscope className="text-fuchsia-500 size-6" />
                  <CardTitle className="text-fuchsia-800">Supervisi Pengujian</CardTitle>
                </div>
                <Badge variant="destructive" className="flex items-center gap-1">
                  <IconAlertCircle className="size-3" />
                  Perhatian Khusus
                </Badge>
              </div>
              <CardDescription>
                Worksheet yang membutuhkan verifikasi & supervisi Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isWorksheetLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : worksheetData?.data?.length ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {worksheetData.data.slice(0, 3).map((ws) => (
                    <div key={ws.id} className="rounded-lg border border-slate-200 p-4 transition-shadow hover:shadow-md bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="text-fuchsia-600 border-fuchsia-200 bg-fuchsia-50">
                          Menunggu Verifikasi
                        </Badge>
                        <span className="text-xs text-slate-400 font-mono">
                          {"WS-" + ws.id.substring(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 line-clamp-1 mb-1">
                        {ws.testing?.order?.company?.name || "Perusahaan tidak diketahui"}
                      </p>
                      <div className="mt-4">
                        <Button asChild size="sm" className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white">
                          <Link to="/employee/worksheets" search={{ page: 1, perPage: 10 }}>Tinjau Data Lab →</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="rounded-full bg-slate-100 p-3 mb-3">
                    <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-500">Semua worksheet sudah tersupervisi dengan baik.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Generic Profile Info */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Profil Karyawan</CardTitle>
            <CardDescription>Informasi data diri Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-600">
              {isEmployeeProfileLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              ) : employeeProfile ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-slate-400">Nama</p>
                    <p className="font-medium text-slate-800">{employeeProfile.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">Posisi</p>
                    <p className="font-medium text-slate-800">{employeeProfile.position?.name || "-"}</p>
                  </div>
                  <div className="pt-2">
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <Link to="/back-office">Ke Back Office Dashboard</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                "Data profil karyawan tidak tersedia."
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Worksheets Generic */}
        <PermissionGate permission="worksheets.view">
          <Card className="shadow-sm hover:border-slate-300 transition-colors cursor-pointer group">
            <Link to="/employee/worksheets" search={{ page: 1, perPage: 10 }} className="block h-full">
              <CardHeader>
                <CardTitle className="group-hover:text-primary transition-colors">Worksheet Aktif</CardTitle>
                <CardDescription>Pekerjaan yang sedang berjalan</CardDescription>
              </CardHeader>
              <CardContent>
                {isWorksheetLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="text-4xl font-bold text-slate-800">
                      {worksheetData?.pagination?.totalItems ?? 0}
                    </p>
                    <span className="text-sm font-medium text-slate-500">Dokumen</span>
                  </div>
                )}
              </CardContent>
            </Link>
          </Card>
        </PermissionGate>

        {/* Recent Testings */}
        <PermissionGate permission="testing.view">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Pengujian Terbaru</CardTitle>
              <CardDescription>Aktivitas pengujian terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              {isTestingsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : testingsData?.data?.length ? (
                <ul className="space-y-3">
                  {testingsData.data.map((testing) => (
                    <li
                      key={testing.id}
                      className="flex items-center justify-between text-sm group"
                    >
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-medium text-slate-700">
                          {testing.testingNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {format(testing.createdAt, "dd MMM yyyy")}
                        </span>
                      </div>
                      <Badge className="text-[10px]" variant="secondary">
                        {TESTING_STATUS_LABELS[testing.status as TestingStatus]}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-500">Belum ada aktivitas pengujian.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </PermissionGate>
      </div>
    </div>
  );
}
