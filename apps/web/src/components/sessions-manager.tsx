import { trpc } from "@/utils/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import {
  Monitor,
  Smartphone,
  Tablet,
  Trash2,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

function getDeviceIcon(userAgent: string | null) {
  if (!userAgent) return <Monitor className="h-5 w-5" />;

  const ua = userAgent.toLowerCase();
  if (
    ua.includes("mobile") ||
    ua.includes("android") ||
    ua.includes("iphone")
  ) {
    return <Smartphone className="h-5 w-5" />;
  }
  if (ua.includes("tablet") || ua.includes("ipad")) {
    return <Tablet className="h-5 w-5" />;
  }
  return <Monitor className="h-5 w-5" />;
}

function getDeviceName(userAgent: string | null): string {
  if (!userAgent) return "Perangkat Tidak Diketahui";

  const ua = userAgent.toLowerCase();

  // Browser detection
  let browser = "Browser Tidak Diketahui";
  if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("edg")) browser = "Edge";
  else if (ua.includes("opera") || ua.includes("opr")) browser = "Opera";

  // OS detection
  let os = "";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad"))
    os = "iOS";

  return `${browser}${os ? ` di ${os}` : ""}`;
}

export function SessionsManager() {
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revokeAllDialogOpen, setRevokeAllDialogOpen] = useState(false);

  const {
    data: sessions,
    isLoading,
    refetch,
  } = useQuery(trpc.platform.auth.getSessions.queryOptions());

  const revokeMutation = useMutation(
    trpc.platform.auth.revokeSession.mutationOptions({
      onSuccess: () => {
        globalSuccessToast("Sesi berhasil dicabut");
        refetch();
        setRevokeDialogOpen(false);
      },
      onError: (error) => {
        globalErrorToast(error.message);
      },
    }),
  );

  const revokeAllMutation = useMutation(
    trpc.platform.auth.revokeAllSessions.mutationOptions({
      onSuccess: () => {
        globalSuccessToast("Semua sesi berhasil dicabut. Anda akan logout.");
        // Clear tokens and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      },
      onError: (error) => {
        globalErrorToast(error.message);
      },
    }),
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <LoaderCircle className="h-8 w-8 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-['Poppins'] text-[20px] font-semibold text-[#4D4D4D]">
            Sesi Aktif
          </CardTitle>
          <CardDescription className="font-['Poppins'] text-[14px] text-[#64748B]">
            Kelola perangkat yang saat ini memiliki akses ke akun Anda
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {sessions && sessions.length > 0 ? (
            <>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-start justify-between rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      {getDeviceIcon(session.userAgent)}
                    </div>

                    <div className="space-y-1">
                      <div className="font-['Poppins'] text-[16px] font-medium text-[#4D4D4D]">
                        {getDeviceName(session.userAgent)}
                      </div>

                      <div className="space-y-0.5 text-[14px] text-[#64748B]">
                        {session.ipAddress && (
                          <div className="font-['Poppins']">
                            IP: {session.ipAddress}
                          </div>
                        )}

                        {session.lastUsedAt ? (
                          <div className="font-['Poppins']">
                            Terakhir digunakan:{" "}
                            {formatDistanceToNow(new Date(session.lastUsedAt), {
                              addSuffix: true,
                              locale: localeId,
                            })}
                          </div>
                        ) : (
                          <div className="font-['Poppins']">
                            Dibuat:{" "}
                            {formatDistanceToNow(new Date(session.createdAt), {
                              addSuffix: true,
                              locale: localeId,
                            })}
                          </div>
                        )}

                        <div className="font-['Poppins'] text-[12px] text-slate-400">
                          Kadaluarsa:{" "}
                          {new Date(session.expiresAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <AlertDialog
                    open={revokeDialogOpen}
                    onOpenChange={setRevokeDialogOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cabut Sesi?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tindakan ini akan mengeluarkan perangkat ini dari akun
                          Anda. Perangkat perlu login ulang untuk mengakses
                          akun.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            revokeMutation.mutate({ sessionId: session.id })
                          }
                          disabled={revokeMutation.isPending}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {revokeMutation.isPending && (
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Cabut Sesi
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}

              {sessions.length > 1 && (
                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="font-['Poppins'] text-[14px] font-medium text-red-900">
                        Logout dari Semua Perangkat
                      </div>
                      <div className="font-['Poppins'] text-[12px] text-red-700">
                        Ini akan mengeluarkan Anda dari semua perangkat termasuk
                        yang sedang Anda gunakan
                      </div>
                    </div>
                  </div>

                  <AlertDialog
                    open={revokeAllDialogOpen}
                    onOpenChange={setRevokeAllDialogOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Logout Semua
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Logout dari Semua Perangkat?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Tindakan ini akan mengeluarkan Anda dari SEMUA
                          perangkat yang sedang login, termasuk perangkat yang
                          sedang Anda gunakan saat ini. Anda perlu login ulang
                          untuk mengakses akun.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => revokeAllMutation.mutate()}
                          disabled={revokeAllMutation.isPending}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {revokeAllMutation.isPending && (
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Ya, Logout Semua
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center text-slate-500">
              Tidak ada sesi aktif ditemukan
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-blue-600" />
            <div className="space-y-2 font-['Poppins'] text-[14px] text-blue-900">
              <p className="font-medium">Tentang Keamanan Sesi</p>
              <ul className="list-inside list-disc space-y-1 text-[13px]">
                <li>Sesi otomatis kadaluarsa setelah 30 hari tidak aktif</li>
                <li>Token akses diperbarui setiap 15 menit untuk keamanan</li>
                <li>
                  Cabut sesi jika Anda melihat aktivitas yang mencurigakan
                </li>
                <li>Selalu logout dari perangkat bersama atau publik</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
