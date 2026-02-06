import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import MultipleImageUpload from "@/components/ui/multiple-image-upload";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import SingleFileUpload from "@/components/ui/single-file-upload";
import { Textarea } from "@/components/ui/textarea";
import { useRedirectBackWithTimeout } from "@/lib/redirect-back-with-timeout";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { cn } from "@/lib/utils";
import { toFormData } from "@/utils/form-data-mapper";
import { trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import toolCalibrationSchema from "@tepian-k3/schema/tool-calibration.schema";
import { format } from "date-fns";
import { CalendarIcon, LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

export const Route = createFileRoute(
  "/(core)/back-office/tools/$toolId/calibration/create",
)({
  head: () => pageHead("Tambah Kalibrasi"),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: "tool-calibrations.create",
    }),
  component: RouteComponent,
});

function RouteComponent() {
  const { toolId } = Route.useParams();
  const redirectBack = useRedirectBackWithTimeout();

  const createToolCalibrationMutation = useMutation(
    trpc.tool.createToolCalibration.mutationOptions({
      onSuccess: async () => {
        globalSuccessToast("Kalibrasi alat berhasil dibuat");
        await redirectBack();
      },
      onError: (error) => {
        globalErrorToast(`Gagal membuat kalibrasi alat: ${error.message}`);
      },
    }),
  );

  const form = useForm<
    z.infer<typeof toolCalibrationSchema.createToolCalibrationSchema>
  >({
    defaultValues: {
      toolId,
    },
  });

  const handleSubmit = (
    data: z.infer<typeof toolCalibrationSchema.createToolCalibrationSchema>,
  ) => {
    const formData = toFormData(data);
    createToolCalibrationMutation.mutate(formData);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Buat Kalibrasi Alat Baru</CardTitle>
          <CardDescription>
            Isi form di bawah untuk membuat kalibrasi alat baru.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid gap-4"
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
                      Catatan Kalibrasi Alat
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
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Tanggal Kalibrasi Alat
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
                            ? format(field.value, "PPP")
                            : "Pick a date"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={new Date(field.value)}
                          onSelect={field.onChange}
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
                name="certificateFile"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      File Sertifikat Kalibrasi (PDF)
                    </FieldLabel>
                    <SingleFileUpload
                      accept="application/pdf"
                      {...field}
                      error={fieldState.error?.message}
                    />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="documentationFiles"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      File Dokumentasi Kalibrasi (JPEG/PNG)
                    </FieldLabel>
                    <MultipleImageUpload
                      accept="image/jpeg, image/png"
                      {...field}
                      error={fieldState.error?.message}
                    />
                  </Field>
                )}
              />

              <Button
                type="submit"
                className="mt-2 h-10 w-full text-sm"
                disabled={createToolCalibrationMutation.isPending}
              >
                {createToolCalibrationMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Buat Kalibrasi Alat
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
