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
import { CalendarIcon, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type z from "zod";
import { type SignerInfo } from "@/components/document-signing";
import { useNavigate } from "@tanstack/react-router";
import type { DocumentSigningSessionData } from "@/routes/(core)/document-signing";

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
  const navigate = useNavigate();
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

  const previewTagihanMutation = useMutation(
    trpc.pengujian.generateDocument.previewTagihanDocument.mutationOptions({
      onError: (error) => {
        globalErrorToast(
          "Gagal memuat pratinjau dokumen: " + (error?.message || ""),
        );
      },
    }),
  );

  const handleGoToSigningPage = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    const data = form.getValues();
    previewTagihanMutation.mutate(
      { ...data, signatures: [] },
      {
        onSuccess: (res) => {
          const previewUrl = base64ToBlobUrl(res.base64, res.contentType);
          const sessionKey = `doc-sign-${Date.now()}`;
          const sessionData: DocumentSigningSessionData = {
            documentType: "invoice",
            title: "Kuitansi / Invoice Tagihan",
            formData: data,
            pdfPreviewUrl: previewUrl,
            returnPath: window.location.pathname,
            signers: defaultSigners,
          };
          sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));
          setIsOpen(false);
          navigate({
            to: "/document-signing",
            search: { sessionKey },
          });
        },
      },
    );
  };

  useEffect(() => {
    if (isOpen) {
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cetak Tagihan</DialogTitle>
          <DialogDescription>
            Isi nomor surat untuk mencetak tagihan. Data referensi dan billing
            telah terisi otomatis.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGoToSigningPage();
          }}
          className="grid gap-4"
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="letterNumber"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-1">
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
                <Field data-invalid={fieldState.invalid} className="space-y-1">
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
                <Field data-invalid={fieldState.invalid} className="space-y-1">
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
                <Field data-invalid={fieldState.invalid} className="space-y-1">
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
                <Field data-invalid={fieldState.invalid} className="space-y-1">
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
                generateInvoiceMutation.mutate({
                  ...data,
                  signatures: [],
                });
              })}
              disabled={
                generateInvoiceMutation.isPending ||
                previewTagihanMutation.isPending
              }
            >
              Cetak Tanpa QR
            </Button>
            <Button
              type="submit"
              disabled={
                generateInvoiceMutation.isPending ||
                previewTagihanMutation.isPending
              }
            >
              {previewTagihanMutation.isPending ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : null}
              Atur Posisi TTD <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
