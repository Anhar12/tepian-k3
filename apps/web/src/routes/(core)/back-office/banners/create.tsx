import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/utils/require-permission";
import { useRedirectBackWithTimeout } from "@/lib/redirect-back-with-timeout";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import bannerSchema from "@tepian-k3/schema/banner.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOptimisticMutation } from "@/lib/optimistic-update";
import { trpc } from "@/utils/trpc";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
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
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toFormData } from "@/utils/form-data-mapper";
import SingleImageUpload from "@/components/ui/single-image-upload";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/(core)/back-office/banners/create")({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "banners.create" }),
  component: RouteComponent,
});

function RouteComponent() {
  const redirectBack = useRedirectBackWithTimeout();

  const form = useForm<z.infer<typeof bannerSchema.createBannerSchema>>({
    resolver: zodResolver(bannerSchema.createBannerSchema),
  });

  const createBannerMutation = useOptimisticMutation(
    trpc.banner.createBanner.mutationOptions(),
    {
      queryOptions: trpc.banner.getPaginatedBanners.queryOptions({}),
      operation: {
        type: "create",
        getOptimisticItem: (input) => ({
          id: `optimistic-${Math.random().toString(36).substring(2, 9)}`,
          ...input,
          isActive: true,
          createdAt: new Date(),
          updatedAt: null,
        }),
      },
      onSuccess: async () => {
        globalSuccessToast("Banner berhasil dibuat");
        await redirectBack();
      },
      onError: (error) => {
        globalErrorToast(`Gagal membuat banner: ${error.message}`);
      },
    },
  );

  const handleSubmit = (
    data: z.infer<typeof bannerSchema.createBannerSchema>,
  ) => {
    const formData = toFormData(data);

    createBannerMutation.mutate(formData);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Buat Banner Baru</CardTitle>
          <CardDescription>
            Isi formulir di bawah untuk menambahkan banner baru ke sistem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-4"
          >
            <FieldGroup>
              <Controller
                control={form.control}
                name="picture"
                render={({ field, fieldState }) => (
                  <SingleImageUpload
                    {...field}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel>Judul Banner</FieldLabel>
                    <Input placeholder="Masukkan judul banner" {...field} />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="order"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel>Urutan Banner</FieldLabel>
                    <Input
                      placeholder="Masukkan urutan banner"
                      {...field}
                      type="number"
                      onChange={(e) => {
                        field.onChange(Number(e.target.value));
                      }}
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
                      Aktifkan Banner
                    </FieldLabel>
                  </Field>
                )}
              />
            </FieldGroup>

            <Button type="submit" disabled={createBannerMutation.isPending}>
              {createBannerMutation.isPending ? <Spinner /> : null}
              Buat Banner
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
