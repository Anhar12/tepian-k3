import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ComboBox from "@/components/ui/combobox";
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
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useRedirectBackWithTimeout } from "@/lib/redirect-back-with-timeout";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { RadioGroupItem } from "@radix-ui/react-radio-group";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import userCompanySchema from "@tepian-k3/schema/user-company.schema";
import { Check, ChevronsUpDown, LoaderCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

export const Route = createFileRoute("/(core)/dashboard/company/create")({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: "user-company.create",
    }),
  loader: async ({ context }) => {
    context.queryClient.ensureQueryData(
      context.trpc.kbli.getAllKblis.queryOptions(),
    );
    context.queryClient.ensureQueryData(
      context.trpc.province.getAllProvinces.queryOptions(),
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const redirectBack = useRedirectBackWithTimeout();

  const { data: profile } = useSuspenseQuery(trpc.auth.profile.queryOptions());

  const [kbliOpen, setKbliOpen] = useState(false);
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [regencyOpen, setRegencyOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [villageOpen, setVillageOpen] = useState(false);

  const form = useForm<
    z.infer<typeof userCompanySchema.createUserCompanySchema>
  >({
    resolver: zodResolver(userCompanySchema.createUserCompanySchema),
    defaultValues: {
      userId: profile.id,
    },
  });

  const provinceId = form.watch("provinceId");
  const regencyId = form.watch("regencyId");
  const districtId = form.watch("districtId");
  const wlkpStatus = form.watch("wlkpStatus");

  const createUserCompanyMutation = useMutation(
    trpc.userCompany.userCreateUserCompany.mutationOptions({
      onSuccess: async () => {
        globalSuccessToast("Berhasil membuat data perusahaan.");
        await redirectBack();
      },
      onError: (error) => {
        globalErrorToast(`Gagal membuat data perusahaan: ${error.message}`);
      },
    }),
  );

  const handleSubmit = (
    data: z.infer<typeof userCompanySchema.createUserCompanySchema>,
  ) => {
    createUserCompanyMutation.mutate(data);
  };

  const { data: kbli } = useSuspenseQuery(trpc.kbli.getAllKblis.queryOptions());
  const { data: province } = useSuspenseQuery(
    trpc.province.getAllProvinces.queryOptions(),
  );
  const { data: regency } = useQuery({
    ...trpc.regency.getAllRegenciesByProvinceId.queryOptions({
      provinceId,
    }),
    enabled: !!provinceId,
  });
  const { data: district } = useQuery({
    ...trpc.district.getAllDistrictsByRegencyId.queryOptions({
      regencyId,
    }),
    enabled: !!regencyId,
  });
  const { data: village } = useQuery({
    ...trpc.village.getAllVillagesByDistrictId.queryOptions({
      districtId,
    }),
    enabled: !!districtId,
  });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Buat Perusahaan Baru</CardTitle>
          <CardDescription>
            Isi form di bawah untuk membuat perusahaan baru.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                name="email"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Email Perusahaan
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan email perusahaan"
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
                name="femaleWorkers"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Jumlah Pekerja Perempuan
                    </FieldLabel>
                    <Input
                      type="number"
                      placeholder="Masukkan jumlah pekerja perempuan"
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
                name="maleWorkers"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Jumlah Pekerja Laki-laki
                    </FieldLabel>
                    <Input
                      type="number"
                      placeholder="Masukkan jumlah pekerja laki-laki"
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
                name="kbliId"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Kategori KBLI
                    </FieldLabel>
                    <ComboBox
                      options={kbli}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Pilih kategori KBLI..."
                      searchPlaceholder="Cari kategori KBLI..."
                      emptyMessage="Tidak ada kategori KBLI yang ditemukan."
                      open={kbliOpen}
                      onOpenChange={setKbliOpen}
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
                name="provinceId"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Provinsi
                    </FieldLabel>
                    <ComboBox
                      options={province}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Pilih provinsi..."
                      searchPlaceholder="Cari provinsi..."
                      emptyMessage="Tidak ada provinsi yang ditemukan."
                      open={provinceOpen}
                      onOpenChange={setProvinceOpen}
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
                      disabled={!provinceId}
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
                      options={district || []}
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

              <Controller
                control={form.control}
                name="villageId"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Desa/Kelurahan
                    </FieldLabel>
                    <ComboBox
                      options={village || []}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Pilih desa/kelurahan..."
                      searchPlaceholder="Cari desa/kelurahan..."
                      emptyMessage="Tidak ada desa/kelurahan yang ditemukan."
                      open={villageOpen}
                      onOpenChange={setVillageOpen}
                      disabled={!districtId}
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
                name="address"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Alamat Perusahaan
                    </FieldLabel>
                    <Textarea
                      placeholder="Masukkan alamat perusahaan"
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
                name="healthFacilityAvailable"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FieldSet data-invalid={fieldState.invalid}>
                    <FieldLegend>
                      Fasilitas Kesehatan Tersedia di Perusahaan
                    </FieldLegend>
                    <FieldDescription>
                      Apakah perusahaan Anda memiliki fasilitas kesehatan
                      sendiri?
                    </FieldDescription>
                    <RadioGroup
                      name={field.name}
                      value={String(field.value)}
                      onValueChange={(value) => {
                        field.onChange(value === "true");
                      }}
                      aria-invalid={fieldState.invalid}
                      className="flex flex-row"
                    >
                      <FieldLabel htmlFor={`form-rhf-radiogroup-no`}>
                        <Field
                          orientation="horizontal"
                          data-invalid={fieldState.invalid}
                        >
                          <FieldContent>
                            <FieldTitle>Tidak</FieldTitle>
                            <FieldDescription>
                              Perusahaan tidak memiliki fasilitas kesehatan
                              sendiri.
                            </FieldDescription>
                          </FieldContent>
                          <RadioGroupItem
                            value="false"
                            id={`form-rhf-radiogroup-no`}
                            aria-invalid={fieldState.invalid}
                          />
                        </Field>
                      </FieldLabel>
                      <FieldLabel htmlFor={`form-rhf-radiogroup-yes`}>
                        <Field
                          orientation="vertical"
                          data-invalid={fieldState.invalid}
                        >
                          <FieldContent>
                            <FieldTitle>Ya</FieldTitle>
                            <FieldDescription>
                              Perusahaan memiliki fasilitas kesehatan sendiri.
                            </FieldDescription>
                          </FieldContent>
                          <RadioGroupItem
                            value="true"
                            id={`form-rhf-radiogroup-yes`}
                            aria-invalid={fieldState.invalid}
                          />
                        </Field>
                      </FieldLabel>
                    </RadioGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldSet>
                )}
              />

              <Controller
                name="wlkpStatus"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FieldSet data-invalid={fieldState.invalid}>
                    <FieldLegend>Status WLKP di Perusahaan</FieldLegend>
                    <FieldDescription>
                      Apakah perusahaan Anda memiliki status WLKP?
                    </FieldDescription>
                    <RadioGroup
                      name={field.name}
                      value={String(field.value)}
                      onValueChange={(value) => {
                        field.onChange(value === "true");
                      }}
                      aria-invalid={fieldState.invalid}
                      className="flex flex-row"
                    >
                      <FieldLabel htmlFor={`form-wlkp-radiogroup-no`}>
                        <Field
                          orientation="horizontal"
                          data-invalid={fieldState.invalid}
                        >
                          <FieldContent>
                            <FieldTitle>Tidak</FieldTitle>
                            <FieldDescription>
                              Perusahaan tidak memiliki status WLKP.
                            </FieldDescription>
                          </FieldContent>
                          <RadioGroupItem
                            value="false"
                            id={`form-wlkp-radiogroup-no`}
                            aria-invalid={fieldState.invalid}
                          />
                        </Field>
                      </FieldLabel>
                      <FieldLabel htmlFor={`form-wlkp-radiogroup-yes`}>
                        <Field
                          orientation="vertical"
                          data-invalid={fieldState.invalid}
                        >
                          <FieldContent>
                            <FieldTitle>Ya</FieldTitle>
                            <FieldDescription>
                              Perusahaan memiliki status WLKP.
                            </FieldDescription>
                          </FieldContent>
                          <RadioGroupItem
                            value="true"
                            id={`form-wlkp-radiogroup-yes`}
                            aria-invalid={fieldState.invalid}
                          />
                        </Field>
                      </FieldLabel>
                    </RadioGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldSet>
                )}
              />

              <Controller
                control={form.control}
                name="wlkp"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Nomor WLKP Perusahaan
                    </FieldLabel>
                    <Input
                      type="number"
                      placeholder="Masukkan nomor WLKP perusahaan"
                      className="h-10 text-sm"
                      {...field}
                      aria-invalid={fieldState.invalid}
                      disabled={!wlkpStatus}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="responsibleTestingPerson"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Penanggung Jawab Pengujian
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan penanggung jawab pengujian"
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
                name="responsibleTestingPersonEmail"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Email Penanggung Jawab Pengujian
                    </FieldLabel>
                    <Input
                      type="email"
                      placeholder="Masukkan email penanggung jawab pengujian"
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
                name="responsibleTestingPersonPhone"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Telepon Penanggung Jawab Pengujian
                    </FieldLabel>
                    <Input
                      type="tel"
                      placeholder="Masukkan telepon penanggung jawab pengujian"
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
                disabled={createUserCompanyMutation.isPending}
              >
                {createUserCompanyMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Buat Perusahaan
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
