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
import { CalendarIcon, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type z from "zod";
import { type SignerInfo } from "@/components/document-signing";
import { useNavigate } from "@tanstack/react-router";
import type { DocumentSigningSessionData } from "@/routes/(core)/document-signing";

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
  const navigate = useNavigate();
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

  const previewOfferingMutation = useMutation(
    trpc.pengujian.generateDocument.previewOfferingLetter.mutationOptions({
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
    previewOfferingMutation.mutate(
      { ...data, signatures: [] },
      {
        onSuccess: (res) => {
          const previewUrl = base64ToBlobUrl(res.base64, res.contentType);
          const sessionKey = `doc-sign-${Date.now()}`;
          const sessionData: DocumentSigningSessionData = {
            documentType: "offering",
            title: "Surat Penawaran",
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

  // Pre-fill reference fields from order when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (orderNumber) form.setValue("referenceNumber", orderNumber);
      if (orderDate) form.setValue("referenceDate", orderDate);
    } else {
      form.reset();
    }
  }, [isOpen, orderNumber, orderDate, form]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cetak Surat Penawaran</DialogTitle>
          <DialogDescription>
            Isi nomor surat dan data dokumen untuk mencetak surat penawaran.
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
                <Field data-invalid={fieldState.invalid} className="space-y-1">
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
                <Field data-invalid={fieldState.invalid} className="space-y-1">
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
                <Field data-invalid={fieldState.invalid} className="space-y-1">
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
                <Field data-invalid={fieldState.invalid} className="space-y-1">
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
                generateOfferingMutation.mutate({
                  ...data,
                  signatures: [],
                });
              })}
              disabled={
                generateOfferingMutation.isPending ||
                previewOfferingMutation.isPending
              }
            >
              Cetak Tanpa QR
            </Button>
            <Button
              type="submit"
              disabled={
                generateOfferingMutation.isPending ||
                previewOfferingMutation.isPending
              }
            >
              {previewOfferingMutation.isPending ? (
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
