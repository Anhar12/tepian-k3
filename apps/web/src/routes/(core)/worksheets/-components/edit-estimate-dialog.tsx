import { Button } from "@/components/ui/button";
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
import { NumberInput } from "@/components/ui/number-input";
import { Spinner } from "@/components/ui/spinner";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { queryClient, trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import worksheetSchema from "@tepian-k3/schema/pengujian/worksheet.schema";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type z from "zod";

interface EditEstimateDialogProps {
  worksheetId: string;
  /** Current testing duration in days. */
  currentDays: number;
  /** Current estimated number of personnel. */
  currentMembers: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

/**
 * Dialog for editing a worksheet's testing duration (Durasi Pengujian) and
 * total personnel (Total Personel) estimates. Usable in draft, revision, or
 * verified status — the backend enforces the same restriction.
 *
 * @param worksheetId - The worksheet being edited
 * @param currentDays - Pre-filled testing duration in days
 * @param currentMembers - Pre-filled estimated personnel count
 * @param isOpen - Whether the dialog is open
 * @param setIsOpen - Toggles the dialog open state
 */
export default function EditEstimateDialog({
  worksheetId,
  currentDays,
  currentMembers,
  isOpen,
  setIsOpen,
}: EditEstimateDialogProps) {
  const form = useForm<
    z.infer<typeof worksheetSchema.createWorksheetEstimatedSchema>
  >({
    resolver: zodResolver(worksheetSchema.createWorksheetEstimatedSchema),
    defaultValues: {
      worksheetId,
      estimatedAmountOfDays: currentDays,
      estimatedAmountOfMembers: currentMembers,
    },
  });

  // Re-sync the form whenever it opens or the underlying values change.
  useEffect(() => {
    if (isOpen) {
      form.reset({
        worksheetId,
        estimatedAmountOfDays: currentDays,
        estimatedAmountOfMembers: currentMembers,
      });
    }
  }, [isOpen, worksheetId, currentDays, currentMembers, form]);

  const updateEstimateMutation = useMutation(
    trpc.pengujian.worksheet.createWorksheetEstimateForDetailTransaksi.mutationOptions(
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries(
            trpc.pengujian.worksheet.getTransactionDetail.queryOptions({
              worksheetId,
            }),
          );
          globalSuccessToast("Estimasi worksheet berhasil diperbarui");
          setIsOpen(false);
        },
        onError: (error) => {
          globalErrorToast(
            "Gagal memperbarui estimasi : " + (error?.message || ""),
          );
        },
      },
    ),
  );

  function handleSubmit(
    data: z.infer<typeof worksheetSchema.createWorksheetEstimatedSchema>,
  ) {
    updateEstimateMutation.mutate(data);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Durasi & Personel</DialogTitle>
          <DialogDescription>
            Ubah durasi pengujian dan total personel untuk worksheet ini.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4">
          <FieldGroup>
            <Controller
              control={form.control}
              name="estimatedAmountOfDays"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-1">
                  <FieldLabel className="ml-1 text-sm font-bold">
                    Durasi Pengujian (Hari)
                  </FieldLabel>
                  <NumberInput
                    min={0}
                    placeholder="Masukkan jumlah hari"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
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
              name="estimatedAmountOfMembers"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-1">
                  <FieldLabel className="ml-1 text-sm font-bold">
                    Total Personel (Orang)
                  </FieldLabel>
                  <NumberInput
                    min={0}
                    placeholder="Masukkan jumlah personel"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <DialogClose>Batal</DialogClose>
            <Button type="submit" disabled={updateEstimateMutation.isPending}>
              {updateEstimateMutation.isPending ? <Spinner /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
