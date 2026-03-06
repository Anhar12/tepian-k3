import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { trpc } from "@/utils/trpc";
import { getPublicUrl } from "@/utils/url";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInDays, format, isPast } from "date-fns";
import { Download, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import EditCertificationDialog from "./edit-certification-dialog";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Computes certification status based on expiry date.
 *
 * @param expiryDate - ISO date string or null/undefined if no expiry.
 * @returns "active" | "expiring" | "expired"
 */
export function getCertStatus(
  expiryDate: string | null | undefined,
): "active" | "expiring" | "expired" {
  if (!expiryDate) return "active";
  const expiry = new Date(expiryDate);
  if (isPast(expiry)) return "expired";
  if (differenceInDays(expiry, new Date()) <= 90) return "expiring";
  return "active";
}

/**
 * Formats an ISO date string to a human-readable date.
 *
 * @param dateStr - ISO date string.
 * @returns Formatted date string, e.g. "15 Mar 2025"
 */
export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), "dd MMM yyyy");
}

const statusConfig = {
  active: {
    label: "Aktif",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  expired: {
    label: "Kadaluarsa",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  expiring: {
    label: "Akan Habis",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
} as const;

// ─── Status Badge ─────────────────────────────────────────────────────────────

/**
 * Renders a colored badge for certification status.
 *
 * @param props - Component props
 * @param props.status - The status key: "active" | "expiring" | "expired"
 */
function StatusBadge({
  status,
}: {
  status: "active" | "expiring" | "expired";
}) {
  const cfg = statusConfig[status];
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}

// ─── Certification Card ────────────────────────────────────────────────────────

export interface CertificationCardData {
  id: string;
  certificationName: string;
  issuedBy: string;
  issueDate: string;
  expiryDate?: string | null;
  certificate_fileUrl: string;
}

interface CertificationCardProps {
  /** The certification data to display */
  cert: CertificationCardData;
}

/**
 * Renders a single certification as a card with status badge, download,
 * edit, and delete buttons. Handles editing and deletion internally.
 *
 * @param props - Component props
 * @param props.cert - The certification data to display
 */
export function CertificationCard({ cert }: CertificationCardProps) {
  const status = getCertStatus(cert.expiryDate);
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const deleteMutation = useMutation(
    trpc.platform.employeeCertification.delete.mutationOptions({
      onSuccess: () => {
        globalSuccessToast("Sertifikasi berhasil dihapus");
        queryClient.invalidateQueries(
          trpc.platform.employeeCertification.getMyCertifications.queryOptions(),
        );
      },
      onError: (error) => {
        globalErrorToast(`Gagal menghapus sertifikasi: ${error.message}`);
      },
    }),
  );

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-background p-3">
      <div className="mb-1 flex justify-end gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={() => setIsEditOpen(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <ConfirmationDialog
          trigger={
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          }
          title="Hapus Sertifikasi?"
          description="Tindakan ini tidak dapat dibatalkan. Sertifikasi akan dihapus secara permanen."
          confirmText="Hapus"
          variant="destructive"
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate({ certificationId: cert.id })}
        />
      </div>
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="text-sm font-semibold">{cert.certificationName}</p>
        <StatusBadge status={status} />
      </div>
      <p className="mb-2 text-xs text-muted-foreground">{cert.issuedBy}</p>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          Terbit:{" "}
          <span className="text-foreground">{formatDate(cert.issueDate)}</span>
        </span>
        {cert.expiryDate && (
          <span>
            Exp:{" "}
            <span className="text-foreground">
              {formatDate(cert.expiryDate)}
            </span>
          </span>
        )}
      </div>
      <Button
        size="sm"
        variant="outline"
        className="mt-auto w-full border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
        onClick={() =>
          window.open(getPublicUrl(cert.certificate_fileUrl), "_blank")
        }
      >
        <Download className="h-3.5 w-3.5" />
        Unduh Sertifikat
      </Button>

      <EditCertificationDialog
        cert={cert}
        isOpen={isEditOpen}
        setIsOpen={setIsEditOpen}
      />
    </div>
  );
}
