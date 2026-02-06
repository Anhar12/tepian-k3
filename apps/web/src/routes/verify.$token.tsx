import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Shield,
  Clock,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Calendar,
  User,
  Building2,
  FileCheck,
  Download,
} from "lucide-react";
import { trpc } from "@/utils/trpc";
import { pageHead } from "@/utils/page-head";
import type { DocumentStatus } from "@tepian-k3/constants";
import { useQuery } from "@tanstack/react-query";
import { getPublicUrl } from "@/utils/url";

export const Route = createFileRoute("/verify/$token")({
  component: RouteComponent,
  head: () => pageHead("Verifikasi Dokumen", "Verifikasi keaslian dokumen"),
});

function RouteComponent() {
  const { token } = Route.useParams();

  // Public tRPC query - no auth required
  const verificationQuery = useQuery(
    trpc.document.verifyDocument.queryOptions({
      token,
      checkFileIntegrity: true,
    }),
  );

  const document = verificationQuery.data?.document;
  const isValid = verificationQuery.data?.isValid;

  // Loading state
  if (verificationQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 to-indigo-50 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold">
                Memverifikasi Dokumen...
              </h2>
              <p className="text-sm text-muted-foreground">
                Mohon tunggu, kami sedang memverifikasi keaslian dokumen ini
              </p>
              <div className="pt-4">
                <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full animate-pulse bg-blue-600"
                    style={{ width: "60%" }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (verificationQuery.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-red-50 to-orange-50 p-4">
        <Card className="w-full max-w-md border-red-200 shadow-xl">
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-red-900">
                Verifikasi Gagal
              </h2>
              <p className="text-sm text-red-700">
                {verificationQuery.error.message ||
                  "Tidak dapat memverifikasi dokumen"}
              </p>
              <Separator />
              <div className="space-y-2 text-left text-sm text-muted-foreground">
                <p>Kemungkinan penyebab:</p>
                <ul className="list-inside list-disc space-y-1">
                  <li>Token verifikasi tidak valid atau sudah kadaluarsa</li>
                  <li>Dokumen telah dihapus dari sistem</li>
                  <li>Link verifikasi sudah tidak aktif</li>
                </ul>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.reload()}
              >
                Coba Lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid document state
  if (!isValid || !document) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-yellow-50 to-amber-50 p-4">
        <Card className="w-full max-w-md border-yellow-200 shadow-xl">
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold text-yellow-900">
                Dokumen Tidak Valid
              </h2>
              <p className="text-sm text-yellow-700">
                Dokumen ini tidak dapat diverifikasi atau telah mengalami
                perubahan
              </p>
              <Alert className="border-yellow-300 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Peringatan:</strong> Dokumen mungkin tidak asli atau
                  telah dimodifikasi setelah ditandatangani.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Status configuration
  const statusConfig: Record<
    DocumentStatus,
    {
      color: string;
      icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
      label: string;
    }
  > = {
    draft: {
      color: "bg-gray-500",
      icon: FileText,
      label: "Draft",
    },
    pending_signature: {
      color: "bg-yellow-500",
      icon: Clock,
      label: "Menunggu Tanda Tangan",
    },
    signed: {
      color: "bg-green-500",
      icon: Shield,
      label: "Ditandatangani",
    },
    verified: {
      color: "bg-blue-500",
      icon: CheckCircle2,
      label: "Terverifikasi",
    },
    rejected: {
      color: "bg-red-500",
      icon: XCircle,
      label: "Ditolak",
    },
  };

  const status = statusConfig[document.status] || statusConfig.draft;
  const StatusIcon = status.icon;

  // Valid document display
  return (
    <div className="min-h-screen overflow-y-auto bg-linear-to-br from-green-50 to-emerald-50 px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Success Alert */}
        <Alert className="border-green-500 bg-green-50 shadow-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-lg font-semibold text-green-900">
            ✓ Dokumen Terverifikasi
          </AlertTitle>
          <AlertDescription className="text-green-800">
            Dokumen ini telah diverifikasi secara kriptografis dan merupakan
            dokumen asli yang dikeluarkan oleh <strong>Tepian K3</strong>
          </AlertDescription>
        </Alert>

        {/* Main Document Card */}
        <Card className="pt-0 shadow-xl">
          <CardHeader className="rounded-t-2xl bg-linear-to-r from-blue-500 to-indigo-600 pt-6 text-white">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-6 w-6" />
                  <CardTitle className="text-2xl">{document.title}</CardTitle>
                </div>
                <CardDescription className="text-blue-100">
                  Nomor Dokumen: <strong>{document.documentNumber}</strong>
                </CardDescription>
              </div>
              <Badge className={`${status.color} text-white`}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {status.label}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Document Information */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <FileText className="h-5 w-5 text-blue-600" />
                Informasi Dokumen
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Jenis Dokumen</p>
                  <p className="font-medium capitalize">
                    {document.type.replace("_", " ")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Nama File</p>
                  <p className="font-medium">{document.fileName}</p>
                </div>
                {document.fileSize && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Ukuran File</p>
                    <p className="font-medium">
                      {(document.fileSize / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}
                {document.entityType && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Tipe Entitas
                    </p>
                    <p className="flex items-center gap-2 font-medium capitalize">
                      <Building2 className="h-4 w-4" />
                      {document.entityType}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Signature Information */}
            {document.signedAt && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                  <Shield className="h-5 w-5 text-green-600" />
                  Informasi Tanda Tangan
                </h3>
                <div className="space-y-3 rounded-lg bg-green-50 p-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-1 h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Tanggal Ditandatangani
                      </p>
                      <p className="font-medium">
                        {new Date(document.signedAt).toLocaleDateString(
                          "id-ID",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                  {document.signedBy && (
                    <div className="flex items-start gap-3">
                      <User className="mt-1 h-4 w-4 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          Ditandatangani Oleh
                        </p>
                        <p className="font-medium">{document.signedBy.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {document.description && (
              <>
                <Separator />
                <div>
                  <h3 className="mb-2 text-lg font-semibold">Deskripsi</h3>
                  <p className="text-sm text-muted-foreground">
                    {document.description}
                  </p>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <Separator />
            <div className="flex flex-wrap gap-3">
              {document.fileUrl && (
                <Button asChild className="flex-1 sm:flex-none">
                  <a
                    href={getPublicUrl(document.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Dokumen
                  </a>
                </Button>
              )}
              <Button variant="outline" asChild className="flex-1 sm:flex-none">
                <Link to="/">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Kunjungi Website
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Information */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-blue-600" />
              Bagaimana Verifikasi Bekerja?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <p>
                  Setiap dokumen ditandatangani secara digital menggunakan
                  teknologi kriptografi JWT (JSON Web Token)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <p>
                  Tanda tangan mencakup hash SHA-256 dari konten file untuk
                  memastikan integritas dokumen
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <p>
                  Setiap perubahan pada dokumen akan membuat tanda tangan
                  menjadi tidak valid
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <p>
                  Semua aktivitas verifikasi dicatat dalam sistem untuk tujuan
                  audit
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Disclaimer */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm font-semibold">Disclaimer</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            Dokumen ini merupakan dokumen elektronik yang sah dan memiliki
            kekuatan hukum sesuai dengan Undang-Undang Nomor 11 Tahun 2008
            tentang Informasi dan Transaksi Elektronik (UU ITE). Verifikasi ini
            hanya memastikan keaslian dan integritas dokumen, bukan menjamin
            kebenaran substansi isi dokumen.
          </AlertDescription>
        </Alert>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Dokumen diverifikasi pada:{" "}
            {new Date().toLocaleDateString("id-ID", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="mt-1">
            Powered by <strong>Tepian K3</strong> Document Verification System
          </p>
        </div>
      </div>
    </div>
  );
}
