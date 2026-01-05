import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(core)/dashboard/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: profile } = useSuspenseQuery(trpc.auth.profile.queryOptions());

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Selamat Datang, {profile.name}!</CardTitle>
          <CardDescription>Mulai kelola sistem Anda dari sini</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ini adalah dashboard utama Anda. Mulai jelajahi fitur-fitur yang
            tersedia.
          </p>
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
