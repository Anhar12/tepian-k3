import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  billingCode: z.string().min(1, "Kode billing wajib diisi"),
  billingExpiryDate: z.string().min(1, "Tanggal kadaluarsa wajib diisi"),
});

type FormValues = z.infer<typeof schema>;

interface PublishInvoiceDialogProps {
  worksheetId: string;
  orderId: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

/**
 * Dialog for Bendahara Penerimaan to input billing code and expiry date,
 * then publish the invoice/SPK signal so Admin can print the documents.
 */
export default function PublishInvoiceDialog({
  worksheetId,
  orderId,
  isOpen,
  setIsOpen,
}: PublishInvoiceDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { billingCode: "", billingExpiryDate: "" },
  });

  const publishInvoiceMutation = useMutation(
    trpc.pengujian.worksheet.publishInvoice.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.order.getOrderWithDocumentsAdmin.queryOptions({
            orderId,
          }),
        );
        await queryClient.invalidateQueries(
          trpc.pengujian.worksheet.getByOrderId.queryOptions({
            orderId,
          }),
        );
        globalSuccessToast(
          "Invoice & SPK berhasil diterbitkan. Admin dapat mencetak dokumen.",
        );
        form.reset();
        setIsOpen(false);
      },
      onError: (error) => {
        globalErrorToast(
          "Gagal menerbitkan Invoice & SPK: " + (error?.message ?? ""),
        );
      },
    }),
  );

  function handleSubmit(data: FormValues) {
    publishInvoiceMutation.mutate({
      worksheetId,
      billingCode: data.billingCode,
      billingExpiryDate: new Date(data.billingExpiryDate).toISOString(),
    });
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) form.reset();
        setIsOpen(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Invoice &amp; SPK</DialogTitle>
          <DialogDescription>
            Masukkan kode billing dan tanggal kadaluarsa. Admin akan dapat
            mencetak dokumen setelah langkah ini.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4">
          <FieldGroup>
            <Controller
              control={form.control}
              name="billingCode"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-1">
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
                <Field data-invalid={fieldState.invalid} className="space-y-1">
                  <FieldLabel className="ml-1 text-sm font-bold">
                    Tanggal Kadaluarsa
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
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                setIsOpen(false);
              }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={publishInvoiceMutation.isPending}>
              {publishInvoiceMutation.isPending ? <Spinner /> : null}
              Terbitkan Invoice &amp; SPK
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
