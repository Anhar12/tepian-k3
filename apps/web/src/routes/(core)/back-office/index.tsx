import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { pageHead } from "@/utils/page-head";
import { trpc } from "@/utils/trpc";
import { EMPLOYEE_ROLES } from "@tepian-k3/constants";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/(core)/back-office/")({
  component: RouteComponent,
  head: () => pageHead("Back Office"),
});

function RouteComponent() {
  const { data: profile } = useSuspenseQuery(
    trpc.platform.auth.profile.queryOptions(),
  );

  const isEmployee = profile.roles.some(
    (r) =>
      (EMPLOYEE_ROLES as readonly string[]).includes(r.name) ||
      (r.name !== "user" &&
        r.name !== "admin" &&
        r.name !== "super_admin" &&
        r.name !== "viewer"),
  );

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Selamat Datang, {profile.name}!</CardTitle>
          <CardDescription>Mulai kelola sistem Anda dari sini</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Ini adalah dashboard utama Anda. Mulai jelajahi fitur-fitur yang
            tersedia.
          </p>
          {isEmployee && (
            <Link to="/employee">
              <Button variant="outline" size="sm">
                Buka Dashboard Karyawan
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistik Cepat</CardTitle>
          <CardDescription>Ringkasan sekilas</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">Total item</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Terbaru</CardTitle>
          <CardDescription>Yang sedang terjadi</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tidak ada aktivitas terbaru
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
