import { PermissionGate } from "@/components/permission-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUploadDocumentMutation } from "@/hooks/use-upload-document-mutation";
import {
  type DocumentType,
  ORDER_STATUS,
  type OrderStatus,
} from "@tepian-k3/constants";
import { Check, FileText, Loader2, Printer, Upload } from "lucide-react";
import { useRef, useState } from "react";
import GenerateOfferingDialog from "../../../worksheets/-components/generate-offering-dialog";
import GenerateSPTDialog from "../../../worksheets/-components/generate-spt-dialog";
import UploadSPTDialog from "../../../worksheets/-components/upload-spt-dialog";
import GenerateInvoiceDialog from "./generate-invoice-dialog";
import GenerateSPKDialog from "./generate-spk-dialog";

interface AdminDocumentsCardProps {
  orderId: string;
  orderStatus: OrderStatus;
  /** Used to pre-fill Nomor Acuan in the offering dialog */
  orderNumber: string;
  /** Used to pre-fill Tanggal Acuan in the offering dialog (ISO string) */
  orderDate: string;
  documents: { type: string }[];
  worksheetId?: string;
  /** Saved by Admin when generating the offering; pre-fills invoice reference */
  offeringLetterNumber?: string | null;
  offeringLetterDate?: string | null;
  /** Set by Bendahara when publishInvoice is called; pre-fills invoice billing fields */
  billingCode?: string | null;
  billingExpiryDate?: string | null;
}

/**
 * Admin-facing card consolidating Cetak (generate) + Upload actions for the
 * four order documents: Penawaran, Invoice, SPK, and SPT.
 *
 * Cetak buttons are gated by the milestone status set by the responsible role:
 * - Penawaran: after Koor. Admin's `publishOffering` (→ `penawaran_diterbitkan`)
 * - Invoice / SPK: after Bendahara's `publishInvoice` (→ `tagihan_diterbitkan`)
 * - SPT: after Tim Penjadwalan's employee assignment (→ `menunggu_penerbitan_spt_jadwal`)
 */
export default function AdminDocumentsCard({
  orderId,
  orderStatus,
  orderNumber,
  orderDate,
  documents,
  worksheetId,
  offeringLetterNumber,
  offeringLetterDate,
  billingCode,
  billingExpiryDate,
}: AdminDocumentsCardProps) {
  const [openDialog, setOpenDialog] = useState<
    | "offering"
    | "invoice"
    | "cooperation_agreement"
    | "spt"
    | "uploadSpt"
    | null
  >(null);

  const offeringInputRef = useRef<HTMLInputElement>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const spkInputRef = useRef<HTMLInputElement>(null);

  const { uploadDocument } = useUploadDocumentMutation({ orderId });
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);

  const hasDocument = (type: DocumentType) =>
    documents.some((doc) => doc.type === type);

  async function handleFileUpload(
    type: DocumentType,
    title: string,
    file: File | null,
  ) {
    if (!file) return;
    setUploadingType(type);
    try {
      await uploadDocument({ title, type, file });
    } finally {
      setUploadingType(null);
    }
  }

  // Status-based gates — each document row only unlocks once the responsible
  // role has taken the triggering action. The gate applies to BOTH the Cetak
  // and the Upload button so neither can run ahead of the prior workflow step.
  const statusIdx = ORDER_STATUS.indexOf(orderStatus);
  const canPrintOffering =
    !!worksheetId && statusIdx >= ORDER_STATUS.indexOf("penawaran_diterbitkan");
  const canPrintInvoice =
    !!worksheetId &&
    !!offeringLetterNumber &&
    statusIdx >= ORDER_STATUS.indexOf("tagihan_diterbitkan");
  const canPrintSPT =
    !!worksheetId &&
    !!offeringLetterNumber &&
    statusIdx >= ORDER_STATUS.indexOf("menunggu_penerbitan_spt_jadwal");

  // Shared lock reasons so the Cetak and Upload buttons of a row explain the
  // gate identically.
  const offeringLockReason =
    orderStatus === "penawaran_review"
      ? "Menunggu persetujuan Kepala Balai sebelum mencetak."
      : "Tunggu Koor. Admin klik Buat Penawaran.";
  const invoiceLockReason = !offeringLetterNumber
    ? "Cetak Penawaran terlebih dahulu sebelum mencetak dokumen ini."
    : "Tunggu Bendahara klik Buat Invoice.";
  const spkLockReason = !offeringLetterNumber
    ? "Cetak Penawaran terlebih dahulu sebelum mencetak dokumen ini."
    : "Tunggu Bendahara klik Buat Invoice & SPK.";
  const sptLockReason = !offeringLetterNumber
    ? "Cetak Penawaran terlebih dahulu sebelum mencetak dokumen ini."
    : "Tunggu Tim Penjadwalan mengatur jadwal dan personel.";

  return (
    <PermissionGate
      permission={[
        "documents-penawaran.create",
        "documents-spk.create",
        "documents-invoice.create",
        "documents-spt.create",
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Dokumen Penawaran &amp; Administrasi
          </CardTitle>
          <CardDescription>
            Cetak dan unggah dokumen Penawaran, Invoice, SPK, dan SPT.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <PermissionGate permission="documents-penawaran.create">
            <DocRow
              title="Penawaran"
              uploaded={hasDocument("offering_document")}
              cetak={{
                enabled: canPrintOffering,
                onClick: () => setOpenDialog("offering"),
                lockReason: offeringLockReason,
              }}
              upload={
                <UploadButton
                  inputRef={offeringInputRef}
                  loading={uploadingType === "offering_document"}
                  enabled={canPrintOffering}
                  lockReason={offeringLockReason}
                  onPick={(file) =>
                    handleFileUpload(
                      "offering_document",
                      "Surat Penawaran",
                      file,
                    )
                  }
                />
              }
            />
          </PermissionGate>

          <PermissionGate permission="documents-invoice.create">
            <DocRow
              title="Invoice"
              uploaded={hasDocument("invoice")}
              cetak={{
                enabled: canPrintInvoice,
                onClick: () => setOpenDialog("invoice"),
                lockReason: invoiceLockReason,
              }}
              upload={
                <UploadButton
                  inputRef={invoiceInputRef}
                  loading={uploadingType === "invoice"}
                  enabled={canPrintInvoice}
                  lockReason={invoiceLockReason}
                  onPick={(file) =>
                    handleFileUpload("invoice", "Invoice", file)
                  }
                />
              }
            />
          </PermissionGate>

          <PermissionGate permission="documents-spk.create">
            <DocRow
              title="SPK"
              uploaded={hasDocument("cooperation_agreement")}
              cetak={{
                enabled: canPrintInvoice,
                onClick: () => setOpenDialog("cooperation_agreement"),
                lockReason: spkLockReason,
              }}
              upload={
                <UploadButton
                  inputRef={spkInputRef}
                  loading={uploadingType === "cooperation_agreement"}
                  enabled={canPrintInvoice}
                  lockReason={spkLockReason}
                  onPick={(file) =>
                    handleFileUpload("cooperation_agreement", "Surat SPK", file)
                  }
                />
              }
            />
          </PermissionGate>

          <PermissionGate permission="documents-spt.create">
            <DocRow
              title="SPT"
              uploaded={hasDocument("assignment_letter")}
              cetak={{
                enabled: canPrintSPT,
                onClick: () => setOpenDialog("spt"),
                lockReason: sptLockReason,
              }}
              upload={
                canPrintSPT ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOpenDialog("uploadSpt")}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Button variant="outline" size="sm" disabled>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{sptLockReason}</TooltipContent>
                  </Tooltip>
                )
              }
            />
          </PermissionGate>
        </CardContent>
      </Card>

      {worksheetId && (
        <>
          <GenerateOfferingDialog
            worksheetId={worksheetId}
            orderNumber={orderNumber}
            orderDate={orderDate}
            isOpen={openDialog === "offering"}
            setIsOpen={(open) => setOpenDialog(open ? "offering" : null)}
          />
          <GenerateInvoiceDialog
            worksheetId={worksheetId}
            offeringLetterNumber={offeringLetterNumber ?? undefined}
            offeringLetterDate={offeringLetterDate ?? undefined}
            billingCode={billingCode ?? undefined}
            billingExpiryDate={billingExpiryDate ?? undefined}
            isOpen={openDialog === "invoice"}
            setIsOpen={(open) => setOpenDialog(open ? "invoice" : null)}
          />
          <GenerateSPKDialog
            worksheetId={worksheetId}
            isOpen={openDialog === "cooperation_agreement"}
            setIsOpen={(open) =>
              setOpenDialog(open ? "cooperation_agreement" : null)
            }
          />
          <GenerateSPTDialog
            worksheetId={worksheetId}
            offeringLetterNumber={offeringLetterNumber ?? undefined}
            isOpen={openDialog === "spt"}
            setIsOpen={(open) => setOpenDialog(open ? "spt" : null)}
          />
          <UploadSPTDialog
            worksheetId={worksheetId}
            orderId={orderId}
            isOpen={openDialog === "uploadSpt"}
            setIsOpen={(open) => setOpenDialog(open ? "uploadSpt" : null)}
          />
        </>
      )}
    </PermissionGate>
  );
}

interface DocRowProps {
  title: string;
  uploaded: boolean;
  cetak: { enabled: boolean; onClick: () => void; lockReason: string };
  upload: React.ReactNode;
}

function DocRow({ title, uploaded, cetak, upload }: DocRowProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{title}</span>
        {uploaded && (
          <Badge className="bg-green-100 text-green-800">
            <Check className="mr-1 h-3 w-3" />
            Terunggah
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        {cetak.enabled ? (
          <Button variant="outline" size="sm" onClick={cetak.onClick}>
            <Printer className="mr-2 h-4 w-4" />
            Cetak
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button variant="outline" size="sm" disabled>
                  <Printer className="mr-2 h-4 w-4" />
                  Cetak
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{cetak.lockReason}</TooltipContent>
          </Tooltip>
        )}
        {upload}
      </div>
    </div>
  );
}

interface UploadButtonProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  loading: boolean;
  onPick: (file: File | null) => void;
  /** When false the button is locked behind the workflow gate. */
  enabled?: boolean;
  /** Tooltip shown while the gate is locked. */
  lockReason?: string;
}

function UploadButton({
  inputRef,
  loading,
  onPick,
  enabled = true,
  lockReason,
}: UploadButtonProps) {
  if (!enabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0}>
            <Button variant="outline" size="sm" disabled>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{lockReason}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        Upload
      </Button>
    </>
  );
}
