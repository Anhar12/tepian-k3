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
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useRedirectBackWithTimeout } from "@/lib/redirect-back-with-timeout";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import toolCodeSchema from "@tepian-k3/schema/pengujian/tool-code.schema";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

export const Route = createFileRoute(
  "/(core)/back-office/tool-codes/$toolCodeId/edit",
)({
  params: z.object({ toolCodeId: z.uuidv7() }),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "tool-codes.update" }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      context.trpc.pengujian.toolCode.getToolCodeById.queryOptions({
        id: params.toolCodeId,
      }),
    ),
  component: RouteComponent,
  head: () => pageHead("Edit Kode Alat"),
});

function RouteComponent() {
  const { toolCodeId } = Route.useParams();
  const redirectBack = useRedirectBackWithTimeout();

  const { data: toolCode } = useSuspenseQuery(
    trpc.pengujian.toolCode.getToolCodeById.queryOptions({
      id: toolCodeId,
    }),
  );

  const form = useForm<z.infer<typeof toolCodeSchema.updateToolCodeSchema>>({
    resolver: zodResolver(toolCodeSchema.updateToolCodeSchema),
    defaultValues: {
      id: toolCode?.id,
      code: toolCode?.code,
      description: toolCode?.description ?? undefined,
      isActive: toolCode?.isActive,
    },
  });

  const updateToolCodeMutation = useMutation(
    trpc.pengujian.toolCode.updateToolCode.mutationOptions({
      onSuccess: async () => {
        globalSuccessToast("Kode alat berhasil diperbarui");
        form.reset();
        await redirectBack();
      },
      onError: (error) => {
        globalErrorToast(`Gagal memperbarui kode alat: ${error.message}`);
      },
    }),
  );

  const handleSubmit = (
    data: z.infer<typeof toolCodeSchema.updateToolCodeSchema>,
  ) => {
    updateToolCodeMutation.mutate(data);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Kode Alat</CardTitle>
          <CardDescription>
            Isi form di bawah untuk mengedit kode alat.
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
                name="code"
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
                name="description"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Deskripsi Kode Alat
                    </FieldLabel>
                    <Textarea
                      placeholder="Masukkan deskripsi kode alat"
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
                name="isActive"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                    orientation="horizontal"
                  >
                    <Checkbox
                      id={`form-rhf-checkbox-isActive`}
                      name={field.name}
                      aria-invalid={fieldState.invalid}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <FieldLabel
                      htmlFor={`form-rhf-checkbox-isActive`}
                      className="font-normal"
                    >
                      Aktifkan Kode Alat
                    </FieldLabel>
                  </Field>
                )}
              />

              <Button
                type="submit"
                className="mt-2 h-10 w-full text-sm"
                disabled={updateToolCodeMutation.isPending}
              >
                {updateToolCodeMutation.isPending ? <Spinner /> : null}
                Perbarui Kode Alat
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
