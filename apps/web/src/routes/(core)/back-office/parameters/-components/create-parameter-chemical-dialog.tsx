import { Button } from "@/components/ui/button";
import ComboBox from "@/components/ui/combobox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { queryClient, trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import parameterChemicalMaterialSchema from "@tepian-k3/schema/parameter-chemical-material.schema";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type z from "zod";

interface CreateParameterChemicalDialogProps {
  parameterId: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function CreateParameterChemicalDialog({
  parameterId,
  isOpen,
  setIsOpen,
}: CreateParameterChemicalDialogProps) {
  const [chemicalMaterialOpen, setChemicalMaterialOpen] = useState(false);

  const form = useForm<
    z.infer<
      typeof parameterChemicalMaterialSchema.createParameterChemicalMaterialSchema
    >
  >({
    resolver: zodResolver(
      parameterChemicalMaterialSchema.createParameterChemicalMaterialSchema,
    ),
    defaultValues: {
      parameterId,
    },
  });

  const createParameterChemicalMutation = useMutation(
    trpc.parameterChemicalMaterial.assignChemicalMaterialToParameter.mutationOptions(
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries(
            trpc.parameterChemicalMaterial.getAllChemicalMaterialsByParameterId.queryOptions(
              {
                parameterId,
              },
            ),
          );
          globalSuccessToast("Bahan kimia berhasil ditambahkan ke parameter.");
          setChemicalMaterialOpen(false);
          form.reset();
          setIsOpen(false);
        },
        onError: (error) => {
          globalErrorToast(
            "Gagal menambahkan bahan kimia ke parameter: " + error.message,
          );
        },
      },
    ),
  );

  const { data: chemicalMaterials, isLoading } = useQuery(
    trpc.chemicalMaterial.getAll.queryOptions(),
  );

  function handleSubmit(
    data: z.infer<
      typeof parameterChemicalMaterialSchema.createParameterChemicalMaterialSchema
    >,
  ) {
    createParameterChemicalMutation.mutate(data);
  }

  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset form when dialog closes
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <form>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Bahan Kimia Terkait Parameter</DialogTitle>
            <DialogDescription>
              Isi formulir di bawah untuk menambahkan bahan kimia baru yang
              terkait dengan parameter
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid gap-4"
          >
            <FieldGroup>
              <Controller
                control={form.control}
                name="chemicalMaterialId"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Bahan Kimia
                    </FieldLabel>
                    <ComboBox
                      options={
                        chemicalMaterials?.map((chemicalMaterial) => ({
                          id: chemicalMaterial.id,
                          name: `${chemicalMaterial.name} - ${chemicalMaterial.code}`,
                        })) ?? []
                      }
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Pilih bahan kimia..."
                      searchPlaceholder="Cari bahan kimia..."
                      emptyMessage="Tidak ada bahan kimia yang ditemukan."
                      open={chemicalMaterialOpen}
                      onOpenChange={setChemicalMaterialOpen}
                      invalid={fieldState.invalid}
                      isLoading={isLoading}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
            <DialogFooter>
              <DialogClose>Batal</DialogClose>
              <Button
                type="submit"
                disabled={createParameterChemicalMutation.isPending}
              >
                {createParameterChemicalMutation.isPending ? <Spinner /> : null}
                Tambahkan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </form>
    </Dialog>
  );
}
