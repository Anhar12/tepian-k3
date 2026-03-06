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
import { Input } from "@/components/ui/input";
import { SkeletonGenerator } from "@/components/ui/skeleton-generator";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { useTestingLocationDialogStore } from "@/stores/testing-location-dialog.stores";
import { queryClient, trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import userCompanyTestingLocationSchema from "@tepian-k3/schema/pengujian/user-company-testing-location.schema";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type z from "zod";

interface EditCompanyLocationDialogProps {
  companyId: string;
}

export default function EditCompanyLocationDialog({
  companyId,
}: EditCompanyLocationDialogProps) {
  const editingTestingLocationId = useTestingLocationDialogStore(
    (state) => state.editingTestingLocationId,
  );
  const setEditingTestingLocationId = useTestingLocationDialogStore(
    (state) => state.setEditingTestingLocationId,
  );
  const isEditDialogOpen = useTestingLocationDialogStore(
    (state) => state.isEditDialogOpen,
  );
  const setIsEditDialogOpen = useTestingLocationDialogStore(
    (state) => state.setIsEditDialogOpen,
  );

  const [regencyOpen, setRegencyOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);

  const { data: editingTestingLocation, isLoading } = useQuery({
    ...trpc.pengujian.userCompanyTestingLocation.getUserCompanyTestingLocationById.queryOptions(
      {
        id: editingTestingLocationId!,
      },
    ),
    enabled: !!editingTestingLocationId,
  });

  const form = useForm<
    z.infer<
      typeof userCompanyTestingLocationSchema.updateUserCompanyTestingLocationSchema
    >
  >({
    resolver: zodResolver(
      userCompanyTestingLocationSchema.updateUserCompanyTestingLocationSchema,
    ),
    defaultValues: {
      name: "",
      regencyId: "",
      districtId: "",
      userCompanyId: companyId,
    },
  });

  const regencyId = form.watch("regencyId");

  // Update form values when editing data is loaded
  useEffect(() => {
    if (editingTestingLocation) {
      form.reset({
        id: editingTestingLocation.id,
        name: editingTestingLocation.name,
        regencyId: editingTestingLocation.regencyId,
        districtId: editingTestingLocation.districtId,
        userCompanyId: editingTestingLocation.userCompanyId,
      });
    }
  }, [editingTestingLocation, form]);

  const updateCompanyTestingLocationMutation = useMutation(
    trpc.pengujian.userCompanyTestingLocation.userUpdateUserCompanyTestingLocation.mutationOptions(
      {
        onSuccess: async (data) => {
          await queryClient.invalidateQueries(
            trpc.pengujian.userCompanyTestingLocation.getAllUserCompanyTestingLocationsByCompanyIdAndUserId.queryOptions(
              {
                companyId,
              },
            ),
          );
          await queryClient.invalidateQueries(
            trpc.pengujian.userCompanyTestingLocation.getUserCompanyTestingLocationById.queryOptions(
              {
                id: data.id,
              },
            ),
          );
          globalSuccessToast("Lokasi pengujian perusahaan berhasil diperbarui");
          setIsEditDialogOpen(false);
          setEditingTestingLocationId(null);
        },
        onError: (error) => {
          globalErrorToast(
            `Gagal memperbarui lokasi pengujian perusahaan: ${error.message}`,
          );
        },
      },
    ),
  );

  const { data: regency } = useQuery(
    trpc.platform.regency.getAllRegencies.queryOptions(),
  );

  const { data: districts } = useQuery({
    ...trpc.platform.district.getAllDistrictsByRegencyId.queryOptions({
      regencyId: regencyId!,
    }),
    enabled: !!regencyId,
  });

  function handleSubmit(
    data: z.infer<
      typeof userCompanyTestingLocationSchema.updateUserCompanyTestingLocationSchema
    >,
  ) {
    updateCompanyTestingLocationMutation.mutate(data);
  }

  // Reset form when dialog is closed
  useEffect(() => {
    if (!isEditDialogOpen) {
      form.reset({
        name: "",
        regencyId: "",
        districtId: "",
        userCompanyId: companyId,
      });
      setEditingTestingLocationId(null);
    }
  }, [isEditDialogOpen, form, companyId, setEditingTestingLocationId]);

  return (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Tambah Lokasi Pengujian Perusahaan</DialogTitle>
          <DialogDescription>
            Isi formulir di bawah untuk menambahkan lokasi pengujian baru
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="grid gap-4">
            <SkeletonGenerator variant="input" />
            <SkeletonGenerator variant="combobox" />
            <SkeletonGenerator variant="combobox" />
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid gap-4"
          >
            <FieldGroup>
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Nama Perusahaan
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan nama perusahaan"
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
                name="regencyId"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Kabupaten/Kota
                    </FieldLabel>
                    <ComboBox
                      options={regency || []}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Pilih kabupaten/kota..."
                      searchPlaceholder="Cari kabupaten/kota..."
                      emptyMessage="Tidak ada kabupaten/kota yang ditemukan."
                      open={regencyOpen}
                      onOpenChange={setRegencyOpen}
                      invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="districtId"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Kecamatan
                    </FieldLabel>
                    <ComboBox
                      options={districts || []}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Pilih kecamatan..."
                      searchPlaceholder="Cari kecamatan..."
                      emptyMessage="Tidak ada kecamatan yang ditemukan."
                      open={districtOpen}
                      onOpenChange={setDistrictOpen}
                      disabled={!regencyId}
                      invalid={fieldState.invalid}
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
                disabled={updateCompanyTestingLocationMutation.isPending}
              >
                {updateCompanyTestingLocationMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
