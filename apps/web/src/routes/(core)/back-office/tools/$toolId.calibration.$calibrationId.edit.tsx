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
import { useRedirectBackWithTimeout } from "@/lib/redirect-back-with-timeout";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { requirePermission } from "@/utils/require-permission";
import { cn } from "@/lib/utils";
import { queryClient, trpc } from "@/utils/trpc";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import toolCalibrationSchema from "@tepian-k3/schema/tool-calibration.schema";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute(
  "/(core)/back-office/tools/$toolId/calibration/$calibrationId/edit",
)({
  params: z.object({
    toolId: z.uuidv7(),
    calibrationId: z.uuidv7(),
  }),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: "tool-calibrations.update",
    }),
  loader: async ({ context, params }) =>
    context.queryClient.ensureQueryData(
      context.trpc.tool.getToolCalibrationDetails.queryOptions({
        id: params.calibrationId,
      }),
    ),

  component: RouteComponent,
  pendingComponent: LoaderComponent,
});

function LoaderComponent() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Tool Calibration</CardTitle>
          <CardDescription>
            Perbarui informasi kalibrasi alat di bawah ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <SkeletonTextArea className="h-10 w-full" />
            <SkeletonInput className="h-24 w-full" />
            <SkeletonButton className="w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RouteComponent() {
  const { calibrationId } = Route.useParams();
  const redirectBack = useRedirectBackWithTimeout();

  const { data: calibration } = useSuspenseQuery(
    trpc.tool.getToolCalibrationDetails.queryOptions({
      id: calibrationId,
    }),
  );

  const form = useForm<
    z.infer<typeof toolCalibrationSchema.updateToolCalibrationSchema>
  >({
    resolver: zodResolver(toolCalibrationSchema.updateToolCalibrationSchema),
    defaultValues: {
      id: calibration.id,
      toolId: calibration.toolId,
      calibrationDate: calibration.calibrationDate,
      note: calibration.note ?? "",
    },
  });

  const updateToolCalibrationMutation = useMutation(
    trpc.tool.updateToolCalibration.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.tool.getToolCalibrationDetails.queryOptions({
            id: calibrationId,
          }),
        );
        globalSuccessToast("Berhasil memperbarui kalibrasi alat");
        await redirectBack();
      },
      onError: (error) => {
        globalErrorToast("Gagal memperbarui kalibrasi alat: " + error.message);
      },
    }),
  );

  function handleSubmit(
    data: z.infer<typeof toolCalibrationSchema.updateToolCalibrationSchema>,
  ) {
    updateToolCalibrationMutation.mutate(data);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Kalibrasi Alat</CardTitle>
          <CardDescription>
            Perbarui informasi kalibrasi alat di bawah ini.
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
        </CardContent>
      </Card>
    </div>
  );
}
