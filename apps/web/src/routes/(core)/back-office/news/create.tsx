import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { useRedirectBackWithTimeout } from "@/lib/redirect-back-with-timeout";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import newsSchema from "@tepian-k3/schema/news.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
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

export const Route = createFileRoute("/(core)/back-office/news/create")({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "news.create" }),
  component: RouteComponent,
  head: () => pageHead("Tambah Berita"),
});

function RouteComponent() {
  const redirectBack = useRedirectBackWithTimeout();

  const form = useForm<z.infer<typeof newsSchema.createNewsSchema>>({
    resolver: zodResolver(newsSchema.createNewsSchema),
  });

  const createNewsMutation = useMutation({
    ...trpc.news.createNews.mutationOptions(),
    onSuccess: async () => {
      globalSuccessToast("Berita berhasil dibuat");
      await redirectBack();
    },
    onError: (error) => {
      globalErrorToast(`Gagal membuat berita: ${error.message}`);
    },
  });

  const handleSubmit = (data: z.infer<typeof newsSchema.createNewsSchema>) => {
    const formData = toFormData(data);
    createNewsMutation.mutate(formData);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Buat Berita Baru</CardTitle>
          <CardDescription>
            Isi formulir di bawah untuk menambahkan berita baru ke sistem.
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

            <Button type="submit" disabled={createNewsMutation.isPending}>
              {createNewsMutation.isPending ? <Spinner /> : null}
              Buat Berita
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
