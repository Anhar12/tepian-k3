import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { useRedirectBackWithTimeout } from "@/lib/redirect-back-with-timeout";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import bannerSchema from "@tepian-k3/schema/platform/banner.schema";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { NumberInput } from "@/components/ui/number-input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toFormData } from "@/utils/form-data-mapper";
import SingleImageUpload from "@/components/ui/single-image-upload";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation } from "@tanstack/react-query";

export const Route = createFileRoute("/(core)/back-office/banners/create")({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "banners.create" }),
  component: RouteComponent,
  head: () => pageHead("Tambah Banner"),
});

function RouteComponent() {
  const redirectBack = useRedirectBackWithTimeout();

  const form = useForm<z.infer<typeof bannerSchema.createBannerSchema>>({
    resolver: zodResolver(bannerSchema.createBannerSchema),
    defaultValues: {
      title: "",
      type: "hero",
      order: 0,
      isActive: true,
    },
  });

  const createBannerMutation = useMutation({
    ...trpc.platform.banner.createBanner.mutationOptions(),
    onSuccess: async () => {
      globalSuccessToast("Banner berhasil dibuat");
      await redirectBack();
    },
    onError: (error) => {
      globalErrorToast(`Gagal membuat banner: ${error.message}`);
    },
  });

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
                    aspectRatio={16 / 9}
                    targetWidth={1920}
                    targetHeight={1080}
                    maxSize={10 * 1024 * 1024}
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
                name="type"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel>Tipe Banner / Penempatan</FieldLabel>
                    <select
                      {...field}
                      className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold"
                    >
                      <option value="hero">
                        Banner Hero Utama (Slideshow Atas)
                      </option>
                      <option value="info">
                        Informasi & Update Terkini (Carousel)
                      </option>
                    </select>
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
                    <NumberInput
                      placeholder="Masukkan urutan banner"
                      value={field.value}
                      onChange={(value) => field.onChange(value)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
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
