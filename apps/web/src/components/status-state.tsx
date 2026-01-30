import type { OrderDetailWithStatus } from "@tepian-k3/types/order.types";
import {
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileCheckIcon,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";
import { Button } from "./ui/button";
import type { Document } from "@tepian-k3/types/document.types";
import { getPublicUrl } from "@/utils/url";
import { Input } from "./ui/input";
import { globalErrorToast } from "@/lib/toast";
import type { OrderStatus } from "@tepian-k3/constants";

interface SharedStatusStateProps {
  orderDetail: OrderDetailWithStatus;
}

function StateLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full flex-1 flex-col">{children}</div>;
}

interface StatusStateWaitingForRevisionProps extends SharedStatusStateProps {
  revisionHistory: {
    id: string;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string | null;
    status: OrderStatus;
    orderId: string;
    note: string | null;
    changedBy: string;
  };
}

export function StatusStateWaitingForRevision({
  orderDetail,
  revisionHistory,
}: StatusStateWaitingForRevisionProps) {
  return (
    <StateLayout>
      <h2 className="mb-2 text-xl font-semibold text-foreground">
        {`Order #${orderDetail.orderNumber} - Menunggu Revisi`}
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Permintaan revisi telah dikirim. Mohon tunggu admin untuk merevisi
        dokumen penawaran.
      </p>

      {/* Revision Status Card */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-amber-800">
              Menunggu Revisi Dokumen
            </h3>
            <p className="mt-1 text-sm text-amber-700">
              Admin sedang memproses permintaan revisi Anda.
            </p>
            {revisionHistory?.note && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-white p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Catatan Revisi:
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {revisionHistory.note}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </StateLayout>
  );
}

export function StatusState0({ orderDetail }: SharedStatusStateProps) {
  return (
    <StateLayout>
      <h2 className="mb-2 text-xl font-semibold text-foreground">
        {`Order #${orderDetail.orderNumber} - Menunggu Kaji Ulang`}
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Order pengujian telah diterima. Admin sedang melakukan kaji ulang teknis
        untuk menentukan parameter, alat, dan estimasi waktu pengujian.
      </p>
      <div className="flex h-full w-full flex-col items-center justify-center self-center py-8">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
          <FileCheckIcon className="h-10 w-10 text-green-500" />
        </div>
      </div>
    </StateLayout>
  );
}

// State: Worksheet sedang dalam kaji ulang (draft/pending_verification)
interface StatusStateWorksheetInReviewProps extends SharedStatusStateProps {
  worksheetStatus: string;
}

export function StatusStateWorksheetInReview({
  orderDetail,
  worksheetStatus,
}: StatusStateWorksheetInReviewProps) {
  const statusText =
    worksheetStatus === "draft"
      ? "Worksheet sedang dibuat"
      : worksheetStatus === "pending_verification"
        ? "Worksheet menunggu verifikasi koordinator"
        : "Worksheet dalam proses kaji ulang";

  return (
    <StateLayout>
      <h2 className="mb-2 text-xl font-semibold text-foreground">
        {`Order #${orderDetail.orderNumber} - Kaji Ulang Teknis`}
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Tim kami sedang melakukan kaji ulang teknis untuk order pengujian Anda.
      </p>

      <div className="flex h-full w-full flex-col items-center justify-center self-center py-8">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50">
          <div className="relative">
            <FileText className="h-10 w-10 text-blue-500" />
            <Clock className="absolute -right-1 -bottom-1 h-5 w-5 text-blue-500" />
          </div>
        </div>
        <h3 className="mb-2 text-center text-lg font-medium text-foreground">
          {statusText}
        </h3>
        <p className="max-w-md text-center text-sm text-muted-foreground">
          Koordinator akan memverifikasi kelayakan teknis, menentukan tim
          pengujian, dan menyiapkan dokumen penawaran.
        </p>
      </div>
    </StateLayout>
  );
}

// State: Worksheet sudah verified, menunggu penawaran dikirim
export function StatusStateWorksheetVerified({
  orderDetail,
}: SharedStatusStateProps) {
  return (
    <StateLayout>
      <h2 className="mb-2 text-xl font-semibold text-foreground">
        {`Order #${orderDetail.orderNumber} - Menunggu Penawaran`}
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Kaji ulang teknis telah selesai. Mohon tunggu admin untuk menerbitkan
        dokumen penawaran.
      </p>

      <div className="flex h-full w-full flex-col items-center justify-center self-center py-8">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50">
          <div className="relative">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
        </div>
        <h3 className="mb-2 text-center text-lg font-medium text-foreground">
          Kaji Ulang Teknis Selesai
        </h3>
        <p className="max-w-md text-center text-sm text-muted-foreground">
          Worksheet telah diverifikasi. Admin sedang menyiapkan dokumen
          penawaran untuk Anda.
        </p>
      </div>
    </StateLayout>
  );
}

interface StatusState1Props extends SharedStatusStateProps {
  offeringDoc: Document | undefined;
}

export function StatusState1({ orderDetail, offeringDoc }: StatusState1Props) {
  return (
    <StateLayout>
      <h2 className="mb-2 text-xl font-semibold text-foreground">
        {`Order #${orderDetail.orderNumber} - Penawaran Diterbitkan`}
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Penawaran telah diterbitkan, setujui penawaran untuk melanjutkan ke
        tahap pembayaran.
      </p>

      {/* Document Download Card */}
      <div className="flex flex-row gap-4">
        <div className="inline-flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <FileText className="h-5 w-5 text-blue-500" />
          </div>
          <span className="min-w-30 font-medium text-foreground">
            Surat Penawaran
          </span>
          <Button
            size="icon"
            className="h-10 w-10 rounded-lg bg-blue-500 hover:bg-blue-600"
            onClick={() => {
              if (offeringDoc?.fileUrl) {
                window.open(getPublicUrl(offeringDoc.fileUrl), "_blank");
              }
            }}
            disabled={!offeringDoc}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </StateLayout>
  );
}

interface StatusState2Props {
  approvalLetterFile: File | null;
  setApprovalLetterFile: (file: File | null) => void;
  uploadingApprovalLetter: boolean;
  handleUploadApprovalLetter: () => void;
}

export function StatusState2({
  approvalLetterFile,
  setApprovalLetterFile,
  uploadingApprovalLetter,
  handleUploadApprovalLetter,
}: StatusState2Props) {
  return (
    <StateLayout>
      {/* Upload Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          Upload Surat Persetujuan
        </h3>
        <p className="text-sm text-muted-foreground">
          Silakan unggah surat persetujuan yang telah ditandatangani untuk
          melanjutkan ke tahap berikutnya.
        </p>

        {/* Document Upload Card */}
        <div className="inline-flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <FileText className="h-5 w-5 text-blue-500" />
          </div>
          <span className="min-w-30 font-medium text-foreground">
            Surat Persetujuan
          </span>
          {!approvalLetterFile ? (
            <label htmlFor="approval-letter-input">
              <Input
                id="approval-letter-input"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.type !== "application/pdf") {
                      globalErrorToast("Format file harus PDF");
                      return;
                    }
                    setApprovalLetterFile(file);
                  }
                }}
              />
              <Button
                size="icon"
                className="h-10 w-10 cursor-pointer rounded-lg bg-blue-500 hover:bg-blue-600"
                asChild
              >
                <span>
                  <Upload className="h-4 w-4" />
                </span>
              </Button>
            </label>
          ) : (
            <Button
              size="sm"
              className="rounded-lg bg-blue-500 hover:bg-blue-600"
              onClick={handleUploadApprovalLetter}
              disabled={uploadingApprovalLetter}
            >
              {uploadingApprovalLetter ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload
            </Button>
          )}
        </div>

        {approvalLetterFile && (
          <p className="text-sm text-muted-foreground">
            File terpilih: {approvalLetterFile.name}
          </p>
        )}
      </div>
    </StateLayout>
  );
}

interface StatusState3Props {}

export function StatusState3({}: StatusState3Props) {
  return (
    <StateLayout>
      <div className="flex h-full flex-col items-center justify-center py-8">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50">
          <div className="relative">
            <FileText className="h-10 w-10 text-blue-500" />
            <Clock className="absolute -right-1 -bottom-1 h-5 w-5 text-blue-500" />
          </div>
        </div>
        <h2 className="mb-2 text-center text-xl font-semibold text-foreground">
          Menunggu Dokumen Tagihan
        </h2>
        <p className="mb-8 max-w-md text-center text-sm text-muted-foreground">
          Surat persetujuan telah diunggah. Mohon tunggu admin untuk menerbitkan
          invoice dan surat perjanjian kerjasama.
        </p>
      </div>
    </StateLayout>
  );
}

interface StatusState4Props {
  invoiceDoc: Document | undefined;
  cooperationAgreementDoc: Document | undefined;
  paymentProofFile: File | null;
  setPaymentProofFile: (file: File | null) => void;
  cooperationAgreementFile: File | null;
  setCooperationAgreementFile: (file: File | null) => void;
  uploadingPaymentDocs: boolean;
  handleUploadPaymentDocs: () => void;
}

export function StatusState4({
  invoiceDoc,
  cooperationAgreementDoc,
  paymentProofFile,
  setPaymentProofFile,
  cooperationAgreementFile,
  setCooperationAgreementFile,
  uploadingPaymentDocs,
  handleUploadPaymentDocs,
}: StatusState4Props) {
  return (
    <StateLayout>
      <div className="flex flex-col items-center justify-center py-8">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50">
          <div className="relative">
            <CreditCard className="h-10 w-10 text-blue-500" />
            <Upload className="absolute -right-1 -bottom-1 h-5 w-5 text-blue-500" />
          </div>
        </div>
        <h2 className="mb-2 text-center text-xl font-semibold text-foreground">
          Upload Bukti Pembayaran
        </h2>
        <p className="mb-8 max-w-md text-center text-sm text-muted-foreground">
          Silakan unduh invoice dan surat perjanjian kerjasama, lakukan
          pembayaran, dan unggah bukti pembayaran beserta surat perjanjian yang
          telah ditandatangani.
        </p>
      </div>

      {/* Download Documents Section */}
      <div className="mb-6 space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          Dokumen Tagihan
        </h3>
        <div className="flex flex-wrap gap-4">
          <div className="inline-flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <span className="min-w-30 font-medium text-foreground">
              Invoice
            </span>
            <Button
              size="icon"
              className="h-10 w-10 rounded-lg bg-blue-500 hover:bg-blue-600"
              onClick={() =>
                window.open(getPublicUrl(invoiceDoc!.fileUrl), "_blank")
              }
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          <div className="inline-flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <span className="min-w-30 font-medium text-foreground">
              Surat Perjanjian
            </span>
            <Button
              size="icon"
              className="h-10 w-10 rounded-lg bg-blue-500 hover:bg-blue-600"
              onClick={() =>
                window.open(
                  getPublicUrl(cooperationAgreementDoc!.fileUrl),
                  "_blank",
                )
              }
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="my-6 border-t border-slate-200" />

      {/* Upload Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          Upload Dokumen Pembayaran
        </h3>
        <p className="text-sm text-muted-foreground">
          Upload bukti pembayaran dan surat perjanjian yang telah
          ditandatangani.
        </p>

        <div className="flex flex-wrap gap-4">
          {/* Payment Proof Upload */}
          <div className="inline-flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${paymentProofFile ? "bg-emerald-100" : "bg-blue-100"}`}
            >
              <FileText
                className={`h-5 w-5 ${paymentProofFile ? "text-emerald-500" : "text-blue-500"}`}
              />
            </div>
            <span className="min-w-30 font-medium text-foreground">
              Bukti Pembayaran
            </span>
            {!paymentProofFile ? (
              <label htmlFor="payment-proof-input">
                <Input
                  id="payment-proof-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setPaymentProofFile(file);
                  }}
                />
                <Button
                  size="icon"
                  className="h-10 w-10 cursor-pointer rounded-lg bg-blue-500 hover:bg-blue-600"
                  asChild
                >
                  <span>
                    <Upload className="h-4 w-4" />
                  </span>
                </Button>
              </label>
            ) : (
              <span className="text-sm text-emerald-600">
                ✓ {paymentProofFile.name}
              </span>
            )}
          </div>

          {/* Cooperation Agreement Upload */}
          <div className="inline-flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${cooperationAgreementFile ? "bg-emerald-100" : "bg-blue-100"}`}
            >
              <FileText
                className={`h-5 w-5 ${cooperationAgreementFile ? "text-emerald-500" : "text-blue-500"}`}
              />
            </div>
            <span className="min-w-30 font-medium text-foreground">
              Surat Perjanjian
            </span>
            {!cooperationAgreementFile ? (
              <label htmlFor="cooperation-agreement-input">
                <Input
                  id="cooperation-agreement-input"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.type !== "application/pdf") {
                        globalErrorToast("Format file harus PDF");
                        return;
                      }
                      setCooperationAgreementFile(file);
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="h-10 w-10 cursor-pointer rounded-lg bg-blue-500 hover:bg-blue-600"
                  asChild
                >
                  <span>
                    <Upload className="h-4 w-4" />
                  </span>
                </Button>
              </label>
            ) : (
              <span className="text-sm text-emerald-600">
                ✓ {cooperationAgreementFile.name}
              </span>
            )}
          </div>
        </div>

        {/* Upload Button */}
        {paymentProofFile && cooperationAgreementFile && (
          <div className="flex flex-row justify-end pt-4">
            <Button
              className="bg-blue-500 hover:bg-blue-600"
              onClick={handleUploadPaymentDocs}
              disabled={uploadingPaymentDocs}
            >
              {uploadingPaymentDocs ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload Dokumen Pembayaran
            </Button>
          </div>
        )}
      </div>
    </StateLayout>
  );
}

interface StatusState5Props {
  paymentProofDoc: Document | undefined;
  cooperationAgreementUserDoc: Document | undefined;
}

export function StatusState5({
  cooperationAgreementUserDoc,
  paymentProofDoc,
}: StatusState5Props) {
  return (
    <StateLayout>
      <div className="flex flex-col items-center justify-center py-8">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50">
          <div className="relative">
            <CreditCard className="h-10 w-10 text-amber-500" />
            <Clock className="absolute -right-1 -bottom-1 h-5 w-5 text-amber-500" />
          </div>
        </div>
        <h2 className="mb-2 text-center text-xl font-semibold text-foreground">
          Menunggu Verifikasi Pembayaran
        </h2>
        <p className="mb-8 max-w-md text-center text-sm text-muted-foreground">
          Dokumen pembayaran telah diunggah. Mohon tunggu admin untuk
          memverifikasi pembayaran Anda.
        </p>
      </div>

      {/* Show uploaded payment documents */}
      <div className="flex flex-wrap gap-4">
        {paymentProofDoc && (
          <div className="inline-flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <FileText className="h-5 w-5 text-emerald-500" />
            </div>
            <span className="min-w-30 font-medium text-foreground">
              Bukti Pembayaran
            </span>
            <Button
              size="icon"
              className="h-10 w-10 rounded-lg bg-blue-500 hover:bg-blue-600"
              onClick={() =>
                window.open(getPublicUrl(paymentProofDoc.fileUrl), "_blank")
              }
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )}
        {cooperationAgreementUserDoc && (
          <div className="inline-flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <FileText className="h-5 w-5 text-emerald-500" />
            </div>
            <span className="min-w-30 font-medium text-foreground">
              Surat Perjanjian
            </span>
            <Button
              size="icon"
              className="h-10 w-10 rounded-lg bg-blue-500 hover:bg-blue-600"
              onClick={() =>
                window.open(
                  getPublicUrl(cooperationAgreementUserDoc.fileUrl),
                  "_blank",
                )
              }
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </StateLayout>
  );
}

interface StatusState6Props {}

export function StatusState6({}: StatusState6Props) {
  return (
    <StateLayout>
      <div className="flex flex-col items-center justify-center py-8">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50">
          <div className="relative">
            <Calendar className="h-10 w-10 text-blue-500" />
            <Clock className="absolute -right-1 -bottom-1 h-5 w-5 text-blue-500" />
          </div>
        </div>
        <h2 className="mb-2 text-center text-xl font-semibold text-foreground">
          Menunggu Jadwal Pengujian
        </h2>
        <p className="mb-8 max-w-md text-center text-sm text-muted-foreground">
          Pembayaran telah diverifikasi. Mohon tunggu penerbitan Surat Perintah
          Tugas (SPT) dan jadwal pengujian.
        </p>
      </div>

      {/* Show verified payment status */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-emerald-800">
              Pembayaran Terverifikasi
            </h3>
            <p className="mt-1 text-sm text-emerald-700">
              Pembayaran Anda telah dikonfirmasi oleh admin.
            </p>
          </div>
        </div>
      </div>
    </StateLayout>
  );
}

interface StatusState7Props extends SharedStatusStateProps {}

export function StatusState7({ orderDetail }: StatusState7Props) {
  return (
    <StateLayout>
      <div className="flex h-full flex-col items-center justify-center py-8">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50">
          <div className="relative">
            <Calendar className="h-10 w-10 text-purple-500" />
            <Loader2 className="absolute -right-1 -bottom-1 h-5 w-5 animate-spin text-purple-500" />
          </div>
        </div>
        <h2 className="mb-2 text-center text-xl font-semibold text-foreground">
          Pengujian Sedang Berlangsung
        </h2>
        <p className="mb-8 max-w-md text-center text-sm text-muted-foreground">
          Tim kami sedang melakukan pengujian sesuai jadwal. Mohon tunggu hasil
          pengujian.
        </p>
      </div>

      {/* Show testing info if available */}
      {orderDetail.testing && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-purple-800">
                Informasi Pengujian
              </h3>
              <p className="mt-1 text-sm text-purple-700">
                No. Testing: {orderDetail.testing.testingNumber}
              </p>
            </div>
          </div>
        </div>
      )}
    </StateLayout>
  );
}

interface StatusState8Props extends SharedStatusStateProps {}

export function StatusState8({ orderDetail }: StatusState8Props) {
  return (
    <>
      <div className="flex flex-col items-center justify-center py-8">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-emerald-200 bg-emerald-50">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        </div>
        <h2 className="mb-2 text-center text-xl font-semibold text-foreground">
          Pengujian Selesai
        </h2>
        <p className="mb-8 max-w-md text-center text-sm text-muted-foreground">
          Pengujian telah selesai. Anda dapat mengunduh laporan hasil pengujian.
        </p>
      </div>

      {/* Download documents */}
      <div className="flex flex-wrap gap-4">
        {orderDetail.documents
          .filter((doc) =>
            ["testing_report", "lab_certificate"].includes(doc.type),
          )
          .map((doc) => (
            <div
              key={doc.id}
              className="inline-flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <FileText className="h-5 w-5 text-emerald-500" />
              </div>
              <span className="min-w-30 font-medium text-foreground">
                {doc.title || doc.type}
              </span>
              <Button
                size="icon"
                className="h-10 w-10 rounded-lg bg-blue-500 hover:bg-blue-600"
                onClick={() => window.open(getPublicUrl(doc.fileUrl), "_blank")}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ))}
      </div>
    </>
  );
}
