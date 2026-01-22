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
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toFormData } from "@/utils/form-data-mapper";
import { getPublicUrl } from "@/utils/url";
import MultipleFileUpload from "@/components/ui/multiple-file-upload";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";

interface CalibrationDocumentationProps {
  calibrationId: string;
}

export function CalibrationDocumentation({
  calibrationId,
}: CalibrationDocumentationProps) {
  const [documentationFile, setDocumentationFile] = useState<File[]>([]);

  const { data: calibration, isLoading } = useQuery(
    trpc.tool.getToolCalibrationDocumentation.queryOptions({
      id: calibrationId,
    }),
  );

  const createToolDocumentationMutation = useMutation(
    trpc.tool.createToolDocumentation.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.tool.getToolCalibrationDocumentation.queryOptions({
            id: calibrationId,
          }),
        );
        globalSuccessToast("Dokumentasi kalibrasi berhasil dibuat.");
      },
      onError: (error) => {
        globalErrorToast(
          `Gagal membuat dokumentasi kalibrasi: ${error.message}`,
        );
      },
    }),
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dokumentasi Kalibrasi</CardTitle>
          <CardDescription>
            Unggah file dokumentasi hasil kalibrasi alat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex flex-col gap-4">
              <Carousel
                className="grid w-full px-12"
                opts={{
                  align: "start",
                  loop: true,
                }}
              >
                <CarouselContent>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <CarouselItem key={index} className="basis-1/3">
                      <Skeleton className="size-64 rounded-md" />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="absolute top-1/2 left-2 flex items-center justify-center">
                  <CarouselPrevious className="relative left-0 translate-x-0 hover:translate-x-0 hover:bg-primary/90" />
                </div>
                <div className="absolute top-1/2 right-2 flex items-center justify-center">
                  <CarouselNext className="relative right-0 translate-x-0 hover:translate-x-0 hover:bg-primary/90" />
                </div>
              </Carousel>
            </div>
            <div className="flex flex-col gap-7">
              <Skeleton className="h-48 w-full rounded-md" />
              <SkeletonButton className="w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Dokumentasi Kalibrasi</CardTitle>
          <CardDescription>
            Unggah file dokumentasi hasil kalibrasi alat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex flex-col gap-4">
              {calibration && calibration.length > 0 && (
                <Carousel
                  className="grid w-full px-12"
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                >
                  <CarouselContent>
                    {calibration.map((item, index) => (
                      <CarouselItem key={index} className="basis-1/3">
                        <img
                          src={getPublicUrl(item?.documentationFileUrl || "")}
                          alt={`Dokumentasi Kalibrasi ${index + 1}`}
                          className="size-64 rounded-md object-cover sm:h-64 sm:w-64"
                          onClick={() => {
                            window.open(
                              getPublicUrl(item?.documentationFileUrl || ""),
                            );
                          }}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div className="absolute top-1/2 left-2 flex items-center justify-center">
                    <CarouselPrevious className="relative left-0 translate-x-0 hover:translate-x-0 hover:bg-primary/90" />
                  </div>
                  <div className="absolute top-1/2 right-2 flex items-center justify-center">
                    <CarouselNext className="relative right-0 translate-x-0 hover:translate-x-0 hover:bg-primary/90" />
                  </div>
                </Carousel>
              )}
            </div>
            {calibration && calibration.length < 5 && (
              <div className="flex flex-col gap-7">
                <MultipleFileUpload
                  maxFiles={calibration ? 5 - calibration.length : 5}
                  accept="image/jpeg,image/png"
                  value={documentationFile}
                  onChange={setDocumentationFile}
                  disabled={
                    createToolDocumentationMutation.isPending ||
                    (calibration && calibration.length >= 5)
                  }
                />
                <Button
                  disabled={
                    documentationFile.length === 0 ||
                    createToolDocumentationMutation.isPending ||
                    (calibration && calibration.length >= 5)
                  }
                  onClick={() => {
                    const formData = toFormData({
                      toolCalibrationId: calibrationId,
                      documentationFiles: documentationFile,
                    });
                    createToolDocumentationMutation.mutate(formData);
                  }}
                >
                  {createToolDocumentationMutation.isPending ? (
                    <Spinner className="mr-2" />
                  ) : null}
                  Unggah Dokumentasi
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
