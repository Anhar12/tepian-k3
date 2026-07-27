import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { queryClient, trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import parameterCategoriesSchema from "@tepian-k3/schema/pengujian/parameter-categories.schema";
import { Check, ChevronsUpDown, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import type { ParameterCategories } from "@tepian-k3/types/pengujian/parameter-categories.types";

export function ParameterCategoryModal({
  row,
  open,
  onOpenChange,
}: {
  row: ParameterCategories;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Perbarui Kategori Parameter</DialogTitle>
          <DialogDescription>
            Isi form di bawah untuk memperbarui kategori parameter.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ParameterCategoryForm
            parameterCategory={row}
            setOpen={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ParameterCategoryForm({
  parameterCategory,
  setOpen,
}: {
  parameterCategory: ParameterCategories;
  setOpen: (open: boolean) => void;
}) {
  const { data: clusters } = useSuspenseQuery(
    trpc.pengujian.cluster.getAllClusters.queryOptions(),
  );

  const [clusterOpen, setClusterOpen] = useState(false);

  const form = useForm<
    z.infer<typeof parameterCategoriesSchema.updateParameterCategorySchema>
  >({
    resolver: zodResolver(
      parameterCategoriesSchema.updateParameterCategorySchema,
    ),
    defaultValues: {
      id: parameterCategory.id,
      clusterId: parameterCategory.clusterId,
      name: parameterCategory.name,
      description: parameterCategory.description ?? undefined,
    },
  });

  const updateParameterCategoryMutation = useMutation(
    trpc.pengujian.parameterCategories.updateParameterCategory.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.parameterCategories.getPaginatedParameterCategories.queryOptions(
            {},
          ),
        );
        globalSuccessToast("Berhasil memperbarui parameter category");
        setOpen(false);
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
    <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 py-4">
      <FieldGroup>
        <Controller
          control={form.control}
          name="clusterId"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="space-y-1">
              <FieldLabel className="ml-1 text-sm font-bold">Cluster</FieldLabel>
              <Popover open={clusterOpen} onOpenChange={setClusterOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={clusterOpen}
                    aria-invalid={fieldState.invalid}
                    className={cn(
                      "w-full justify-between",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    {field.value
                      ? clusters.find((c) => c.id === field.value)?.name
                      : "Pilih cluster..."}
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Cari cluster..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>Tidak ada cluster yang ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {clusters.map((cluster) => (
                          <CommandItem
                            value={cluster.id}
                            key={cluster.id}
                            onSelect={() => {
                              field.onChange(cluster.id);
                              setClusterOpen(false);
                            }}
                          >
                            {cluster.name}
                            <Check
                              className={cn(
                                "ml-auto",
                                field.value === cluster.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
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
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="space-y-1">
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
            <Field data-invalid={fieldState.invalid} className="space-y-1">
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
  );
}
