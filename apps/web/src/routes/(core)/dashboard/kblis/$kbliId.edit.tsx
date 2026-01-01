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
import { useRedirectBackWithTimeout } from "@/lib/redirect-back-with-timeout";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { requirePermission } from "@/utils/require-permission";
import { queryClient, trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import kbliSchema from "@tepian-k3/schema/kbli.schema";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

export const Route = createFileRoute("/(core)/dashboard/kblis/$kbliId/edit")({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "kbli.update" }),
  params: z.object({
    kbliId: z.uuidv7(),
  }),
  loader: async ({ context, params }) =>
    context.queryClient.ensureQueryData(
      context.trpc.kbli.getKbliById.queryOptions({
        id: params.kbliId,
      }),
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const { kbliId } = Route.useParams();
  const redirectBack = useRedirectBackWithTimeout();

  const { data: kbli } = useSuspenseQuery(
    trpc.kbli.getKbliById.queryOptions({ id: kbliId }),
  );

  const form = useForm<z.infer<typeof kbliSchema.updateKBLISchema>>({
    resolver: zodResolver(kbliSchema.updateKBLISchema),
    defaultValues: {
      id: kbli.id,
      name: kbli.name,
    },
  });

  const updateKBLIMutation = useMutation(
    trpc.kbli.updateKbli.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.kbli.getKbliById.queryOptions({ id: kbliId }),
        );
        globalSuccessToast("Berhasil memperbarui KBLI");
        await redirectBack();
      },
      onError: (error) => {
        globalErrorToast("Gagal memperbarui KBLI: " + error.message);
      },
    }),
  );

  function handleSubmit(data: z.infer<typeof kbliSchema.updateKBLISchema>) {
    updateKBLIMutation.mutate(data);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Perbarui KBLI</CardTitle>
          <CardDescription>
            Isi form di bawah untuk memperbarui KBLI.
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
                name="name"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Nama KBLI
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan nama KBLI"
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

              <Button
                type="submit"
                className="mt-2 h-10 w-full text-sm"
                disabled={updateKBLIMutation.isPending}
              >
                {updateKBLIMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Perbarui KBLI
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
