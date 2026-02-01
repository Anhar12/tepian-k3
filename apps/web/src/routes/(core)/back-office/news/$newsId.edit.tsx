import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/utils/require-permission";
import { useRedirectBackWithTimeout } from "@/lib/redirect-back-with-timeout";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import newsSchema from "@tepian-k3/schema/news.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, trpc } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  SkeletonButton,
  SkeletonImageUpload,
  SkeletonInput,
} from "@/components/ui/skeleton-generator";

export const Route = createFileRoute("/(core)/back-office/news/$newsId/edit")({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "news.update" }),
  params: z.object({
    newsId: z.uuidv7(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { newsId } = Route.useParams();
  const redirectBack = useRedirectBackWithTimeout();

  const { data: news, isLoading } = useQuery(
    trpc.news.getNewsById.queryOptions({ id: newsId }),
  );

  const form = useForm<z.infer<typeof newsSchema.updateNewsSchema>>({
    resolver: zodResolver(newsSchema.updateNewsSchema),
    values: {
      id: newsId,
      title: news?.title ?? "",
      content: news?.content ?? "",
      isPublished: news?.isPublished,
      publishedAt: news?.publishedAt
        ? format(new Date(news.publishedAt), "yyyy-MM-dd'T'HH:mm")
        : undefined,
    },
  });

  const updateNewsMutation = useMutation(
    trpc.news.updateNews.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.news.getNewsById.queryOptions({ id: newsId }),
        );
        globalSuccessToast("Berita berhasil diperbarui");
        await redirectBack();
      },
      onError: (error) => {
        globalErrorToast(`Gagal memperbarui berita: ${error.message}`);
      },
    }),
  );

  const handleSubmit = (data: z.infer<typeof newsSchema.updateNewsSchema>) => {
    const formData = toFormData(data);
    updateNewsMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Perbarui Berita</CardTitle>
            <CardDescription>
              Isi formulir di bawah untuk memperbarui informasi berita.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {Array.from({ length: 4 }).map((_, index) =>
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
          <CardTitle>Perbarui Berita</CardTitle>
          <CardDescription>
            Isi formulir di bawah untuk memperbarui informasi berita.
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
                name="image"
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
                    <FieldLabel>Judul Berita</FieldLabel>
                    <Input placeholder="Masukkan judul berita" {...field} />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="content"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel>Konten Berita</FieldLabel>
                    <Textarea placeholder="Masukkan konten berita" {...field} />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="isPublished"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                    orientation="horizontal"
                  >
                    <Checkbox
                      id={`form-rhf-checkbox-isPublished`}
                      name={field.name}
                      aria-invalid={fieldState.invalid}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <FieldLabel
                      htmlFor={`form-rhf-checkbox-isPublished`}
                      className="font-normal"
                    >
                      Publish langsung setelah dibuat
                    </FieldLabel>
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="publishedAt"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Tanggal Publikasi (Opsional)
                    </FieldLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-60 pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value
                            ? format(new Date(field.value), "PPP")
                            : "Pilih tanggal publikasi"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={new Date(field.value ?? "")}
                          onSelect={(value) => {
                            field.onChange(value?.toISOString() ?? null);
                          }}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            <Button type="submit" disabled={updateNewsMutation.isPending}>
              {updateNewsMutation.isPending ? <Spinner /> : null}
              Simpan Perubahan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
