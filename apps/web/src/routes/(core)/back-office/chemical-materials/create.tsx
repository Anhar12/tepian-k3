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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/utils/require-permission";
import type z from "zod";
import { useRedirectBackWithTimeout } from "@/lib/redirect-back-with-timeout";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/spinner";
import chemicalMaterialSchema from "@tepian-k3/schema/chemical-material.schema";
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

export const Route = createFileRoute(
  "/(core)/back-office/chemical-materials/create",
)({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: "chemical-materials.create",
    }),
  component: RouteComponent,
});

function RouteComponent() {
  const redirectBack = useRedirectBackWithTimeout();

  const form = useForm<
    z.infer<typeof chemicalMaterialSchema.createChemicalMaterialSchema>
  >({
    resolver: zodResolver(chemicalMaterialSchema.createChemicalMaterialSchema),
    defaultValues: {
      code: "",
      catalogNumber: "",
      chemicalFormula: "",
      name: "",
      usedStock: 0,
      sealedStock: 0,
      monthlyUsage: 0,
      remainingUsedMaterial: 0,
      incomingMaterialNote: "",
    },
  });

  const createChemicalMaterialMutation = useMutation(
    trpc.chemicalMaterial.create.mutationOptions({
      onSuccess: async () => {
        globalSuccessToast("Bahan kimia berhasil dibuat");
        await redirectBack();
      },
      onError: (error) => {
        globalErrorToast(`Gagal membuat bahan kimia: ${error.message}`);
      },
    }),
  );

  function handleSubmit(
    data: z.infer<typeof chemicalMaterialSchema.createChemicalMaterialSchema>,
  ) {
    createChemicalMaterialMutation.mutate(data);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Buat Bahan Kimia Baru</CardTitle>
          <CardDescription>
            Isi formulir di bawah untuk menambahkan bahan kimia baru ke sistem.
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
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
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
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
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
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
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
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
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
                    <Input
                      placeholder="Masukkan stok terpakai"
                      type="number"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
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
                    <Input
                      placeholder="Masukkan stok segel"
                      type="number"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
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
                    <Input
                      placeholder="Masukkan penggunaan bulanan"
                      type="number"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
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
                    <Input
                      placeholder="Masukkan penggunaan sisa bahan"
                      type="number"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
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
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
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
              disabled={createChemicalMaterialMutation.isPending}
            >
              {createChemicalMaterialMutation.isPending ? <Spinner /> : null}
              Buat Bahan Kimia
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
