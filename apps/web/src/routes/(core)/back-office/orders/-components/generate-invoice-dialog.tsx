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
import { openBase64InNewTab } from "@/utils/download";
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

    setStep(2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className={step === 2 ? "max-w-4xl" : "max-w-md"}>
        <DialogHeader>
          <DialogTitle>
            {step === 1
              ? "Cetak Tagihan"
              : "Posisi Tanda Tangan Digital (QR Code)"}
          </DialogTitle>
          <DialogDescription>
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
            className="grid gap-4"
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
                      Nomor Surat
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
                      Nomor Referensi{" "}
                      <span className="font-normal text-muted-foreground">
                        (dari penawaran)
                      </span>
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Nomor surat penawaran"
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
                      Kode Billing
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Kode billing"
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
                name="billingExpiryDate"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Tanggal Berakhir Billing
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
          <div className="space-y-4">
            <QRSignaturePlacer
              signers={defaultSigners}
              positions={signatures}
              onChange={setSignatures}
              maxPages={5}
            />
            <DialogFooter className="flex gap-2">
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
                  <QrCode className="mr-2 h-4 w-4" />
                )}
                Cetak Tagihan Bertanda Tangan
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
