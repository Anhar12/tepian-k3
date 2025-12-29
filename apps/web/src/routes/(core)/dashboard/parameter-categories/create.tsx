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
import { Textarea } from "@/components/ui/textarea";
import { useRedirectBackWithTimeout } from "@/lib/redirect-back-with-timeout";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import parameterCategoriesSchema from "@tepian-k3/schema/parameter-categories.schema";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

export const Route = createFileRoute(
  "/(core)/dashboard/parameter-categories/create",
)({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: "parameter-categories.create",
    }),
  component: RouteComponent,
});

function RouteComponent() {
  const redirectBack = useRedirectBackWithTimeout();

  const form = useForm<
    z.infer<typeof parameterCategoriesSchema.createParameterCategorySchema>
  >({
    resolver: zodResolver(
      parameterCategoriesSchema.createParameterCategorySchema,
    ),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createParameterCategoryMutation = useMutation(
    trpc.parameterCategories.createParameterCategory.mutationOptions({
      onSuccess: async () => {
        globalSuccessToast("Berhasil membuat parameter category");
        form.reset();
        await redirectBack();
      },
      onError: (error) => {
        globalErrorToast("Gagal membuat parameter category: " + error.message);
      },
    }),
  );

  function handleSubmit(
    data: z.infer<
      typeof parameterCategoriesSchema.createParameterCategorySchema
    >,
  ) {
    createParameterCategoryMutation.mutate(data);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Buat Kategori Parameter Baru</CardTitle>
          <CardDescription>
            Isi form di bawah untuk membuat kategori parameter baru.
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
                      Nama Kategori Parameter
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan nama kategori parameter"
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
                      Deskripsi Kategori Parameter
                    </FieldLabel>
                    <Textarea
                      placeholder="Masukkan deskripsi kategori parameter"
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
                disabled={createParameterCategoryMutation.isPending}
              >
                {createParameterCategoryMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Buat Kategori Parameter
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
