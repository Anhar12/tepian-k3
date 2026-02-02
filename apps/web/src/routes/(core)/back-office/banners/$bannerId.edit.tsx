import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/utils/require-permission";
import { z } from "zod";
import { useRedirectBackWithTimeout } from "@/lib/redirect-back-with-timeout";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, trpc } from "@/utils/trpc";
import { Controller, useForm } from "react-hook-form";
import bannerSchema from "@tepian-k3/schema/banner.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { toFormData } from "@/utils/form-data-mapper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SkeletonButton,
  SkeletonImageUpload,
  SkeletonInput,
} from "@/components/ui/skeleton-generator";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import SingleImageUpload from "@/components/ui/single-image-upload";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute(
  "/(core)/back-office/banners/$bannerId/edit",
)({
  params: z.object({
    bannerId: z.string(),
  }),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "banners.update" }),
  component: RouteComponent,
});

function RouteComponent() {
  const { bannerId } = Route.useParams();
  const redirectBack = useRedirectBackWithTimeout();

  const { data: banner, isLoading } = useQuery(
    trpc.banner.getBannerById.queryOptions({ id: bannerId }),
  );

  const form = useForm<z.infer<typeof bannerSchema.updateBannerSchema>>({
    resolver: zodResolver(bannerSchema.updateBannerSchema),
    values: {
      id: bannerId,
      title: banner?.title ?? "",
      order: banner?.order ?? 0,
      isActive: banner?.isActive ?? true,
    },
  });

  const updateBannerMutation = useMutation(
    trpc.banner.updateBanner.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.banner.getBannerById.queryOptions({ id: bannerId }),
        );
        globalSuccessToast("Banner berhasil diperbarui");
        await redirectBack();
      },
      onError: (error) => {
        globalErrorToast(`Gagal memperbarui banner: ${error.message}`);
      },
    }),
  );

  const handleSubmit = (
    data: z.infer<typeof bannerSchema.updateBannerSchema>,
  ) => {
    const formData = toFormData(data);

    updateBannerMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Perbarui Banner</CardTitle>
            <CardDescription>
              Isi formulir di bawah untuk memperbarui informasi banner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, index) =>
                index === 0 ? (
                  <SkeletonImageUpload key={index} />
                ) : (
                  <SkeletonInput className="w-full" key={index} />
                ),
              )}
              <SkeletonButton className="w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Perbarui Banner</CardTitle>
          <CardDescription>
            Isi formulir di bawah untuk memperbarui informasi banner.
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
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            <Button type="submit" disabled={updateBannerMutation.isPending}>
              {updateBannerMutation.isPending ? <Spinner /> : null}
              Perbarui Banner
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
