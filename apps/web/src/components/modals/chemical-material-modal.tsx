import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { ChemicalMaterial } from "@tepian-k3/types/pengujian/chemical-material.types";
import z from "zod";
import {
  SkeletonButton,
  SkeletonInput,
  SkeletonTextArea,
} from "@/components/ui/skeleton-generator";

export function ChemicalMaterialModal({
  row,
  open,
  onOpenChange,
}: {
  row: ChemicalMaterial;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Perbarui Bahan Kimia</DialogTitle>
          <DialogDescription>
            Isi formulir di bawah untuk memperbarui informasi bahan kimia.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ChemicalMaterialForm chemicalMaterialId={row.id} setOpen={onOpenChange} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChemicalMaterialForm({
  chemicalMaterialId,
  setOpen,
}: {
  chemicalMaterialId: string;
  setOpen: (open: boolean) => void;
}) {
  const { data: chemicalMaterial, isLoading } = useQuery(
    trpc.pengujian.chemicalMaterial.getById.queryOptions({
      id: chemicalMaterialId,
    }),
  );

  const form = useForm<
    z.infer<typeof chemicalMaterialSchema.updateChemicalMaterialSchema>
  >({
    resolver: zodResolver(chemicalMaterialSchema.updateChemicalMaterialSchema),
    defaultValues: {
      id: chemicalMaterialId,
      code: "",
      catalogNumber: "",
      chemicalFormula: "",
      name: "",
      usedStock: 0,
      usedStockUnit: "gram",
      sealedStock: 0,
      sealedStockUnit: "gram",
      monthlyUsage: 0,
      monthlyUsageUnit: "gram",
      remainingUsedMaterial: 0,
      remainingUsedMaterialUnit: "gram",
      incomingMaterialNote: "",
      status: "tersedia",
    },
    values: chemicalMaterial as any,
  });

  const updateChemicalMaterialMutation = useMutation(
    trpc.pengujian.chemicalMaterial.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.chemicalMaterial.getPaginated.queryOptions({}),
        );
        globalSuccessToast("Berhasil memperbarui bahan kimia");
        setOpen(false);
      },
      onError: (error) => {
        globalErrorToast("Gagal memperbarui bahan kimia: " + error.message);
      },
    }),
  );

  function handleSubmit(
    data: any,
  ) {
    updateChemicalMaterialMutation.mutate(data);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 py-4">
        {Array.from({ length: 15 }).map((_, index) =>
          index === 13 ? (
            <SkeletonTextArea key={index} />
          ) : (
            <SkeletonInput className="w-full" key={index} />
          ),
        )}
        <SkeletonButton className="w-full" />
      </div>
    );
  }

  const pendingStock = (chemicalMaterial as any)?.pendingStock ?? 0;
  const sealedStock = chemicalMaterial?.sealedStock ?? 0;
  const usedStock = chemicalMaterial?.usedStock ?? 0;
  const totalFisik = sealedStock + usedStock;
  const unit = chemicalMaterial?.sealedStockUnit ?? "mL";
  const effectiveStock = totalFisik - pendingStock;

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="grid gap-4 py-4"
    >
      <div className="grid grid-cols-3 gap-4 p-4 border rounded-md bg-muted/50">
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">Stok Fisik (Segel + Terpakai)</span>
          <span className="text-lg font-semibold">{totalFisik} {unit}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">Terpesan (Booking Order)</span>
          <span className="text-lg font-semibold">{pendingStock} {unit}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">Efektif Tersisa</span>
          <span className="text-lg font-semibold text-primary">{effectiveStock} {unit}</span>
        </div>
      </div>

      <FieldGroup>
        <div className="flex flex-row gap-4">
          <Controller
            name="code"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="w-1/2 space-y-1">
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
              <Field data-invalid={fieldState.invalid} className="w-1/2 space-y-1">
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
        </div>

        <div className="flex flex-row gap-4">
          <Controller
            name="chemicalFormula"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="w-1/2 space-y-1">
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
              <Field data-invalid={fieldState.invalid} className="w-1/2 space-y-1">
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
        </div>

        <div className="flex flex-row gap-4">
          <Controller
            name="usedStock"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="w-1/2 space-y-1">
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
              <Field data-invalid={fieldState.invalid} className="w-1/2 space-y-1">
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
        </div>

        <div className="flex flex-row gap-4">
          <Controller
            name="sealedStock"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="w-1/2 space-y-1">
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
              <Field data-invalid={fieldState.invalid} className="w-1/2 space-y-1">
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
        </div>

        <div className="flex flex-row gap-4">
          <Controller
            name="monthlyUsage"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="w-1/2 space-y-1">
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
              <Field data-invalid={fieldState.invalid} className="w-1/2 space-y-1">
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
        </div>

        <div className="flex flex-row gap-4">
          <Controller
            name="remainingUsedMaterial"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="w-1/2 space-y-1">
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
              <Field data-invalid={fieldState.invalid} className="w-1/2 space-y-1">
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
        </div>

        <Controller
          name="incomingMaterialNote"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="space-y-1">
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

        <div className="flex flex-row gap-4">
          <Controller
            control={form.control}
            name="expiredDate"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="w-1/2 space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Tanggal Kedaluwarsa
                </FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
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
                      selected={field.value ? new Date(field.value) : undefined}
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
              <Field data-invalid={fieldState.invalid} className="w-1/2 space-y-1">
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
        </div>
      </FieldGroup>

      <Button
        type="submit"
        disabled={updateChemicalMaterialMutation.isPending}
        className="mt-2"
      >
        {updateChemicalMaterialMutation.isPending ? <Spinner /> : null}
        Perbarui Bahan Kimia
      </Button>
    </form>
  );
}
