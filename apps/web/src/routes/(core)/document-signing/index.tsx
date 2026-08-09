import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { PDFDocument } from "pdf-lib";
import { trpc } from "@/utils/trpc";
import { pageHead } from "@/utils/page-head";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { openBase64InNewTab } from "@/utils/download";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, QrCode, FileText, Plus, Trash2, Info } from "lucide-react";
import {
  QRSignaturePlacer,
  type SignaturePosition,
  type SignerInfo,
} from "@/components/document-signing";
import z from "zod";

const searchSchema = z.object({
  sessionKey: z.string().catch(""),
});

export const Route = createFileRoute("/(core)/document-signing/")({
  validateSearch: searchSchema,
  head: () => pageHead("Penentuan Posisi Tanda Tangan"),
  component: DocumentSigningPageComponent,
});

export interface DocumentSigningSessionData {
  documentType: "spt" | "spk" | "invoice" | "offering";
  title: string;
  formData: Record<string, any>;
  pdfPreviewUrl?: string;
  returnPath?: string;
  signers: SignerInfo[];
  maxPages?: number;
}

function DocumentSigningPageComponent() {
  const navigate = useNavigate();
  const { sessionKey } = Route.useSearch();

  const [sessionData, setSessionData] =
    useState<DocumentSigningSessionData | null>(null);
  const [signatures, setSignatures] = useState<SignaturePosition[]>([]);
  const [pageCount, setPageCount] = useState<number>(1);

  useEffect(() => {
    if (!sessionKey) return;
    try {
      const raw = sessionStorage.getItem(sessionKey);
      if (raw) {
        const parsed = JSON.parse(raw) as DocumentSigningSessionData;
        setSessionData(parsed);
        if (parsed.maxPages) {
          setPageCount(parsed.maxPages);
        }
      }
    } catch (_e) {
      globalErrorToast("Gagal memuat data sesi penandatanganan");
    }
  }, [sessionKey]);

  // Auto-detect PDF page count from pdfPreviewUrl using pdf-lib
  useEffect(() => {
    if (!sessionData?.pdfPreviewUrl) return;

    let isMounted = true;
    async function detectPdfPages() {
      try {
        const response = await fetch(sessionData!.pdfPreviewUrl!);
        const arrayBuffer = await response.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const count = pdfDoc.getPageCount();
        if (isMounted && count > 0) {
          setPageCount(count);
        }
      } catch (err) {
        console.error("Gagal mendeteksi jumlah halaman PDF:", err);
      }
    }

    detectPdfPages();
    return () => {
      isMounted = false;
    };
  }, [sessionData?.pdfPreviewUrl]);

  // Mutations
  const generateSPT = useMutation(
    trpc.pengujian.generateDocument.generateAssignmentLetter.mutationOptions({
      onSuccess: (data: { base64: string; contentType: string }) => {
        globalSuccessToast("Surat SPT berhasil dibuat");
        openBase64InNewTab(data.base64, data.contentType);
        finishAndReturn();
      },
      onError: (error: { message?: string }) => {
        globalErrorToast("Gagal membuat surat SPT: " + (error?.message || ""));
      },
    }),
  );

  const generateSPK = useMutation(
    trpc.pengujian.generateDocument.generateSpkDocument.mutationOptions({
      onSuccess: (data: { base64: string; contentType: string }) => {
        globalSuccessToast("Surat SPK berhasil dibuat");
        openBase64InNewTab(data.base64, data.contentType);
        finishAndReturn();
      },
      onError: (error: { message?: string }) => {
        globalErrorToast("Gagal membuat surat SPK: " + (error?.message || ""));
      },
    }),
  );

  const generateInvoice = useMutation(
    trpc.pengujian.generateDocument.generateTagihanDocument.mutationOptions({
      onSuccess: (data: { base64: string; contentType: string }) => {
        globalSuccessToast("Surat Kuitansi / Invoice berhasil dibuat");
        openBase64InNewTab(data.base64, data.contentType);
        finishAndReturn();
      },
      onError: (error: { message?: string }) => {
        globalErrorToast("Gagal membuat Invoice: " + (error?.message || ""));
      },
    }),
  );

  const generateOffering = useMutation(
    trpc.pengujian.generateDocument.generateOfferingLetter.mutationOptions({
      onSuccess: (data: { base64: string; contentType: string }) => {
        globalSuccessToast("Surat Penawaran berhasil dibuat");
        openBase64InNewTab(data.base64, data.contentType);
        finishAndReturn();
      },
      onError: (error: { message?: string }) => {
        globalErrorToast(
          "Gagal membuat Surat Penawaran: " + (error?.message || ""),
        );
      },
    }),
  );

  const isPending =
    generateSPT.isPending ||
    generateSPK.isPending ||
    generateInvoice.isPending ||
    generateOffering.isPending;

  const finishAndReturn = () => {
    if (sessionKey) sessionStorage.removeItem(sessionKey);
    if (sessionData?.returnPath) {
      window.location.href = sessionData.returnPath;
    } else {
      window.history.back();
    }
  };

  const handleBack = () => {
    if (sessionKey) sessionStorage.removeItem(sessionKey);
    window.history.back();
  };

  const handlePrint = (withSignatures: boolean) => {
    if (!sessionData) return;

    const formattedSignatures = withSignatures
      ? signatures.map((s) => ({
          userId: s.userId,
          userName: s.userName,
          purpose: s.purpose,
          page: s.page ?? 0,
          x: s.x,
          y: s.y,
          width: s.width,
          height: s.height,
        }))
      : [];

    const payload = {
      ...sessionData.formData,
      signatures: formattedSignatures,
    };

    switch (sessionData.documentType) {
      case "spt":
        generateSPT.mutate(payload as any);
        break;
      case "spk":
        generateSPK.mutate(payload as any);
        break;
      case "invoice":
        generateInvoice.mutate(payload as any);
        break;
      case "offering":
        generateOffering.mutate(payload as any);
        break;
    }
  };

  const handleAddStampToPage = (signer: SignerInfo, targetPage: number = 0) => {
    const stampId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `stamp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newPos: SignaturePosition = {
      stampId,
      ...signer,
      page: targetPage,
      x: 600,
      y: 900,
      width: 100,
      height: 100,
    };
    setSignatures((prev) => [...prev, newPos]);
  };

  const handleRemoveStamp = (stampId: string) => {
    setSignatures((prev) => prev.filter((p) => p.stampId !== stampId));
  };

  if (!sessionData) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center space-y-4 px-4 py-20 text-center">
        <FileText className="h-12 w-12 text-slate-400" />
        <h2 className="text-xl font-bold text-slate-800">
          Data Penandatanganan Tidak Ditemukan
        </h2>
        <p className="text-sm text-slate-500">
          Sesi penandatanganan telah berakhir atau link tidak valid.
        </p>
        <Button onClick={handleBack} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 py-5">
      {/* Sticky Header Bar */}
      <div className="sticky top-0 z-20 flex flex-col gap-3 rounded-xl border-b border-slate-200 bg-white/95 px-4 py-3 shadow-2xs backdrop-blur-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-9 px-2 font-medium text-slate-600 hover:bg-slate-100"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Kembali
            </Button>
            <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
              Penentuan Posisi Tanda Tangan Digital
            </h1>
          </div>
          <p className="mt-0.5 ml-1 text-xs text-slate-500">
            Dokumen:{" "}
            <span className="font-semibold text-slate-700">
              {sessionData.title}
            </span>
          </p>
        </div>

        {/* Primary Actions */}
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => handlePrint(false)}
            disabled={isPending}
            className="h-10 text-xs font-semibold text-slate-700 sm:text-sm"
          >
            Cetak Tanpa QR
          </Button>
          <Button
            type="button"
            size="default"
            onClick={() => handlePrint(true)}
            disabled={isPending}
            className="h-10 gap-2 bg-blue-600 text-xs font-bold shadow-sm hover:bg-blue-700 sm:text-sm"
          >
            {isPending ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <QrCode className="h-4 w-4" />
            )}
            Cetak Dokumen Bertanda Tangan
          </Button>
        </div>
      </div>

      {/* Clear Guidance Banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div className="space-y-1 text-sm text-blue-950">
            <p className="font-bold">
              Panduan Mudah Menambahkan Tanda Tangan Digital:
            </p>
            <ol className="list-inside list-decimal space-y-0.5 text-xs text-blue-900 sm:text-sm">
              <li>
                Pilih nama penandatangan di panel samping (kiri) untuk
                menambahkan stamp QR ke dokumen.
              </li>
              <li>
                Semua halaman dokumen ditampilkan di sebelah kanan secara
                berurutan.
              </li>
              <li>
                Geser (drag) stamp ke lokasi mana pun pada halaman dokumen yang
                Anda inginkan.
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Main 2-Column Content */}
      <div className="flex flex-col items-start gap-6 lg:flex-row">
        {/* Left Column: Signer Controls & Placed Stamps Panel */}
        <div className="w-full shrink-0 space-y-4 lg:sticky lg:top-20 lg:w-80">
          {/* Add Signer Card */}
          <Card className="rounded-xl border-slate-200 shadow-2xs">
            <CardHeader className="border-b bg-slate-50 px-4 py-3">
              <CardTitle className="flex items-center justify-between text-sm font-bold text-slate-800">
                <span>Pilih Penandatangan</span>
                <Badge variant="secondary" className="text-[10px]">
                  {sessionData.signers.length} Orang
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
              {sessionData.signers.map((signer) => (
                <div
                  key={signer.userId}
                  className="flex flex-col gap-1.5 rounded-lg border border-slate-200 bg-white p-2.5 transition-all hover:border-blue-300 hover:bg-blue-50/40"
                >
                  <div>
                    <p className="text-sm leading-tight font-bold text-slate-800">
                      {signer.userName}
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      Jabatan / Peran: {signer.purpose}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAddStampToPage(signer, 0)}
                    className="h-8 w-full gap-1 bg-slate-900 text-xs font-semibold text-white hover:bg-blue-600"
                  >
                    <Plus className="h-3.5 w-3.5" /> Tambah Stamp QR
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Active Stamps Summary Card */}
          <Card className="rounded-xl border-slate-200 shadow-2xs">
            <CardHeader className="border-b bg-slate-50 px-4 py-3">
              <CardTitle className="flex items-center justify-between text-sm font-bold text-slate-800">
                <span>Stamp Terpasang</span>
                <Badge
                  variant={signatures.length > 0 ? "default" : "outline"}
                  className="text-[10px]"
                >
                  {signatures.length} Stamp
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              {signatures.length === 0 ? (
                <div className="space-y-1 py-6 text-center text-xs text-slate-400">
                  <QrCode className="mx-auto h-8 w-8 stroke-1 text-slate-300" />
                  <p className="font-medium text-slate-500">
                    Belum ada stamp dipasang
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Klik "+ Tambah Stamp QR" di atas untuk menempatkan tanda
                    tangan.
                  </p>
                </div>
              ) : (
                <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
                  {signatures.map((sig, idx) => (
                    <div
                      key={sig.stampId || idx}
                      className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50/50 p-2 text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="truncate font-bold text-slate-800">
                          {sig.userName}
                        </p>
                        <p className="text-[11px] font-semibold text-blue-700">
                          📍 Halaman {sig.page + 1}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStamp(sig.stampId)}
                        className="h-7 w-7 shrink-0 p-0 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Hapus Stamp"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Multi-Page Scrollable Document Canvas */}
        <div className="w-full flex-1">
          <Card className="overflow-hidden rounded-xl border-slate-200 shadow-2xs">
            <CardHeader className="border-b bg-slate-50 px-4 py-3">
              <CardTitle className="flex items-center justify-between text-sm font-bold text-slate-800">
                <span>Pratinjau Seluruh Halaman Dokumen</span>
                <span className="text-xs font-normal text-slate-500">
                  Total {pageCount} Halaman
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-[600px] bg-slate-100/60 p-4">
              <QRSignaturePlacer
                signers={sessionData.signers}
                positions={signatures}
                onChange={setSignatures}
                pdfPreviewUrl={sessionData.pdfPreviewUrl}
                maxPages={pageCount}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
