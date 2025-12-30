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
import { trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import kbliSchema from "@tepian-k3/schema/kbli.schema";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

export const Route = createFileRoute("/(core)/dashboard/kblis/create")({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "kbli.create" }),
  component: RouteComponent,
});

function RouteComponent() {
  const redirectBack = useRedirectBackWithTimeout();

  const form = useForm<z.infer<typeof kbliSchema.createKBLISchema>>({
    resolver: zodResolver(kbliSchema.createKBLISchema),
    defaultValues: {
      name: "",
    },
  });

  const createKBLIMutation = useMutation(
    trpc.kbli.createKbli.mutationOptions({
      onSuccess: async () => {
        globalSuccessToast("Berhasil membuat KBLI");
        form.reset();
        await redirectBack(350);
      },
      onError: (error) => {
        globalErrorToast("Gagal membuat KBLI: " + error.message);
      },
    }),
  );

  function handleSubmit(data: z.infer<typeof kbliSchema.createKBLISchema>) {
    createKBLIMutation.mutate(data);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Buat KBLI Baru</CardTitle>
          <CardDescription>
            Isi form di bawah untuk membuat KBLI baru.
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
                disabled={createKBLIMutation.isPending}
              >
                {createKBLIMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Buat KBLI
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
