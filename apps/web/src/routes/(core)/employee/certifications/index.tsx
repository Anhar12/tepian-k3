import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/utils/page-head";
import { IconCertificate, IconUpload } from "@tabler/icons-react";
import useDialogs from "@/hooks/use-dialog";
import UploadCertificationDialog from "./-components/upload-certification-dialog";
import { CertificationCard } from "./-components/certification-card";
import { CertificationListSkeleton } from "./-components/certification-list-skeleton";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/(core)/employee/certifications/")({
  component: RouteComponent,
  head: () => pageHead("Sertifikasi Karyawan"),
});

/**
 * Displays the employee's certification list as a grid of cards
 * with status badges and download buttons.
 */
function RouteComponent() {
  const dialogs = useDialogs({
    certification: null,
  });

  const { data: certifications, isLoading } = useQuery(
    trpc.platform.employeeCertification.getMyCertifications.queryOptions(),
  );

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sertifikasi</h1>
          <p className="text-sm text-muted-foreground">
            Kelola sertifikasi kompetensi Anda
          </p>
        </div>
        <Button onClick={() => dialogs.open("certification")}>
          <IconUpload className="size-4" />
          Upload Sertifikasi
        </Button>
      </div>

      <Card className="flex flex-1 flex-col">
        <CardHeader>
          <CardTitle>Sertifikasi Saya</CardTitle>
          <CardDescription>
            Daftar sertifikasi yang telah diunggah
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          {isLoading ? (
            <CertificationListSkeleton />
          ) : !certifications || certifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              <IconCertificate className="size-10" />
              <p className="text-sm">Belum ada sertifikasi</p>
              <p className="text-xs">
                Klik tombol "Upload Sertifikasi" untuk menambahkan sertifikat.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {certifications.map((cert) => (
                <CertificationCard key={cert.id} cert={cert} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <UploadCertificationDialog
        isOpen={dialogs.isOpen("certification")}
        setIsOpen={(isOpen) =>
          isOpen
            ? dialogs.open("certification")
            : dialogs.close("certification")
        }
      />
    </div>
  );
}
