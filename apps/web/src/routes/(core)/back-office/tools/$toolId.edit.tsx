import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRedirectBackWithTimeout } from "@/lib/redirect-back-with-timeout";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { requirePermission } from "@/utils/require-permission";
import { queryClient, trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  TOOLS_AVAILABILITY,
  TOOLS_AVAILABILITY_LABELS,
  TOOLS_CONDITIONS,
  TOOLS_CONDITIONS_LABELS,
} from "@tepian-k3/constants";
import toolsSchema from "@tepian-k3/schema/tools.schema";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

export const Route = createFileRoute("/(core)/back-office/tools/$toolId/edit")({
  params: z.object({
    toolId: z.uuidv7(),
  }),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "tools.update" }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      context.trpc.tool.getToolDetails.queryOptions({
        id: params.toolId,
      }),
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const { toolId } = Route.useParams();
  const redirectBack = useRedirectBackWithTimeout();

  const { data: tool } = useSuspenseQuery(
    trpc.tool.getToolDetails.queryOptions({
      id: toolId,
    }),
  );

  const form = useForm<z.infer<typeof toolsSchema.createToolSchema>>({
    resolver: zodResolver(toolsSchema.createToolSchema),
    defaultValues: {
      toolCode: tool.toolCode,
      toolName: tool.toolName,
      function: tool.function ?? undefined,
      location: tool.location ?? undefined,
      shelf: tool.shelf ?? undefined,
      BMNnumber: tool.BMNnumber ?? undefined,
      NUPnumber: tool.NUPnumber ?? undefined,
      brand: tool.brand ?? undefined,
      type: tool.type ?? undefined,
      serialNumber: tool.serialNumber ?? undefined,
      originOfAcquisition: tool.originOfAcquisition ?? undefined,
      correction: tool.correction ?? undefined,
      condition: tool.condition ?? undefined,
      availability: tool.availability ?? undefined,
      information: tool.information ?? undefined,
      acquisitionYear: tool.acquisitionYear ?? undefined,
    },
  });

  const updateToolMutation = useMutation(
    trpc.tool.updateTool.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.tool.getToolDetails.queryFilter({ id: toolId }),
        );
        globalSuccessToast("Alat berhasil diperbarui");
        await redirectBack();
      },
      onError: (error) => {
        globalErrorToast("Gagal memperbarui alat: " + error.message);
      },
    }),
  );

  function handleSubmit(data: z.infer<typeof toolsSchema.createToolSchema>) {
    updateToolMutation.mutate({ id: toolId, ...data });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Alat & Perlengkapan</CardTitle>
          <CardDescription>
            Perbarui informasi alat & perlengkapan di bawah ini
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
                name="toolCode"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Kode Alat
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan kode alat"
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
                name="toolName"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Nama Alat
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan nama alat"
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
                name="function"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Fungsi Alat
                    </FieldLabel>
                    <Textarea
                      placeholder="Masukkan fungsi alat (opsional)"
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
                name="location"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Lokasi Alat
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan lokasi alat (opsional)"
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
                name="shelf"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Rak Alat
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan rak alat (opsional)"
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
                name="BMNnumber"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Nomor BMN
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan nomor BMN (opsional)"
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
                name="NUPnumber"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Nomor NUP
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan nomor NUP (opsional)"
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
                name="brand"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Brand Alat
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan brand alat (opsional)"
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
                name="type"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Tipe Alat
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan tipe alat (opsional)"
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
                name="serialNumber"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Serial Number Alat
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan serial number alat (opsional)"
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
                name="originOfAcquisition"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Asal Perolehan Alat
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan asal perolehan alat (opsional)"
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
                name="correction"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Koreksi Alat
                    </FieldLabel>
                    <Textarea
                      placeholder="Masukkan koreksi alat (opsional)"
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
                name="condition"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Kondisi Alat
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Pilih Kondisi Alat" />
                      </SelectTrigger>
                      <SelectContent>
                        {TOOLS_CONDITIONS.map((condition) => (
                          <SelectItem key={condition} value={condition}>
                            {TOOLS_CONDITIONS_LABELS[condition]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="availability"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Ketersediaan Alat
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Pilih Kondisi Alat" />
                      </SelectTrigger>
                      <SelectContent>
                        {TOOLS_AVAILABILITY.map((availability) => (
                          <SelectItem key={availability} value={availability}>
                            {TOOLS_AVAILABILITY_LABELS[availability]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="information"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Informasi Alat
                    </FieldLabel>
                    <Textarea
                      placeholder="Masukkan informasi alat (opsional)"
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

              <Button
                type="submit"
                className="mt-2 h-10 w-full text-sm"
                disabled={updateToolMutation.isPending}
              >
                {updateToolMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Perbarui Alat
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
