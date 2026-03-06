import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useRedirectBackWithTimeout } from "@/lib/redirect-back-with-timeout";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { queryClient, trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  TOOLS_CONDITIONS,
  TOOLS_CONDITIONS_LABELS,
} from "@tepian-k3/constants";
import toolCheckSchema from "@tepian-k3/schema/pengujian/tool-check.schema";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

export const Route = createFileRoute(
  "/(core)/back-office/tools/$toolId/status/$statusId/edit",
)({
  params: z.object({
    toolId: z.uuidv7(),
    statusId: z.uuidv7(),
  }),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: "tool-checks.update",
    }),
  loader: async ({ context, params }) =>
    context.queryClient.ensureQueryData(
      context.trpc.pengujian.tool.getToolCheckDetails.queryOptions({
        id: params.statusId,
      }),
    ),
  component: RouteComponent,
  head: () => pageHead("Edit Status Alat"),
});

function RouteComponent() {
  const { statusId } = Route.useParams();
  const redirectBack = useRedirectBackWithTimeout();

  const { data: toolCheckDetails } = useSuspenseQuery(
    trpc.pengujian.tool.getToolCheckDetails.queryOptions({
      id: statusId,
    }),
  );

  const form = useForm<z.infer<typeof toolCheckSchema.updateToolCheckSchema>>({
    resolver: zodResolver(toolCheckSchema.updateToolCheckSchema),
    defaultValues: toolCheckDetails,
  });

  const updateToolCheckMutation = useMutation(
    trpc.pengujian.tool.updateToolCheck.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.tool.getToolCheckDetails.queryOptions({
            id: statusId,
          }),
        );
        globalSuccessToast("Status alat berhasil diperbarui");
        await redirectBack();
      },
      onError: (error) => {
        globalErrorToast("Gagal memperbarui status alat: " + error.message);
      },
    }),
  );

  const handleSubmit = (
    data: z.infer<typeof toolCheckSchema.updateToolCheckSchema>,
  ) => {
    updateToolCheckMutation.mutate(data);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Simpan Perubahan Status Alat</CardTitle>
          <CardDescription>
            Isi form di bawah untuk menyimpan perubahan status alat.
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
                name="checkAlatMenyala"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="form-rhf-checkbox-checkAlatMenyala"
                        name={field.name}
                        aria-invalid={fieldState.invalid}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <FieldLabel
                        htmlFor="form-rhf-checkbox-checkAlatMenyala"
                        className="font-normal"
                      >
                        Alat Menyala
                      </FieldLabel>
                    </div>
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="checkPenyimpangan"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="form-rhf-checkbox-checkPenyimpangan"
                        name={field.name}
                        aria-invalid={fieldState.invalid}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <FieldLabel
                        htmlFor="form-rhf-checkbox-checkPenyimpangan"
                        className="font-normal"
                      >
                        Penyimpangan Alat +- 5% dari nilai standar
                      </FieldLabel>
                    </div>
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="checkKelengkapanAlat"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="form-rhf-checkbox-checkKelengkapanAlat"
                        name={field.name}
                        aria-invalid={fieldState.invalid}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <FieldLabel
                        htmlFor="form-rhf-checkbox-checkKelengkapanAlat"
                        className="font-normal"
                      >
                        Kelengkapan Alat
                      </FieldLabel>
                    </div>
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="checkKondisiFisikAlat"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="form-rhf-checkbox-checkKondisiFisikAlat"
                        name={field.name}
                        aria-invalid={fieldState.invalid}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <FieldLabel
                        htmlFor="form-rhf-checkbox-checkKondisiFisikAlat"
                        className="font-normal"
                      >
                        Kondisi Fisik Alat
                      </FieldLabel>
                    </div>
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="checkConditionResult"
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

              <Button
                type="submit"
                className="mt-2 h-10 w-full text-sm"
                disabled={updateToolCheckMutation.isPending}
              >
                {updateToolCheckMutation.isPending ? <Spinner /> : null}
                Simpan Perubahan
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
