import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { base64ToBlobUrl, openBase64InNewTab } from "@/utils/download";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import generateDocumentSchema from "@tepian-k3/schema/pengujian/generate-document.schema";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft, ArrowRight, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type z from "zod";
import {
  QRSignaturePlacer,
  type SignaturePosition,
  type SignerInfo,
} from "@/components/document-signing";

interface GenerateInvoiceDialogProps {
  worksheetId: string;
  /** Pre-filled from the previously generated offering letter */
  offeringLetterNumber?: string;
  offeringLetterDate?: string;
  /** Pre-filled from Bendahara's publishInvoice action */
  billingCode?: string;
  billingExpiryDate?: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function GenerateInvoiceDialog({
  worksheetId,
  offeringLetterNumber,
  offeringLetterDate,
  billingCode,
  billingExpiryDate,
  isOpen,
  setIsOpen,
}: GenerateInvoiceDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [signatures, setSignatures] = useState<SignaturePosition[]>([]);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | undefined>(
    undefined,
  );

  const meQuery = useQuery(trpc.platform.auth.me.queryOptions());
  const currentUser = meQuery.data;

  const defaultSigners: SignerInfo[] = currentUser
    ? [
        {
          userId: currentUser.id,
          userName: currentUser.name || "Bendahara Penerimaan",
          purpose: "Bendahara Penerimaan",
        },
      ]
    : [];

  const form = useForm<
    z.input<typeof generateDocumentSchema.generateTagihanDocumentSchema>
  >({
    resolver: zodResolver(generateDocumentSchema.generateTagihanDocumentSchema),
    defaultValues: { worksheetId, signatures: [] },
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSignatures([]);
      if (offeringLetterNumber)
        form.setValue("referenceNumber", offeringLetterNumber);
      if (offeringLetterDate)
        form.setValue("referenceDate", offeringLetterDate);
      if (billingCode) form.setValue("billingCode", billingCode);
      if (billingExpiryDate)
        form.setValue("billingExpiryDate", billingExpiryDate);
    } else {
      form.reset({ worksheetId });
    }
  }, [
    isOpen,
    offeringLetterNumber,
    offeringLetterDate,
    billingCode,
    billingExpiryDate,
    worksheetId,
    form,
  ]);

  const generateInvoiceMutation = useMutation(
    trpc.pengujian.generateDocument.generateTagihanDocument.mutationOptions({
      onSuccess: (data) => {
        globalSuccessToast("Tagihan berhasil dibuat");
        openBase64InNewTab(data.base64, data.contentType);
        setIsOpen(false);
      },
      onError: (error) => {
        globalErrorToast("Gagal membuat Tagihan : " + (error?.message || ""));
      },
    }),
  );

  function handleSubmit(
    data: z.input<typeof generateDocumentSchema.generateTagihanDocumentSchema>,
  ) {
    const finalData = {
      ...data,
      signatures: signatures.map((s) => ({
        userId: s.userId,
        userName: s.userName,
        purpose: s.purpose,
        page: s.page ?? 0,
        x: s.x ?? 450,
        y: s.y ?? 700,
        width: s.width ?? 100,
        height: s.height ?? 100,
      })),
    };
    generateInvoiceMutation.mutate(finalData);
  }

  const previewTagihanMutation = useMutation(
    trpc.pengujian.generateDocument.previewTagihanDocument.mutationOptions({
      onSuccess: (data) => {
        setPdfPreviewUrl(base64ToBlobUrl(data.base64, data.contentType));
      },
      onError: (error) => {
        globalErrorToast(
          "Gagal memuat pratinjau dokumen: " + (error?.message || ""),
        );
      },
    }),
  );

  const handleNextToSignature = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    if (signatures.length === 0 && currentUser) {
      setSignatures([
        {
          userId: currentUser.id,
          userName: currentUser.name || "Bendahara Penerimaan",
          purpose: "Bendahara Penerimaan",
          page: 0,
          x: 600,
          y: 900,
          width: 100,
          height: 100,
        },
      ]);
    }

    setPdfPreviewUrl(undefined);
    previewTagihanMutation.mutate({
      ...form.getValues(),
      signatures: [],
    });

    setStep(2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className={
          step === 2
            ? "flex max-h-[90vh] w-[95vw] max-w-5xl flex-col overflow-hidden p-0"
            : "max-w-md"
        }
      >
        <DialogHeader className={step === 2 ? "border-b px-6 py-4" : ""}>
          <DialogTitle>
            {step === 1
              ? "Cetak Tagihan"
              : "Posisi Tanda Tangan Digital (QR Code)"}
          </DialogTitle>
          <DialogDescription className={step === 2 ? "hidden" : ""}>
            {step === 1
              ? "Isi nomor surat untuk mencetak tagihan. Data referensi dan billing telah terisi otomatis."
              : "Atur posisi dan ukuran QR Code tanda tangan digital pada dokumen."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNextToSignature();
            }}
            className="grid gap-4 p-6 pt-0"
          >
            <FieldGroup>
              <Controller
                control={form.control}
                name="letterNumber"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Nomor Surat Tagihan / SPK
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan nomor surat"
                      className="h-10 text-sm"
                      {...field}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="referenceNumber"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Nomor Acuan Surat Penawaran
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan nomor acuan penawaran"
                      className="h-10 text-sm"
                      {...field}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="referenceDate"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Tanggal Referensi{" "}
                      <span className="font-normal text-muted-foreground">
                        (dari penawaran)
                      </span>
                    </FieldLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-60 pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value
                            ? format(new Date(field.value), "PPP")
                            : "Pilih tanggal"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={(value) => {
                            field.onChange(value?.toISOString() ?? null);
                          }}
                          autoFocus
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
                name="billingCode"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Kode Billing (SIMPONI / MPN)
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan kode billing"
                      className="h-10 text-sm"
                      {...field}
                      value={field.value ?? ""}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="billingExpiryDate"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Batas Waktu Pembayaran (Expiry Billing)
                    </FieldLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-60 pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value
                            ? format(new Date(field.value), "PPP")
                            : "Pick a date"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={(value) => {
                            field.onChange(value?.toISOString() ?? null);
                          }}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
            <DialogFooter className="flex gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Batal
                </Button>
              </DialogClose>
              <Button
                type="button"
                variant="secondary"
                onClick={form.handleSubmit((data) => {
                  setSignatures([]);
                  generateInvoiceMutation.mutate({
                    ...data,
                    signatures: [],
                  });
                })}
                disabled={generateInvoiceMutation.isPending}
              >
                Cetak Tanpa QR
              </Button>
              <Button type="submit">
                Atur Posisi TTD <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <QRSignaturePlacer
                signers={defaultSigners}
                positions={signatures}
                onChange={setSignatures}
                pdfPreviewUrl={pdfPreviewUrl}
                maxPages={5}
              />
            </div>
            <DialogFooter className="border-t bg-muted/20 px-6 py-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Kembali
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit(handleSubmit)}
                disabled={generateInvoiceMutation.isPending}
              >
                {generateInvoiceMutation.isPending ? (
                  <Spinner className="mr-2" />
                ) : (
                  <QrCode className="mr-1.5 h-4 w-4" />
                )}
                Cetak Dokumen Bertanda Tangan
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
