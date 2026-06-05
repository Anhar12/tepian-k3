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
import { openBase64InNewTab } from "@/utils/download";
import { trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ADMIN_EMAIL, ADMIN_PHONE } from "@tepian-k3/constants";
import generateDocumentSchema from "@tepian-k3/schema/pengujian/generate-document.schema";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type z from "zod";

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
  const form = useForm<
    z.infer<typeof generateDocumentSchema.generateOfferingLetterDocumentSchema>
  >({
    resolver: zodResolver(
      generateDocumentSchema.generateOfferingLetterDocumentSchema,
    ),
    defaultValues: {
      worksheetId,
      adminContact: ADMIN_PHONE,
      adminEmail: ADMIN_EMAIL,
    },
  });

  // Pre-fill reference fields from order when dialog opens
  useEffect(() => {
    if (isOpen) {
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
    data: z.infer<
      typeof generateDocumentSchema.generateOfferingLetterDocumentSchema
    >,
  ) {
    generateOfferingMutation.mutate(data);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <form>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cetak Surat Penawaran</DialogTitle>
            <DialogDescription>
              Isi nomor surat dan data dokumen untuk mencetak surat penawaran.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
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
            <DialogFooter>
              <DialogClose>Batal</DialogClose>
              <Button
                type="submit"
                disabled={generateOfferingMutation.isPending}
              >
                {generateOfferingMutation.isPending ? <Spinner /> : null}
                Cetak Surat Penawaran
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </form>
    </Dialog>
  );
}
