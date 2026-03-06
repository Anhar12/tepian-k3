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
// import { getPublicUrl } from "@/utils/url";
import { openBase64InNewTab } from "@/utils/download";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import generateDocumentSchema from "@tepian-k3/schema/pengujian/generate-document.schema";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type z from "zod";

interface GenerateInvoiceDialogProps {
  worksheetId: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function GenerateInvoiceDialog({
  worksheetId,
  isOpen,
  setIsOpen,
}: GenerateInvoiceDialogProps) {
  const form = useForm<
    z.infer<typeof generateDocumentSchema.generateTagihanDocumentSchema>
  >({
    resolver: zodResolver(generateDocumentSchema.generateTagihanDocumentSchema),
    defaultValues: {
      worksheetId,
    },
  });

  const generateInvoiceMutation = useMutation(
    trpc.pengujian.generateDocument.generateTagihanDocument.mutationOptions({
      onSuccess: (data) => {
        globalSuccessToast("Tagihan berhasil dibuat");
        // window.open(getPublicUrl(data.offeringLetterUrl), "_blank");
        openBase64InNewTab(data.base64, data.contentType);
        setIsOpen(false);
      },
      onError: (error) => {
        globalErrorToast("Gagal membuat Tagihan : " + (error?.message || ""));
      },
    }),
  );

  function handleSubmit(
    data: z.infer<typeof generateDocumentSchema.generateTagihanDocumentSchema>,
  ) {
    generateInvoiceMutation.mutate(data);
  }

  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <form>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Tagihan</DialogTitle>
            <DialogDescription>
              Isi form berikut untuk membuat tagihan.
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
                name="referenceNumber"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Nomor Referensi
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan nomor referensi"
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
                      Tanggal Referensi
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
                          selected={new Date(field.value ?? "")}
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
                      placeholder="Masukkan kode billing"
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
                            : "Pick a date"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={new Date(field.value ?? "")}
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
                disabled={generateInvoiceMutation.isPending}
              >
                {generateInvoiceMutation.isPending ? <Spinner /> : null}
                Buat Tagihan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </form>
    </Dialog>
  );
}
