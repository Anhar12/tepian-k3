import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import z from "zod";
import { useRedirectBackWithTimeout } from "@/lib/redirect-back-with-timeout";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/spinner";
import chemicalMaterialSchema from "@tepian-k3/schema/pengujian/chemical-material.schema";
import {
  BAHAN_STATUS,
  BAHAN_STATUS_LABELS,
  BAHAN_UNIT_LABELS,
  BAHAN_UNITS,
} from "@tepian-k3/constants";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  SkeletonButton,
  SkeletonInput,
  SkeletonTextArea,
} from "@/components/ui/skeleton-generator";

export const Route = createFileRoute(
  "/(core)/back-office/chemical-materials/$chemicalMaterialId/edit",
)({
  params: z.object({
    chemicalMaterialId: z.uuidv7(),
  }),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: "chemical-materials.update",
    }),
  component: RouteComponent,
  head: () => pageHead("Edit Bahan Kimia"),
});

function RouteComponent() {
  const { chemicalMaterialId } = Route.useParams();
  const redirectBack = useRedirectBackWithTimeout();

  const { data: chemicalMaterial, isLoading } = useQuery(
    trpc.pengujian.chemicalMaterial.getById.queryOptions({
      id: chemicalMaterialId,
    }),
  );

  const form = useForm<
    z.infer<typeof chemicalMaterialSchema.updateChemicalMaterialSchema>
  >({
    resolver: zodResolver(chemicalMaterialSchema.updateChemicalMaterialSchema),
    defaultValues: chemicalMaterial,
  });

  const updateChemicalMaterialMutation = useMutation(
    trpc.pengujian.chemicalMaterial.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.chemicalMaterial.getById.queryOptions({
            id: chemicalMaterialId,
          }),
        );
        globalSuccessToast("Berhasil memperbarui bahan kimia");
        await redirectBack();
      },
      onError: (error) => {
        globalErrorToast("Gagal memperbarui bahan kimia: " + error.message);
      },
    }),
  );

  function handleSubmit(
    data: z.infer<typeof chemicalMaterialSchema.updateChemicalMaterialSchema>,
  ) {
    updateChemicalMaterialMutation.mutate(data);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Perbarui Bahan Kimia</CardTitle>
            <CardDescription>
              Isi formulir di bawah untuk memperbarui informasi bahan kimia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {Array.from({ length: 15 }).map((_, index) =>
                index === 13 ? (
                  <SkeletonTextArea key={index} />
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
          <CardTitle>Perbarui Bahan Kimia</CardTitle>
          <CardDescription>
            Isi formulir di bawah untuk memperbarui informasi bahan kimia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-4"
          >
            <FieldGroup>
              <Controller
                name="code"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel>Kode Bahan Kimia</FieldLabel>
                    <Input placeholder="Masukkan kode bahan kimia" {...field} />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="catalogNumber"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel>Nomor Katalog Bahan Kimia</FieldLabel>
                    <Input
                      placeholder="Masukkan nomor katalog bahan kimia"
                      {...field}
                      value={field.value || ""}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="chemicalFormula"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel>Rumus Kimia</FieldLabel>
                    <Input
                      placeholder="Masukkan rumus kimia"
                      {...field}
                      value={field.value || ""}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel>Nama Bahan Kimia</FieldLabel>
                    <Input
                      placeholder="Masukkan nama bahan kimia"
                      {...field}
                      value={field.value || ""}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="usedStock"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel>Stok Terpakai</FieldLabel>
                    <NumberInput
                      placeholder="Masukkan stok terpakai"
                      value={field.value || 0}
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
                name="usedStockUnit"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Satuan Stok Terpakai
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Pilih Satuan Stok Terpakai" />
                      </SelectTrigger>
                      <SelectContent>
                        {BAHAN_UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {BAHAN_UNIT_LABELS[unit]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="sealedStock"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel>Stok Segel</FieldLabel>
                    <NumberInput
                      placeholder="Masukkan stok segel"
                      value={field.value || 0}
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
                name="sealedStockUnit"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Satuan Stok Segel
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Pilih Satuan Penggunaan Bulanan" />
                      </SelectTrigger>
                      <SelectContent>
                        {BAHAN_UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {BAHAN_UNIT_LABELS[unit]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="monthlyUsage"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel>Penggunaan Bulanan</FieldLabel>
                    <NumberInput
                      placeholder="Masukkan penggunaan bulanan"
                      value={field.value || 0}
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
                name="monthlyUsageUnit"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Satuan Penggunaan Bulanan
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Pilih Satuan Penggunaan Bulanan" />
                      </SelectTrigger>
                      <SelectContent>
                        {BAHAN_UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {BAHAN_UNIT_LABELS[unit]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="remainingUsedMaterial"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel>Penggunaan Sisa Bahan</FieldLabel>
                    <NumberInput
                      placeholder="Masukkan penggunaan sisa bahan"
                      value={field.value || 0}
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
                name="remainingUsedMaterialUnit"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Satuan Penggunaan Sisa Bahan
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Pilih Satuan Penggunaan Sisa Bahan" />
                      </SelectTrigger>
                      <SelectContent>
                        {BAHAN_UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {BAHAN_UNIT_LABELS[unit]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="incomingMaterialNote"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel>Catatan Bahan Masuk</FieldLabel>
                    <Textarea
                      placeholder="Masukkan catatan bahan masuk"
                      {...field}
                      value={field.value || ""}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="expiredDate"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Tanggal Kedaluwarsa Bahan Kimia
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
                            : "Pick a date"}
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

              <Controller
                control={form.control}
                name="status"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Status
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Pilih Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {BAHAN_STATUS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {BAHAN_STATUS_LABELS[unit]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            <Button
              type="submit"
              disabled={updateChemicalMaterialMutation.isPending}
            >
              {updateChemicalMaterialMutation.isPending ? <Spinner /> : null}
              Perbarui Bahan Kimia
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
