import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/utils/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { Loader2, CheckCircle2, QrCode } from "lucide-react";
import { pageHead } from "@/utils/page-head";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/tte/sign-spk")({
  validateSearch: z.object({
    token: z.string(),
  }),
  head: () => pageHead("Penandatanganan SPK", "TTE SPK Interaktif"),
  component: SignSpkPage,
});

function SignSpkPage() {
  const { token } = Route.useSearch();

  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Position for the QR code (120x120 container)
  const qrWidth = 120;
  const qrHeight = 120;
  const [qrPos, setQrPos] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [page, setPage] = useState("0");

  const canvasRef = useRef<HTMLDivElement>(null);

  // Fetch token detail and PDF base64
  const tteQuery = useQuery(
    trpc.pengujian.document.getTTERequestDetail.queryOptions({ token }),
  );

  const detail = tteQuery.data;

  // Generate PDF preview URL from base64
  useEffect(() => {
    if (detail?.fileBase64) {
      try {
        const byteCharacters = atob(detail.fileBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setPdfPreviewUrl(url);

        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (err) {
        console.error("Failed to parse PDF base64", err);
      }
    }
  }, [detail?.fileBase64]);

  // Handle Dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!canvasRef.current) return;
      setIsDragging(true);

      const clientX = "touches" in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
      const clientY = "touches" in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      
      // Calculate CSS scale assuming it's responsive. But let's assume it's scaled by max-width.
      const scaleRatio = canvasRect.width / 800;

      setDragOffset({
        x: (clientX - canvasRect.left) / scaleRatio - qrPos.x,
        y: (clientY - canvasRect.top) / scaleRatio - qrPos.y,
      });
    },
    [qrPos],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !canvasRef.current) return;

      const clientX = "touches" in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
      const clientY = "touches" in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const scaleRatio = canvasRect.width / 800;

      const newX = (clientX - canvasRect.left) / scaleRatio - dragOffset.x;
      const newY = (clientY - canvasRect.top) / scaleRatio - dragOffset.y;

      setQrPos({
        x: Math.max(0, Math.min(newX, 800 - qrWidth)),
        y: Math.max(0, Math.min(newY, 1100 - qrHeight)),
      });
    },
    [isDragging, dragOffset],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      const handleMove = (e: Event) =>
        handleMouseMove(e as MouseEvent | TouchEvent);
      const handleEnd = () => handleMouseUp();

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleMove, { passive: false });
      window.addEventListener("touchend", handleEnd);
      window.addEventListener("touchcancel", handleEnd);

      return () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleEnd);
        window.removeEventListener("touchmove", handleMove);
        window.removeEventListener("touchend", handleEnd);
        window.removeEventListener("touchcancel", handleEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Mutation
  const signMutation = useMutation(
    trpc.pengujian.document.signSpkWithTTE.mutationOptions({
      onSuccess: () => {
        globalSuccessToast("Tanda Tangan Elektronik berhasil dibubuhkan");
        setIsSuccess(true);
      },
      onError: (err) => {
        globalErrorToast(
          err.message || "Gagal membubuhkan tanda tangan elektronik",
        );
      },
    }),
  );

  const handleSubmit = () => {
    signMutation.mutate({
      token,
      position: {
        x: Math.round(qrPos.x),
        y: Math.round(qrPos.y),
        width: qrWidth,
        height: qrHeight,
        page: parseInt(page, 10),
      }
    });
  };

  // Loading state
  if (tteQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Memuat detail dokumen...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (tteQuery.isError || !detail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md border-red-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-red-700">Akses Ditolak</CardTitle>
            <CardDescription>
              {tteQuery.error?.message ||
                "Token tidak valid atau sudah kedaluwarsa."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md border-green-200 shadow-xl">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              Penandatanganan Berhasil!
            </h2>
            <p className="mb-6 text-gray-600">
              Dokumen SPK telah berhasil ditandatangani. Salinan dokumen akan
              tersimpan di sistem.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navbar / Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold">Penandatanganan SPK</h1>
          <p className="text-sm text-gray-500">
            Penandatangan: <span className="font-medium text-gray-800">{detail.payload.signerName}</span> ({detail.payload.signerRole})
          </p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={signMutation.isPending || !pdfPreviewUrl}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {signMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Bubuhkan Tanda Tangan
        </Button>
      </div>

      <div className="container mx-auto p-6">
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="text-sm text-blue-800">
            <strong>Petunjuk:</strong> Tarik dan geser kotak QR Code di bawah ke area kosong (atau ke area hijau rekomendasi Srikandi).
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-900 whitespace-nowrap">Pilih Halaman:</span>
            <Select value={page} onValueChange={setPage}>
              <SelectTrigger className="w-32 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }).map((_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    Halaman {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-center overflow-x-auto pb-10">
          <div
            ref={canvasRef}
            className="relative bg-white shadow-lg"
            style={{ 
              width: "800px", 
              height: "1100px",
              minWidth: "800px",
              minHeight: "1100px",
            }}
          >
            {pdfPreviewUrl && (
              <iframe
                src={`${pdfPreviewUrl}#page=${parseInt(page, 10) + 1}&toolbar=0&navpanes=0&scrollbar=0`}
                className="pointer-events-none h-full w-full border-0"
                title="PDF Preview"
              />
            )}

            {/* Target Highlight Zone (Srikandi Default) */}
            <div className="absolute border-2 border-green-400 bg-green-500/10 pointer-events-none flex flex-col items-center justify-center text-green-700/50 rounded-md" 
                 style={{ left: "630px", top: "900px", width: "120px", height: "120px" }}>
              <span className="text-xs font-semibold text-center leading-tight">Posisi Srikandi<br/>(Rekomendasi)</span>
            </div>

            {/* Draggable QR Container */}
            <div
              className={`absolute flex cursor-grab flex-col items-center justify-center overflow-hidden rounded-md border-2 border-dashed transition-colors select-none ${
                isDragging
                  ? "border-blue-600 bg-blue-500/10 cursor-grabbing"
                  : "border-blue-400 bg-white/60 hover:border-blue-500 hover:bg-blue-50"
              }`}
              style={{
                left: `${qrPos.x}px`,
                top: `${qrPos.y}px`,
                width: `${qrWidth}px`,
                height: `${qrHeight}px`,
                pointerEvents: "auto",
                touchAction: "none",
                backdropFilter: "blur(2px)",
              }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
            >
              <QrCode className="mb-1 h-12 w-12 text-gray-700" />
              <div className="px-1 text-center text-[10px] font-semibold leading-tight text-gray-800">
                <div className="truncate w-full">{detail.payload.signerName}</div>
                <div className="truncate w-full font-normal text-gray-600">{detail.payload.signerRole}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
