import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { queryClient, trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import {
  SkeletonButton,
  SkeletonInput,
  SkeletonTextArea,
} from "@/components/ui/skeleton-generator";
import { format } from "date-fns";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import SingleFileUpload from "@/components/ui/single-file-upload";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toFormData } from "@/utils/form-data-mapper";
import { getPublicUrl } from "@/utils/url";

interface CalibrationCertificateProps {
  calibrationId: string;
}

export function CalibrationCertificate({
  calibrationId,
}: CalibrationCertificateProps) {
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  const { data: calibration, isLoading } = useQuery(
    trpc.tool.getToolCalibrationCertificate.queryOptions({
      id: calibrationId,
    }),
  );

  const createToolCertificateMutation = useMutation(
    trpc.tool.createToolCertification.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.tool.getToolCalibrationCertificate.queryOptions({
            id: calibrationId,
          }),
        );

        globalSuccessToast("Sertifikat kalibrasi berhasil dibuat.");
      },
      onError: (error) => {
        globalErrorToast(
          `Gagal membuat sertifikat kalibrasi: ${error.message}`,
        );
      },
    }),
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sertifikat Kalibrasi</CardTitle>
            <CardDescription>
              Lihat sertifikat kalibrasi Anda di sini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex flex-col gap-7">
                <SkeletonTextArea />
                <SkeletonInput />
                <SkeletonButton className="w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sertifikat Kalibrasi</CardTitle>
        <CardDescription>
          Lihat sertifikat kalibrasi Anda di sini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {calibration ? (
          <div className="flex flex-col gap-4">
            <div className="grid gap-7">
              <div className="space-y-1">
                <Label className="ml-1 text-sm font-bold">
                  Catatan Kalibrasi
                </Label>
                <span className="block h-20 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
                  {calibration.toolCalibration.note || "-"}
                </span>
              </div>
              <div className="space-y-1">
                <Label className="ml-1 text-sm font-bold">
                  Tanggal Kalibrasi
                </Label>
                <div className="block w-full rounded-md border border-input bg-muted px-3 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
                  {format(
                    new Date(calibration.toolCalibration.calibrationDate),
                    "EEEE, dd MMMM yyyy",
                  )}
                </div>
              </div>
              {/* This should download certificate file */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    window.open(
                      getPublicUrl(calibration.certificateFileUrl || ""),
                      "_blank",
                    );
                  }}
                >
                  Unduh Sertifikat Kalibrasi
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <SingleFileUpload
              accept="application/pdf"
              maxSize={5 * 1024 * 1024}
              value={certificateFile}
              onChange={(file) => setCertificateFile(file)}
              disabled={createToolCertificateMutation.isPending}
            />
            <Button
              disabled={
                !certificateFile || createToolCertificateMutation.isPending
              }
              onClick={() => {
                if (certificateFile) {
                  const formData = toFormData({
                    toolCalibrationId: calibrationId,
                    certificationFile: certificateFile,
                  });

                  createToolCertificateMutation.mutate(formData);
                }
              }}
            >
              {createToolCertificateMutation.isPending ? <Spinner /> : null}
              Unggah Sertifikat Kalibrasi
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
