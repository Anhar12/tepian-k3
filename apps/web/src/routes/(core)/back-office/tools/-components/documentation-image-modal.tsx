import { getRouteApi } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { getPublicUrl } from "@/utils/url";
import ImageWithFallback from "@/components/image-with-fallback";

const calibrationDetailApi = getRouteApi(
  "/(core)/back-office/tools/$toolId/calibration/$calibrationId/detail",
);

export default function DocumentationImageModal() {
  const navigate = calibrationDetailApi.useNavigate();
  const { modalId } = calibrationDetailApi.useSearch();

  const isOpen = useMemo(() => !!modalId, [modalId]);

  const { data: documentationImage, isLoading } = useQuery({
    ...trpc.tool.getToolCalibrationDocumentationById.queryOptions({
      id: modalId!,
    }),
    enabled: !!modalId,
  });

  const handleClose = () => {
    navigate({
      search: (prev) => ({
        ...prev,
        modalId: undefined,
      }),
    });
  };

  if (isLoading && isOpen) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogHeader>
          <DialogTitle>Dokumentasi Kalibrasi</DialogTitle>
          <DialogDescription>
            Melihat detail dokumentasi kalibrasi alat.
          </DialogDescription>
        </DialogHeader>
        <DialogContent className="w-full sm:max-w-2xl">
          <div className="grid gap-4 p-4">
            <Skeleton className="h-150 w-full rounded-md" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!documentationImage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogHeader>
        <DialogTitle>Dokumentasi Kalibrasi</DialogTitle>
        <DialogDescription>
          Melihat detail dokumentasi kalibrasi alat.
        </DialogDescription>
      </DialogHeader>
      <DialogContent className="w-full sm:max-w-2xl">
        <div className="grid gap-4 p-4">
          <ImageWithFallback
            src={getPublicUrl(documentationImage.documentationFileUrl || "")}
            alt="Dokumentasi Kalibrasi"
            className="max-h-150 w-full rounded-md object-cover"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
