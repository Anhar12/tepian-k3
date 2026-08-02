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
import { base64ToBlobUrl, openBase64InNewTab } from "@/utils/download";
import { trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ADMIN_EMAIL, ADMIN_PHONE } from "@tepian-k3/constants";
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

interface GenerateOfferingDialogProps {
  worksheetId: string;
  /** Pre-fill Nomor Acuan from the order number */
  orderNumber?: string;
  /** Pre-fill Tanggal Acuan from the order creation date (ISO string) */
  orderDate?: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function GenerateOfferingDialog({
  worksheetId,
  orderNumber,
  orderDate,
  isOpen,
  setIsOpen,
}: GenerateOfferingDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [signatures, setSignatures] = useState<SignaturePosition[]>([]);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | undefined>(
    undefined,
  );

  // Fetch current user for default signer
  const meQuery = useQuery(trpc.platform.auth.me.queryOptions());
  const currentUser = meQuery.data;

  const defaultSigners: SignerInfo[] = currentUser
    ? [
        {
          userId: currentUser.id,
          userName: currentUser.name || "Kepala Balai K3",
          purpose: "Kepala Balai K3",
        },
      ]
    : [];

  const form = useForm<
    z.input<typeof generateDocumentSchema.generateOfferingLetterDocumentSchema>
  >({
    resolver: zodResolver(
      generateDocumentSchema.generateOfferingLetterDocumentSchema,
    ),
    defaultValues: {
      worksheetId,
      adminContact: ADMIN_PHONE,
      adminEmail: ADMIN_EMAIL,
      signatures: [],
    },
  });

  // Pre-fill reference fields from order when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSignatures([]);
      if (orderNumber) form.setValue("referenceNumber", orderNumber);
      if (orderDate) form.setValue("referenceDate", orderDate);
    } else {
      form.reset();
    }
  }, [isOpen, orderNumber, orderDate, form]);

  const generateOfferingMutation = useMutation(
    trpc.pengujian.generateDocument.generateOfferingLetter.mutationOptions({
      onSuccess: (data) => {
        globalSuccessToast("Surat penawaran berhasil dibuat");
        openBase64InNewTab(data.base64, data.contentType);
        setIsOpen(false);
      },
      onError: (error) => {
        globalErrorToast(
          "Gagal membuat surat penawaran : " + (error?.message || ""),
        );
      },
    }),
  );

  function handleSubmit(
    data: z.input<
      typeof generateDocumentSchema.generateOfferingLetterDocumentSchema
    >,
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
    generateOfferingMutation.mutate(finalData);
  }

  const handleNextToSignature = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    if (signatures.length === 0 && currentUser) {
      setSignatures([
        {
          userId: currentUser.id,
          userName: currentUser.name || "Kepala Balai K3",
          purpose: "Kepala Balai K3",
          page: 0,
          x: 600,
          y: 900,
          width: 100,
          height: 100,
        },
      ]);
    }

    setPdfPreviewUrl(undefined);
    generateOfferingMutation.mutate(
      {
        ...form.getValues(),
        signatures: [],
      },
      {
        onSuccess: (data) => {
          setPdfPreviewUrl(base64ToBlobUrl(data.base64, data.contentType));
        },
      },
    );

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
        <DialogHeader>
          <DialogTitle>
            {step === 1
              ? "Cetak Surat Penawaran"
              : "Posisi Tanda Tangan Digital (QR Code)"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Isi nomor surat dan data dokumen untuk mencetak surat penawaran."
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
                name="adminContact"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Kontak Admin
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan kontak admin"
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
                name="adminEmail"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Email Admin
                    </FieldLabel>
                    <Input
                      type="email"
                      placeholder="Masukkan email admin"
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
                      Nomor Acuan
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Nomor order"
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
                      Tanggal Acuan
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
                  generateOfferingMutation.mutate({
                    ...data,
                    signatures: [],
                  });
                })}
                disabled={generateOfferingMutation.isPending}
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
                disabled={generateOfferingMutation.isPending}
              >
                {generateOfferingMutation.isPending ? (
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
