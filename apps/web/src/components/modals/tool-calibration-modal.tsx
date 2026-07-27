import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  SkeletonInput,
  SkeletonTextArea,
  SkeletonButton,
} from "@/components/ui/skeleton-generator";
import { Textarea } from "@/components/ui/textarea";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { queryClient, trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import toolCalibrationSchema from "@tepian-k3/schema/pengujian/tool-calibration.schema";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Spinner } from "@/components/ui/spinner";
import { toFormData } from "@/utils/form-data-mapper";
import type { ToolCalibration } from "@tepian-k3/types/pengujian/tool-calibration.types";

export function ToolCalibrationModal({
  row,
  open,
  onOpenChange,
}: {
  row: ToolCalibration;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Kalibrasi Alat</DialogTitle>
          <DialogDescription>
            Perbarui informasi kalibrasi alat di bawah ini.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ToolCalibrationForm calibrationId={row.id} toolId={row.toolId} setOpen={onOpenChange} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ToolCalibrationForm({
  calibrationId,
  toolId,
  setOpen,
}: {
  calibrationId: string;
  toolId: string;
  setOpen: (open: boolean) => void;
}) {
  const { data: calibration, isLoading } = useQuery(
    trpc.pengujian.tool.getToolCalibrationDetails.queryOptions({
      id: calibrationId,
    }),
  );

  const form = useForm<
    z.infer<typeof toolCalibrationSchema.updateToolCalibrationSchema>
  >({
    resolver: zodResolver(toolCalibrationSchema.updateToolCalibrationSchema),
    defaultValues: {
      id: calibrationId,
      toolId: toolId,
      calibrationDate: new Date().toISOString(),
      note: "",
    },
    values: calibration ? {
      id: calibration.id,
      toolId: calibration.toolId,
      calibrationDate: calibration.calibrationDate,
      note: calibration.note ?? "",
    } : undefined,
  });

  const updateToolCalibrationMutation = useMutation(
    trpc.pengujian.tool.updateToolCalibration.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.tool.getPaginatedCalibrations.queryOptions({ toolId }),
        );
        globalSuccessToast("Berhasil memperbarui kalibrasi alat");
        setOpen(false);
      },
      onError: (error) => {
        globalErrorToast("Gagal memperbarui kalibrasi alat: " + error.message);
      },
    }),
  );

  function handleSubmit(
    data: z.infer<typeof toolCalibrationSchema.updateToolCalibrationSchema>,
  ) {
    const formData = toFormData(data);
    updateToolCalibrationMutation.mutate(formData);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 py-4">
        <SkeletonTextArea className="h-10 w-full" />
        <SkeletonInput className="h-24 w-full" />
        <SkeletonButton className="w-full" />
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="grid gap-4 py-4"
    >
      <FieldGroup>
        <Controller
          control={form.control}
          name="note"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              className="space-y-1"
            >
              <FieldLabel className="ml-1 text-sm font-bold">
                Catatan Kalibrasi
              </FieldLabel>
              <Textarea
                placeholder="Masukkan catatan kalibrasi"
                className="h-30 text-sm"
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
          name="calibrationDate"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              className="space-y-1"
            >
              <FieldLabel>Tanggal Kalibrasi</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-between",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    {field.value ? (
                      format(new Date(field.value), "dd MMMM yyyy")
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
                    <CalendarIcon className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      field.value ? new Date(field.value) : undefined
                    }
                    onSelect={(date) => {
                      field.onChange(date?.toISOString() ?? null);
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

      <Button
        type="submit"
        className="w-full"
        disabled={updateToolCalibrationMutation.isPending}
      >
        {updateToolCalibrationMutation.isPending ? <Spinner /> : null}
        Simpan Perubahan
      </Button>
    </form>
  );
}
