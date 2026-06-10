import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { queryClient, trpc } from "@/utils/trpc";
import { getPublicUrl } from "@/utils/url";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { OrderStatus } from "@tepian-k3/constants";
import orderSchema from "@tepian-k3/schema/pengujian/order.schema";
import type { OrderDetailWithStatus } from "@tepian-k3/types/pengujian/order.types";
import type { Document } from "@tepian-k3/types/platform/document.types";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { format } from "date-fns";
import {
  AlertCircle,
  Ban,
  Calendar,
  CalendarIcon,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileCheckIcon,
  FileText,
  Loader2,
  Upload,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "./ui/button";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Spinner } from "./ui/spinner";

// ---------------------------------------------------------------------------
// CVA variant definitions
// ---------------------------------------------------------------------------

const illustrationBoxVariants = cva(
  "mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-2",
  {
    variants: {
      colorScheme: {
        slate: "border-slate-200 bg-slate-50",
        blue: "border-blue-200 bg-blue-50",
        amber: "border-amber-200 bg-amber-50",
        purple: "border-purple-200 bg-purple-50",
        emerald: "border-emerald-200 bg-emerald-50",
      },
      dashed: {
        true: "border-dashed",
        false: "",
      },
    },
    defaultVariants: {
      colorScheme: "blue",
      dashed: true,
    },
  },
);

const illustrationIconVariants = cva("", {
  variants: {
    colorScheme: {
      slate: "text-slate-500",
      blue: "text-blue-500",
      amber: "text-amber-500",
      purple: "text-purple-500",
      emerald: "text-emerald-500",
    },
    size: {
      sm: "size-5",
      md: "size-10",
      lg: "size-12",
    },
  },
  defaultVariants: {
    colorScheme: "blue",
    size: "md",
  },
});

const bannerRootVariants = cva("rounded-xl border p-4", {
  variants: {
    colorScheme: {
      amber: "border-amber-200 bg-amber-50",
      emerald: "border-emerald-200 bg-emerald-50",
      purple: "border-purple-200 bg-purple-50",
    },
  },
});

const bannerIconBoxVariants = cva(
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
  {
    variants: {
      colorScheme: {
        amber: "bg-amber-100",
        emerald: "bg-emerald-100",
        purple: "bg-purple-100",
      },
    },
  },
);

const bannerIconVariants = cva("size-5", {
  variants: {
    colorScheme: {
      amber: "text-amber-600",
      emerald: "text-emerald-600",
      purple: "text-purple-600",
    },
  },
});

const bannerTitleVariants = cva("font-medium", {
  variants: {
    colorScheme: {
      amber: "text-amber-800",
      emerald: "text-emerald-800",
      purple: "text-purple-800",
    },
  },
});

const bannerDescVariants = cva("mt-1 text-sm", {
  variants: {
    colorScheme: {
      amber: "text-amber-700",
      emerald: "text-emerald-700",
      purple: "text-purple-700",
    },
  },
});

const docCardIconBoxVariants = cva(
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
  {
    variants: {
      colorScheme: {
        blue: "bg-blue-100",
        emerald: "bg-emerald-100",
      },
    },
    defaultVariants: {
      colorScheme: "blue",
    },
  },
);

const docCardIconVariants = cva("size-5", {
  variants: {
    colorScheme: {
      blue: "text-blue-500",
      emerald: "text-emerald-500",
    },
  },
  defaultVariants: {
    colorScheme: "blue",
  },
});

// ---------------------------------------------------------------------------
// Reusable sub-components
// ---------------------------------------------------------------------------

interface DocumentCardProps {
  /** Document title shown in the card label */
  title: string;
  /** URL of the document file. When `undefined` the download button is disabled. */
  fileUrl?: string;
  /** Icon color theme — `"blue"` (default) or `"emerald"` for verified documents. */
  colorScheme?: VariantProps<typeof docCardIconBoxVariants>["colorScheme"];
  /** Custom icon component. Defaults to `FileText` when omitted. */
  icon?: LucideIcon;
  /** Whether to show the download button. Defaults to `true`. */
  showDownload?: boolean;
}

/**
 * Compact card for downloading a single document.
 *
 * @param props - Component props
 * @param props.title - Document title shown in the card label
 * @param props.fileUrl - URL of the document file. When `undefined` the download button is disabled.
 * @param props.colorScheme - Icon color theme — `"blue"` (default) or `"emerald"` for verified documents.
 * @param props.icon - Custom icon component. Defaults to `FileText` when omitted.
 *
 * @example
 * ```tsx
 * <DocumentCard title="Invoice" fileUrl={doc.fileUrl} />
 * <DocumentCard title="Lab Certificate" fileUrl={doc.fileUrl} colorScheme="emerald" />
 * <DocumentCard title="Certificate" fileUrl={doc.fileUrl} icon={Award} colorScheme="emerald" />
 * ```
 */
export function DocumentCard({
  title,
  fileUrl,
  colorScheme = "blue",
  icon: Icon = FileText,
  showDownload = true,
}: DocumentCardProps) {
  return (
    <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 sm:inline-flex sm:w-auto sm:gap-4 sm:px-4 sm:pr-3">
      <div className={docCardIconBoxVariants({ colorScheme })}>
        <Icon className={docCardIconVariants({ colorScheme })} />
      </div>
      <span className="min-w-0 flex-1 truncate font-medium text-foreground sm:min-w-30 sm:flex-none">
        {title}
      </span>
      {showDownload && (
        <Button
          size="icon"
          className="h-10 w-10 shrink-0 rounded-lg bg-blue-500 hover:bg-blue-600"
          onClick={() => {
            if (fileUrl) {
              window.open(getPublicUrl(fileUrl), "_blank");
            }
          }}
          disabled={!fileUrl}
        >
          <Download className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

interface FileUploadCardProps {
  /** Unique HTML `id` for the hidden file input. */
  id: string;
  /** Label displayed in the card. */
  title: string;
  /** Currently selected file, or `null` when nothing is selected. */
  file: File | null;
  /** Called when the user picks a file. Perform validation here before storing it. */
  onFileSelect: (file: File) => void;
  /** Accepted file types passed to the `<input>` element (e.g. `".pdf,.jpg"`). */
  accept: string;
  /**
   * Custom content rendered when a file is selected.
   * When omitted the card shows a green "✓ filename" indicator and switches
   * the icon color to emerald.
   */
  selectedContent?: React.ReactNode;
}

/**
 * Card with a hidden file input that lets the user pick a file for upload.
 *
 * @example
 * ```tsx
 * // Default selected indicator (green checkmark)
 * <FileUploadCard id="proof" title="Bukti" file={file} onFileSelect={setFile} accept=".pdf" />
 *
 * // Custom action when selected (e.g. an upload button)
 * <FileUploadCard id="letter" title="Surat" file={file} onFileSelect={setFile} accept=".pdf"
 *   selectedContent={<Button onClick={handleUpload}>Upload</Button>}
 * />
 * ```
 */
export function FileUploadCard({
  id,
  title,
  file,
  onFileSelect,
  accept,
  selectedContent,
}: FileUploadCardProps) {
  const hasFile = !!file;
  const showDefaultSelected = hasFile && !selectedContent;
  const iconColor = showDefaultSelected ? "emerald" : "blue";

  return (
    <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 sm:inline-flex sm:w-auto sm:gap-4 sm:px-4 sm:pr-3">
      <div className={docCardIconBoxVariants({ colorScheme: iconColor })}>
        <FileText className={docCardIconVariants({ colorScheme: iconColor })} />
      </div>
      <span className="min-w-0 flex-1 truncate font-medium text-foreground sm:min-w-30 sm:flex-none">
        {title}
      </span>
      {!hasFile ? (
        <label htmlFor={id}>
          <Input
            id={id}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) onFileSelect(selected);
            }}
          />
          <Button
            size="icon"
            className="h-10 w-10 shrink-0 cursor-pointer rounded-lg bg-blue-500 hover:bg-blue-600"
            asChild
          >
            <span>
              <Upload className="h-4 w-4" />
            </span>
          </Button>
        </label>
      ) : selectedContent ? (
        selectedContent
      ) : (
        <span className="shrink-0 truncate text-sm text-emerald-600 sm:max-w-32">
          ✓ {file.name}
        </span>
      )}
    </div>
  );
}

interface StatusIllustrationProps {
  /** Primary icon rendered inside the illustration box. */
  icon: LucideIcon;
  /** Optional secondary icon at the bottom-right corner of the primary icon. */
  overlayIcon?: LucideIcon;
  /** Extra classes for the overlay icon (e.g. `"animate-spin"`). */
  overlayIconClassName?: string;
  /** Override the icon text-color class derived from `colorScheme`. */
  iconClassName?: string;
  /** Heading text shown below the icon. */
  heading?: string;
  /** Heading HTML tag — `"h2"` (default) or `"h3"`. Styles adjust automatically. */
  headingAs?: "h2" | "h3";
  /** Description text shown below the heading. */
  description?: string;
  /** Color theme for the illustration box border, background and icon. */
  colorScheme: NonNullable<
    VariantProps<typeof illustrationBoxVariants>["colorScheme"]
  >;
  /** Show a dashed border on the icon box (default `true`). */
  dashed?: boolean;
  /** Icon size — `"sm"` (20 px), `"md"` (40 px, default) or `"lg"` (48 px). */
  iconSize?: "sm" | "md" | "lg";
  /** Overlay icon size — `"sm"` (20 px, default), `"md"` (40 px) or `"lg"` (48 px). */
  overlayIconSize?: "sm" | "md" | "lg";
  /** Extra classes appended to the outer container (e.g. `"h-full w-full self-center"`). */
  className?: string;
}

/**
 * Centered illustration block with an icon, optional overlay, heading and description.
 * Used as the hero section inside status-state cards.
 *
 * @example
 * ```tsx
 * <StatusIllustration
 *   icon={Calendar}
 *   overlayIcon={Clock}
 *   heading="Menunggu Jadwal"
 *   description="Pembayaran telah diverifikasi."
 *   colorScheme="blue"
 * />
 * ```
 */
export function StatusIllustration({
  icon: Icon,
  overlayIcon: OverlayIcon,
  overlayIconClassName,
  iconClassName,
  heading,
  headingAs = "h2",
  description,
  colorScheme,
  dashed = true,
  iconSize = "md",
  overlayIconSize = "sm",
  className,
}: StatusIllustrationProps) {
  const iconColor = cn(
    illustrationIconVariants({ colorScheme, size: iconSize }),
    iconClassName,
  );
  const overlayColor = iconClassName
    ? cn(
        "absolute -right-1 -bottom-1",
        illustrationIconVariants({ size: overlayIconSize }),
        iconClassName,
        overlayIconClassName,
      )
    : cn(
        "absolute -right-1 -bottom-1",
        illustrationIconVariants({ colorScheme, size: overlayIconSize }),
        overlayIconClassName,
      );
  const HeadingTag = headingAs;
  const headingClass =
    headingAs === "h3"
      ? "mb-2 text-center text-lg font-medium text-foreground"
      : "mb-2 text-center text-xl font-semibold text-foreground";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-8",
        className,
      )}
    >
      <div className={illustrationBoxVariants({ colorScheme, dashed })}>
        {OverlayIcon ? (
          <div className="relative">
            <Icon className={iconColor} />
            <OverlayIcon className={overlayColor} />
          </div>
        ) : (
          <Icon className={iconColor} />
        )}
      </div>
      {heading && <HeadingTag className={headingClass}>{heading}</HeadingTag>}
      {description && (
        <p className="mb-8 max-w-md text-center text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

interface StatusInfoBannerProps {
  /** Icon displayed in the banner's accent box. */
  icon: LucideIcon;
  /** Banner title. */
  title: string;
  /** Short description text. */
  description: string;
  /** Color theme for the banner. */
  colorScheme: NonNullable<
    VariantProps<typeof bannerRootVariants>["colorScheme"]
  >;
  /** Extra classes appended to the outer container (e.g. `"mb-4"`). */
  className?: string;
  /** Additional content rendered below the description (e.g. a revision-note card). */
  children?: React.ReactNode;
}

/**
 * Colored information banner with icon, title, description and optional children.
 *
 * @example
 * ```tsx
 * <StatusInfoBanner
 *   icon={CheckCircle2}
 *   title="Pembayaran Terverifikasi"
 *   description="Pembayaran Anda telah dikonfirmasi oleh admin."
 *   colorScheme="emerald"
 * />
 * ```
 */
export function StatusInfoBanner({
  icon: Icon,
  title,
  description,
  colorScheme,
  children,
  className,
}: StatusInfoBannerProps) {
  return (
    <div className={cn(bannerRootVariants({ colorScheme }), className)}>
      <div className="flex items-start gap-3">
        <div className={bannerIconBoxVariants({ colorScheme })}>
          <Icon className={bannerIconVariants({ colorScheme })} />
        </div>
        <div className="flex-1">
          <h3 className={bannerTitleVariants({ colorScheme })}>{title}</h3>
          <p className={bannerDescVariants({ colorScheme })}>{description}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal layout
// ---------------------------------------------------------------------------

function StateLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full flex-1 flex-col">{children}</div>;
}

// ---------------------------------------------------------------------------
// Status-state components
// ---------------------------------------------------------------------------

interface SharedStatusStateProps {
  orderDetail: OrderDetailWithStatus;
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

      <StatusInfoBanner
        icon={Clock}
        title="Menunggu Revisi Dokumen"
        description="Admin sedang memproses permintaan revisi Anda."
        colorScheme="amber"
      >
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
      </StatusInfoBanner>
    </StateLayout>
  );
}

export function StatusStateContactRevisionRequested({
  orderDetail,
}: SharedStatusStateProps) {
  const resubmitMutation = useMutation(
    trpc.pengujian.order.resubmitForApproval.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.order.getOrderWithDocuments.queryOptions({
            orderId: orderDetail.id,
          }),
        );
        globalSuccessToast("Order berhasil dikirim ulang untuk persetujuan");
      },
      onError: (error) => {
        globalErrorToast("Gagal mengirim ulang order: " + error.message);
      },
    }),
  );

  return (
    <StateLayout>
      <h2 className="mb-2 text-xl font-semibold text-foreground">
        {`Order #${orderDetail.orderNumber} - Perlu Koreksi Data`}
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Admin meminta Anda memperbaiki data kontak perusahaan sebelum order
        dapat diproses lebih lanjut.
      </p>

      <StatusInfoBanner
        icon={AlertCircle}
        title="Koreksi Data Kontak Diperlukan"
        description="Perbaiki data kontak perusahaan Anda (email atau nama contact person), lalu kirim ulang order ini."
        colorScheme="amber"
      >
        {orderDetail.revisionNotes && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-white p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Catatan dari Admin:
            </p>
            <p className="mt-1 text-sm text-foreground">
              {orderDetail.revisionNotes}
            </p>
          </div>
        )}
        <div className="mt-4 flex flex-row justify-end gap-2">
          <Link
            to="/dashboard/company/$companyId/edit"
            params={{ companyId: orderDetail.company?.id ?? "" }}
            className={cn(Button({ variant: "outline", size: "sm" }))}
          >
            Edit Data Kontak
          </Link>

          <Button
            onClick={() => resubmitMutation.mutate({ orderId: orderDetail.id })}
            disabled={resubmitMutation.isPending}
            className="bg-amber-500 text-white hover:bg-amber-600"
          >
            {resubmitMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Sudah Diperbaiki, Kirim Ulang
          </Button>
        </div>
      </StatusInfoBanner>
    </StateLayout>
  );
}

export function StatusStateRequestReview({
  orderDetail,
}: SharedStatusStateProps) {
  return (
    <StateLayout>
      <h2 className="mb-2 text-xl font-semibold text-foreground">
        {`Order #${orderDetail.orderNumber} - Menunggu Konfirmasi Admin`}
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Koreksi data telah dikirim. Menunggu admin memeriksa dan mengkonfirmasi
        perbaikan Anda.
      </p>

      <StatusInfoBanner
        icon={AlertCircle}
        title="Koreksi Sedang Diperiksa"
        description="Admin akan memeriksa perbaikan data Anda dan mengembalikan order ke antrean jika sudah sesuai."
        colorScheme="amber"
      >
        {orderDetail.revisionNotes && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-white p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Catatan dari Admin:
            </p>
            <p className="mt-1 text-sm text-foreground">
              {orderDetail.revisionNotes}
            </p>
          </div>
        )}
      </StatusInfoBanner>
    </StateLayout>
  );
}

export function StatusStatePendingReview({
  orderDetail,
}: SharedStatusStateProps) {
  return (
    <StateLayout>
      <h2 className="mb-2 text-xl font-semibold text-foreground">
        {`Order #${orderDetail.orderNumber} - Menunggu Kaji Ulang`}
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Order pengujian telah diterima. Admin sedang melakukan kaji ulang teknis
        untuk menentukan parameter, alat, dan estimasi waktu pengujian.
      </p>
      <StatusIllustration
        icon={FileCheckIcon}
        colorScheme="slate"
        iconClassName="text-green-500"
        className="h-full w-full self-center"
      />
    </StateLayout>
  );
}

interface StatusStateWorksheetInReviewProps extends SharedStatusStateProps {
  worksheetStatus: string;
}

export function StatusStateWorksheetInReview({
  orderDetail,
  worksheetStatus,
}: StatusStateWorksheetInReviewProps) {
  const statusText: Record<string, string> = {
    draft: "Worksheet sedang dibuat",
    pending_verification: "Worksheet menunggu verifikasi koordinator",
    revision: "Worksheet perlu direvisi",
    rejected: "Worksheet ditolak oleh koordinator",
  };
  const displayText =
    statusText[worksheetStatus] ?? "Worksheet dalam proses kaji ulang";
  const colorScheme =
    worksheetStatus === "revision" || worksheetStatus === "rejected"
      ? "amber"
      : "blue";

  return (
    <StateLayout>
      <h2 className="mb-2 text-xl font-semibold text-foreground">
        {`Order #${orderDetail.orderNumber} - Kaji Ulang Teknis`}
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Tim kami sedang melakukan kaji ulang teknis untuk order pengujian Anda.
      </p>

      <StatusIllustration
        icon={FileText}
        overlayIcon={Clock}
        heading={displayText}
        headingAs="h3"
        description="Koordinator akan memverifikasi kelayakan teknis, menentukan tim pengujian, dan menyiapkan dokumen penawaran."
        colorScheme={colorScheme}
        className="h-full w-full self-center"
      />
    </StateLayout>
  );
}

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

      <StatusIllustration
        icon={CheckCircle2}
        heading="Kaji Ulang Teknis Selesai"
        headingAs="h3"
        description="Worksheet telah diverifikasi. Admin sedang menyiapkan dokumen penawaran untuk Anda."
        colorScheme="emerald"
        className="h-full w-full self-center"
      />
    </StateLayout>
  );
}

interface StatusStateOfferPublishedProps extends SharedStatusStateProps {
  offeringDoc: Document | undefined;
}

export function StatusStateOfferPublished({
  orderDetail,
  offeringDoc,
}: StatusStateOfferPublishedProps) {
  return (
    <StateLayout>
      <h2 className="mb-2 text-xl font-semibold text-foreground">
        {`Order #${orderDetail.orderNumber} - Penawaran Diterbitkan`}
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Penawaran telah diterbitkan, setujui penawaran untuk melanjutkan ke
        tahap pembayaran.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row">
        <DocumentCard title="Surat Penawaran" fileUrl={offeringDoc?.fileUrl} />
      </div>
    </StateLayout>
  );
}

interface StatusStateUploadApprovalProps {
  approvalLetterFile: File | null;
  setApprovalLetterFile: (file: File | null) => void;
  uploadingApprovalLetter: boolean;
  handleUploadApprovalLetter: () => void;
}

export function StatusStateUploadApproval({
  approvalLetterFile,
  setApprovalLetterFile,
  uploadingApprovalLetter,
  handleUploadApprovalLetter,
}: StatusStateUploadApprovalProps) {
  return (
    <StateLayout>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          Upload Surat Persetujuan
        </h3>
        <p className="text-sm text-muted-foreground">
          Silakan unggah surat persetujuan yang telah ditandatangani untuk
          melanjutkan ke tahap berikutnya.
        </p>

        <FileUploadCard
          id="approval-letter-input"
          title="Surat Persetujuan"
          file={approvalLetterFile}
          onFileSelect={(file) => {
            if (file.type !== "application/pdf") {
              globalErrorToast("Format file harus PDF");
              return;
            }
            setApprovalLetterFile(file);
          }}
          accept=".pdf"
          selectedContent={
            <Button
              size="sm"
              className="shrink-0 rounded-lg bg-blue-500 hover:bg-blue-600"
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
          }
        />

        {approvalLetterFile && (
          <p className="text-sm text-muted-foreground">
            File terpilih: {approvalLetterFile.name}
          </p>
        )}
      </div>
    </StateLayout>
  );
}

export function StatusStateAwaitingInvoice() {
  return (
    <StateLayout>
      <StatusIllustration
        icon={FileText}
        overlayIcon={Clock}
        heading="Menunggu Dokumen Tagihan"
        description="Surat persetujuan telah diunggah. Mohon tunggu admin untuk menerbitkan invoice dan surat perjanjian kerjasama."
        colorScheme="blue"
        className="h-full"
      />
    </StateLayout>
  );
}

interface StatusStateUploadPaymentProps {
  invoiceDoc: Document | undefined;
  cooperationAgreementDoc: Document | undefined;
  paymentProofFile: File | null;
  setPaymentProofFile: (file: File | null) => void;
  cooperationAgreementFile: File | null;
  setCooperationAgreementFile: (file: File | null) => void;
  uploadingPaymentDocs: boolean;
  handleUploadPaymentDocs: () => void;
  /** When set, shows a rejection banner above the upload form. */
  rejectionReason?: string | null;
}

export function StatusStateUploadPayment({
  invoiceDoc,
  cooperationAgreementDoc,
  paymentProofFile,
  setPaymentProofFile,
  cooperationAgreementFile,
  setCooperationAgreementFile,
  uploadingPaymentDocs,
  handleUploadPaymentDocs,
  rejectionReason,
}: StatusStateUploadPaymentProps) {
  return (
    <StateLayout>
      {rejectionReason != null ? (
        <StatusInfoBanner
          icon={AlertCircle}
          title="Pembayaran Ditolak"
          description={
            rejectionReason ||
            "Bukti pembayaran Anda ditolak. Silakan unggah ulang dokumen yang benar."
          }
          colorScheme="amber"
          className="mb-6"
        />
      ) : (
        <StatusIllustration
          icon={CreditCard}
          overlayIcon={Upload}
          heading="Upload Bukti Pembayaran"
          description="Silakan unduh invoice dan surat perjanjian kerjasama, lakukan pembayaran, dan unggah bukti pembayaran beserta surat perjanjian yang telah ditandatangani."
          colorScheme="blue"
        />
      )}

      {/* Download Documents Section */}
      <div className="mb-6 space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          Dokumen Tagihan
        </h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <DocumentCard title="Invoice" fileUrl={invoiceDoc?.fileUrl} />
          <DocumentCard
            title="Surat Perjanjian"
            fileUrl={cooperationAgreementDoc?.fileUrl}
          />
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

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <FileUploadCard
            id="payment-proof-input"
            title="Bukti Pembayaran"
            file={paymentProofFile}
            onFileSelect={setPaymentProofFile}
            accept=".pdf,.jpg,.jpeg,.png"
          />
          <FileUploadCard
            id="cooperation-agreement-input"
            title="Surat Perjanjian"
            file={cooperationAgreementFile}
            onFileSelect={(file) => {
              if (file.type !== "application/pdf") {
                globalErrorToast("Format file harus PDF");
                return;
              }
              setCooperationAgreementFile(file);
            }}
            accept=".pdf"
          />
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

interface StatusStatePendingPaymentVerificationProps {
  paymentProofDoc: Document | undefined;
  cooperationAgreementUserDoc: Document | undefined;
}

export function StatusStatePendingPaymentVerification({
  cooperationAgreementUserDoc,
  paymentProofDoc,
}: StatusStatePendingPaymentVerificationProps) {
  return (
    <StateLayout>
      <StatusIllustration
        icon={CreditCard}
        overlayIcon={Clock}
        heading="Menunggu Verifikasi Pembayaran"
        description="Dokumen pembayaran telah diunggah. Mohon tunggu admin untuk memverifikasi pembayaran Anda."
        colorScheme="amber"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
        {paymentProofDoc && (
          <DocumentCard
            title="Bukti Pembayaran"
            fileUrl={paymentProofDoc.fileUrl}
            colorScheme="emerald"
          />
        )}
        {cooperationAgreementUserDoc && (
          <DocumentCard
            title="Surat Perjanjian"
            fileUrl={cooperationAgreementUserDoc.fileUrl}
            colorScheme="emerald"
          />
        )}
      </div>
    </StateLayout>
  );
}

export function StatusStateAwaitingSchedule() {
  return (
    <StateLayout>
      <StatusIllustration
        icon={Calendar}
        overlayIcon={Clock}
        heading="Menunggu Jadwal Pengujian"
        description="Pembayaran telah diverifikasi. Mohon tunggu penerbitan Surat Perintah Tugas (SPT) dan jadwal pengujian."
        colorScheme="blue"
      />

      <StatusInfoBanner
        icon={CheckCircle2}
        title="Pembayaran Terverifikasi"
        description="Pembayaran Anda telah dikonfirmasi oleh admin."
        colorScheme="emerald"
      />
    </StateLayout>
  );
}

export function StatusStateTestingInProgress({
  orderDetail,
}: SharedStatusStateProps) {
  const form = useForm<
    z.infer<typeof orderSchema.createArrivalDepartureDateSchema>
  >({
    resolver: zodResolver(orderSchema.createArrivalDepartureDateSchema),
    defaultValues: {
      orderId: orderDetail.id,
      arrivalDate: orderDetail.arrivalDate
        ? new Date(orderDetail.arrivalDate).toISOString()
        : undefined,
      departureDate: orderDetail.departureDate
        ? new Date(orderDetail.departureDate).toISOString()
        : undefined,
    },
  });

  const createArrivalDepartureMutation = useMutation({
    ...trpc.pengujian.order.createArrivalDepartureDate.mutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries(
        trpc.pengujian.order.getOrderWithDocuments.queryOptions({
          orderId: orderDetail.id,
        }),
      );
      globalSuccessToast(
        "Tanggal kedatangan atau keberangkatan berhasil disimpan",
      );
    },
    onError: (error) => {
      globalErrorToast(
        error.message || "Gagal menyimpan tanggal kedatangan dan keberangkatan",
      );
    },
  });

  const handleSubmit = (
    data: z.infer<typeof orderSchema.createArrivalDepartureDateSchema>,
  ) => {
    createArrivalDepartureMutation.mutate({
      orderId: data.orderId,
      arrivalDate: data.arrivalDate,
      departureDate: data.departureDate,
    });
  };

  // 1. Tanggal Pengujian (dari worksheet)
  const dateRange =
    orderDetail.worksheet?.startDate && orderDetail.worksheet?.endDate
      ? `${format(new Date(orderDetail.worksheet.startDate), "d")} - ${format(
          new Date(orderDetail.worksheet.endDate),
          "d MMMM yyyy",
        )}`
      : null;

  // 2. Surat Perintah Tugas
  const assignmentLetterDoc = orderDetail.documents?.find(
    (d) => d.type === "assignment_letter",
  );

  // 3. Berita Acara
  const beritaAcaraDoc = orderDetail.documents?.find(
    (d) => d.type === "testing_report",
  );

  return (
    <StateLayout>
      <StatusIllustration
        icon={Calendar}
        overlayIcon={Loader2}
        overlayIconClassName="animate-spin"
        heading="Pengujian Sedang Berlangsung"
        description="Tim kami sedang melakukan pengujian sesuai jadwal. Mohon tunggu hasil pengujian."
        colorScheme="purple"
        className="h-full"
      />

      {dateRange && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-row flex-wrap items-start gap-4">
            {/* Date range */}
            <DocumentCard
              title={dateRange ?? "Tanggal belum ditentukan"}
              colorScheme="blue"
              icon={Calendar}
              showDownload={false}
            />

            {/* Surat Perintah Tugas */}
            {assignmentLetterDoc && (
              <DocumentCard
                title="Surat Perintah Tugas"
                fileUrl={assignmentLetterDoc.fileUrl}
                colorScheme="blue"
              />
            )}

            {/* Berita Acara */}
            {beritaAcaraDoc && (
              <DocumentCard
                title="Berita Acara"
                fileUrl={beritaAcaraDoc.fileUrl}
                colorScheme="blue"
              />
            )}
          </div>
          {/* Lihat Sertifikasi */}
          <Link
            to="/pengujian/sertifikat"
            search={{ orderId: orderDetail.id }}
            target="_blank"
          >
            <Button variant="outline" className="mb-4 w-full">
              Lihat Sertifikat
            </Button>
          </Link>
        </div>
      )}

      {orderDetail.testing && (
        <StatusInfoBanner
          icon={Calendar}
          title="Informasi Pengujian"
          description={`No. Testing: ${orderDetail.testing.testingNumber}`}
          colorScheme="purple"
          className="mb-4"
        />
      )}

      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex w-[calc(100%-theme(space.1))] flex-col gap-4"
      >
        <FieldGroup>
          <div className="flex flex-row gap-4">
            <Controller
              control={form.control}
              name="arrivalDate"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-1">
                  <FieldLabel className="ml-1 text-sm font-bold">
                    Tanggal Kedatangan
                  </FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-60 pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                        disabled={!!orderDetail.arrivalDate} // Disable if arrival date is set
                      >
                        {field.value
                          ? format(new Date(field.value), "PPP")
                          : "Pick a date"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={new Date(field.value ?? "")}
                        onSelect={(value) => {
                          field.onChange(value?.toISOString() ?? null);
                        }}
                        autoFocus
                        disabled={!!orderDetail.arrivalDate} // Disable if departure date is set
                      />
                    </PopoverContent>
                  </Popover>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="departureDate"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-1">
                  <FieldLabel className="ml-1 text-sm font-bold">
                    Tanggal Keberangkatan
                  </FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-60 pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                        disabled={!!orderDetail.departureDate} // Disable if departure date is set
                      >
                        {field.value
                          ? format(new Date(field.value), "PPP")
                          : "Pick a date"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={new Date(field.value ?? "")}
                        onSelect={(value) => {
                          field.onChange(value?.toISOString() ?? null);
                        }}
                        autoFocus
                        disabled={!!orderDetail.departureDate} // Disable if departure date is set
                      />
                    </PopoverContent>
                  </Popover>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
        </FieldGroup>

        {!(orderDetail.arrivalDate && orderDetail.departureDate) && (
          <Button
            type="submit"
            disabled={createArrivalDepartureMutation.isPending}
            className="self-end"
          >
            {createArrivalDepartureMutation.isPending ? <Spinner /> : null}
            Simpan Tanggal
          </Button>
        )}
      </form>
    </StateLayout>
  );
}

export function StatusStateCompleted({ orderDetail }: SharedStatusStateProps) {
  return (
    <StateLayout>
      <StatusIllustration
        icon={CheckCircle2}
        heading="Pengujian Selesai"
        description="Pengujian telah selesai. Anda dapat mengunduh laporan hasil pengujian."
        colorScheme="emerald"
        dashed={false}
        iconSize="lg"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
        {orderDetail.documents
          .filter((doc) =>
            ["testing_report", "lab_certificate"].includes(doc.type),
          )
          .map((doc) => (
            <DocumentCard
              key={doc.id}
              title={doc.title || doc.type}
              fileUrl={doc.fileUrl}
              colorScheme="emerald"
            />
          ))}
      </div>
    </StateLayout>
  );
}

export function StatusStateRejected({ orderDetail }: SharedStatusStateProps) {
  return (
    <StateLayout>
      <StatusIllustration
        icon={XCircle}
        heading="Order Ditolak"
        description="Order pengujian ini telah ditolak oleh admin."
        colorScheme="slate"
        dashed={false}
        iconSize="lg"
        className="h-full w-full self-center"
      />
      {orderDetail.approvalRejectReason && (
        <StatusInfoBanner
          icon={AlertCircle}
          title="Alasan Penolakan"
          description={orderDetail.approvalRejectReason}
          colorScheme="amber"
        />
      )}
    </StateLayout>
  );
}

export function StatusStateCancelled({ orderDetail }: SharedStatusStateProps) {
  return (
    <StateLayout>
      <StatusIllustration
        icon={Ban}
        heading={`Order #${orderDetail.orderNumber} Dibatalkan`}
        description="Order pengujian ini telah dibatalkan."
        colorScheme="slate"
        dashed={false}
        iconSize="lg"
        className="h-full w-full self-center"
      />
    </StateLayout>
  );
}
