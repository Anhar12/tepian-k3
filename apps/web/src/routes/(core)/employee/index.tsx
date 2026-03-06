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
      perPage: 1,
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

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Welcome Card */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          {isLoading ? (
            <>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </>
          ) : (
            <>
              <CardTitle>Selamat Datang, {profile?.name}!</CardTitle>
              <CardDescription>
                Dashboard karyawan — kelola pekerjaan Anda dari sini
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          <Button asChild size="sm" variant="outline">
            <Link to="/back-office">Ke Back Office</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Employee Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profil Karyawan</CardTitle>
          <CardDescription>Informasi data diri Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {isEmployeeProfileLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            ) : employeeProfile ? (
              <div className="space-y-2">
                <p>Nama: {employeeProfile.name}</p>
                <p>Posisi: {employeeProfile.position?.name}</p>
              </div>
            ) : (
              "Data profil karyawan tidak tersedia."
            )}
          </p>
        </CardContent>
      </Card>

      {/* Active Worksheets */}
      <PermissionGate permission="worksheets.view">
        <Card>
          <CardHeader>
            <CardTitle>Worksheet Aktif</CardTitle>
            <CardDescription>Pekerjaan yang sedang berjalan</CardDescription>
          </CardHeader>
          <CardContent>
            {isWorksheetLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">
                {worksheetData?.pagination?.totalItems ?? 0}
              </p>
            )}
          </CardContent>
        </Card>
      </PermissionGate>

      {/* Recent Testings */}
      <PermissionGate permission="testing.view">
        <Card>
          <CardHeader>
            <CardTitle>Pengujian Terbaru</CardTitle>
            <CardDescription>Aktivitas pengujian terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            {isTestingsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : testingsData?.data?.length ? (
              <ul className="space-y-2">
                {testingsData.data.map((testing) => (
                  <li
                    key={testing.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-mono text-xs">
                      {testing.testingNumber}
                    </span>
                    <Badge className={`text-xs`} variant="outline">
                      {TESTING_STATUS_LABELS[testing.status as TestingStatus]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(testing.createdAt, "dd MMM")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Belum ada aktivitas pengujian.
              </p>
            )}
          </CardContent>
        </Card>
      </PermissionGate>
    </div>
  );
}
