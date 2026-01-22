import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import {
  SkeletonInput,
  SkeletonTextArea,
} from "@/components/ui/skeleton-generator";
import { EmptyState } from "@/components/ui/empty-state";
import { IconAlertCircle } from "@tabler/icons-react";
import { useRouter } from "@tanstack/react-router";
import { format } from "date-fns";

interface CalibrationDetailProps {
  calibrationId: string;
}

export default function CalibrationDetail({
  calibrationId,
}: CalibrationDetailProps) {
  const router = useRouter();

  const { data: calibration, isLoading } = useQuery(
    trpc.tool.getToolCalibrationDetails.queryOptions({
      id: calibrationId,
    }),
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Detail Kalibrasi</CardTitle>
            <CardDescription>
              Lihat detail informasi kalibrasi Anda di sini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex flex-col gap-7">
                <SkeletonTextArea />
                <SkeletonInput />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!calibration) {
    return (
      <EmptyState
        icon={IconAlertCircle}
        title="Kalibrasi Tidak Ditemukan"
        description="Kalibrasi yang Anda cari tidak ada atau telah dihapus."
        actions={[
          {
            label: "Kembali ke Daftar Kalibrasi",
            onClick: () => router.history.back(),
          },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Detail Kalibrasi</CardTitle>
          <CardDescription>
            Lihat detail informasi kalibrasi Anda di sini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex flex-col gap-7">
              <div className="space-y-1">
                <Label className="ml-1 text-sm font-bold">
                  Catatan Kalibrasi
                </Label>
                <span className="block h-20 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
                  {calibration.note || "-"}
                </span>
              </div>
              <div className="space-y-1">
                <Label className="ml-1 text-sm font-bold">
                  Tanggal Kalibrasi
                </Label>
                <div className="block w-full rounded-md border border-input bg-muted px-3 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
                  {format(
                    new Date(calibration.calibrationDate),
                    "EEEE, dd MMMM yyyy",
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
