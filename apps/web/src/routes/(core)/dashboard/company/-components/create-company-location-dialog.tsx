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

interface CreateCompanyLocationDialogProps {
  companyId: string;
}

export default function CreateCompanyLocationDialog({
  companyId,
}: CreateCompanyLocationDialogProps) {
  const isCreateDialogOpen = useTestingLocationDialogStore(
    (state) => state.isCreateDialogOpen,
  );
  const setIsCreateDialogOpen = useTestingLocationDialogStore(
    (state) => state.setIsCreateDialogOpen,
  );

  const [regencyOpen, setRegencyOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);

  const form = useForm<
    z.infer<
      typeof userCompanyTestingLocationSchema.createUserCompanyTestingLocationSchema
    >
  >({
    resolver: zodResolver(
      userCompanyTestingLocationSchema.createUserCompanyTestingLocationSchema,
    ),
    defaultValues: {
      userCompanyId: companyId,
    },
  });

  const regencyId = form.watch("regencyId");

  const createCompanyTestingLocationMutation = useMutation(
    trpc.pengujian.userCompanyTestingLocation.userCreateUserCompanyTestingLocation.mutationOptions(
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries(
            trpc.pengujian.userCompanyTestingLocation.getAllUserCompanyTestingLocationsByCompanyIdAndUserId.queryOptions(
              {
                companyId,
              },
            ),
          );
          form.reset();
          globalSuccessToast(
            "Lokasi pengujian perusahaan berhasil ditambahkan",
          );
          setIsCreateDialogOpen(false);
        },
        onError: (error) => {
          globalErrorToast(
            `Gagal menambahkan lokasi pengujian perusahaan: ${error.message}`,
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
      typeof userCompanyTestingLocationSchema.createUserCompanyTestingLocationSchema
    >,
  ) {
    createCompanyTestingLocationMutation.mutate(data);
  }

  // Reset form when dialog is closed
  useEffect(() => {
    if (!isCreateDialogOpen) {
      form.reset();
    }
  }, [isCreateDialogOpen, form]);

  return (
    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
      <form>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Tambah Lokasi Pengujian Perusahaan</DialogTitle>
            <DialogDescription>
              Isi formulir di bawah untuk menambahkan lokasi pengujian baru
            </DialogDescription>
          </DialogHeader>
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
                      Nama Lokasi Pengujian
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan nama lokasi pengujian..."
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
                      value={field.value}
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
                      value={field.value}
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
                disabled={createCompanyTestingLocationMutation.isPending}
              >
                {createCompanyTestingLocationMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Tambahkan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </form>
    </Dialog>
  );
}
