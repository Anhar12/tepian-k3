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
import { queryClient, trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import parameterCategoriesSchema from "@tepian-k3/schema/parameter-categories.schema";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

export const Route = createFileRoute(
  "/(core)/dashboard/parameter-categories/$parameterCategoriesId/edit",
)({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: "parameter-categories.update",
    }),
  params: z.object({
    parameterCategoriesId: z.uuidv7(),
  }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      context.trpc.parameterCategories.getParameterCategoryById.queryOptions({
        id: params.parameterCategoriesId,
      }),
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const { parameterCategoriesId } = Route.useParams();
  const redirectBack = useRedirectBackWithTimeout();

  const { data: parameterCategory } = useSuspenseQuery(
    trpc.parameterCategories.getParameterCategoryById.queryOptions({
      id: parameterCategoriesId,
    }),
  );

  const form = useForm<
    z.infer<typeof parameterCategoriesSchema.updateParameterCategorySchema>
  >({
    resolver: zodResolver(
      parameterCategoriesSchema.updateParameterCategorySchema,
    ),
    defaultValues: {
      id: parameterCategory.id,
      name: parameterCategory.name,
      description: parameterCategory.description ?? undefined,
    },
  });

  const updateParameterCategoryMutation = useMutation(
    trpc.parameterCategories.updateParameterCategory.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.parameterCategories.getParameterCategoryById.queryOptions({
            id: parameterCategoriesId,
          }),
        );
        globalSuccessToast("Berhasil memperbarui parameter category");

        await redirectBack();
      },
      onError: (error) => {
        globalErrorToast(
          "Gagal memperbarui parameter category: " + error.message,
        );
      },
    }),
  );

  function handleSubmit(
    data: z.infer<
      typeof parameterCategoriesSchema.updateParameterCategorySchema
    >,
  ) {
    updateParameterCategoryMutation.mutate(data);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Perbarui Kategori Parameter</CardTitle>
          <CardDescription>
            Isi form di bawah untuk memperbarui kategori parameter.
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
                disabled={updateParameterCategoryMutation.isPending}
              >
                {updateParameterCategoryMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Perbarui Kategori Parameter
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
