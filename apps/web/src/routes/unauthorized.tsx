import { Button } from "@/components/ui/button";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ShieldX } from "lucide-react";

export const Route = createFileRoute("/unauthorized")({
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center space-y-6 text-center">
        <div className="rounded-full bg-destructive/10 p-6">
          <ShieldX className="h-16 w-16 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">403</h1>
          <h2 className="text-2xl font-semibold">Akses Ditolak</h2>
          <p className="max-w-md text-muted-foreground">
            Anda tidak memiliki izin untuk mengakses halaman ini. Silakan
            hubungi administrator jika Anda merasa ini adalah kesalahan.
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => router.history.back()}>
            Kembali
          </Button>
          <Button onClick={() => router.navigate({ to: "/dashboard" })}>
            Ke Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
