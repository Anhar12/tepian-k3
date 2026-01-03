import ComboBox from "@/components/ui/combobox";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Info, Users, UserCheck, LoaderCircle } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import userCompanySchema from "@tepian-k3/schema/user-company.schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { toFormData } from "@/utils/form-data-mapper";
import SingleImageUpload from "@/components/ui/single-image-upload";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const Route = createFileRoute("/transaksi/1")({
  component: RouteComponent,
});

function RouteComponent() {
  const [kbliOpen, setKbliOpen] = useState(false);
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [regencyOpen, setRegencyOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [villageOpen, setVillageOpen] = useState(false);

  const form = useForm<
    z.infer<typeof userCompanySchema.createUserCompanySchema>
  >({
    resolver: zodResolver(userCompanySchema.createUserCompanySchema),
    defaultValues: {},
  });

  const provinceId = form.watch("provinceId");
  const regencyId = form.watch("regencyId");
  const districtId = form.watch("districtId");
  const wlkpStatus = form.watch("wlkpStatus");

  const createUserCompanyMutation = useMutation(
    trpc.userCompany.userCreateUserCompany.mutationOptions({
      onSuccess: async () => {
        globalSuccessToast("Berhasil membuat data perusahaan.");
      },
      onError: (error) => {
        globalErrorToast(`Gagal membuat data perusahaan: ${error.message}`);
      },
    }),
  );

  const handleSubmit = (
    data: z.infer<typeof userCompanySchema.createUserCompanySchema>,
  ) => {
    const formData = toFormData(data);
    createUserCompanyMutation.mutate(formData);
  };

  const { data: kbli } = useQuery(trpc.kbli.getAllKblis.queryOptions());
  const { data: province } = useQuery(
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
    <Card>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4">
          <FieldGroup>
            <div className="flex w-full flex-row gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/30">
                <Building2 className="text-primary" />
              </div>
              <div className="flex flex-col items-start justify-start">
                <p className="text- text-xl font-medium">Data Perusahaan</p>
                <p className="text-xs text-muted-foreground">
                  Lengkapi data perusahaan
                </p>
              </div>
            </div>

            <Controller
              control={form.control}
              name="picture"
              render={({ field, fieldState }) => (
                <SingleImageUpload
                  {...field}
                  error={fieldState.error?.message}
                  className="w-full"
                />
              )}
            />

            <div className="flex flex-row gap-2">
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Nama Perusahaan *
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
                      Email Perusahaan *
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
            </div>

            <Controller
              control={form.control}
              name="address"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-1">
                  <FieldLabel className="ml-1 text-sm font-bold">
                    Alamat Perusahaan *
                  </FieldLabel>
                  <Textarea
                    placeholder="Masukkan alamat perusahaan"
                    className="h-30 text-sm"
                    {...field}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="flex flex-row flex-wrap justify-between gap-2">
              <Controller
                control={form.control}
                name="provinceId"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="w-[49%] space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Provinsi *
                    </FieldLabel>
                    <ComboBox
                      options={province ?? []}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Pilih provinsi..."
                      searchPlaceholder="Cari provinsi..."
                      emptyMessage="Tidak ada provinsi yang ditemukan."
                      open={provinceOpen}
                      onOpenChange={setProvinceOpen}
                      invalid={fieldState.invalid}
                      className="w-12"
                      disabled={false}
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
                    className="w-[49%] space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Kabupaten/Kota *
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
                    className="w-[49%] space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Kecamatan *
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
                    className="w-[49%] space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Desa/Kelurahan *
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
            </div>

            <Controller
              control={form.control}
              name="kbliId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-1">
                  <FieldLabel className="ml-1 text-sm font-bold">
                    Kategori KBLI *
                  </FieldLabel>
                  <ComboBox
                    options={kbli ?? []}
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

            <div className="flex w-full flex-row gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/30">
                <Info className="text-primary" />
              </div>
              <div className="flex flex-col items-start justify-start">
                <p className="text- text-xl font-medium">
                  Informasi WLKP Online
                </p>
                <p className="text-xs text-muted-foreground">
                  Lengkapi data WLKP
                </p>
              </div>
            </div>

            <Controller
              name="wlkpStatus"
              control={form.control}
              render={({ field, fieldState }) => (
                <FieldSet data-invalid={fieldState.invalid}>
                  <FieldLegend>Status WLKP Online *</FieldLegend>
                  <FieldDescription>
                    Apakah perusahaan Anda memiliki status WLKP online?
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
                        orientation="horizontal"
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
                <Field data-invalid={fieldState.invalid} className="space-y-1">
                  <FieldLabel className="ml-1 text-sm font-bold">
                    Nomor WLKP Online *
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

            <div className="flex w-full flex-row gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/30">
                <Users className="text-primary" />
              </div>
              <div className="flex flex-col items-start justify-start">
                <p className="text- text-xl font-medium">Data Tenaga Kerja</p>
                <p className="text-xs text-muted-foreground">
                  Lengkapi data tenaga kerja
                </p>
              </div>
            </div>

            <div className="flex flex-row gap-2">
              <Controller
                control={form.control}
                name="maleWorkers"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Jumlah Pekerja Laki-laki *
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
                name="femaleWorkers"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Jumlah Pekerja Perempuan *
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
            </div>

            <Controller
              name="healthFacilityAvailable"
              control={form.control}
              render={({ field, fieldState }) => (
                <FieldSet data-invalid={fieldState.invalid}>
                  <FieldLegend>
                    Fasilitas Kesehatan Tersedia di Perusahaan *
                  </FieldLegend>
                  <FieldDescription>
                    Apakah perusahaan Anda memiliki fasilitas kesehatan sendiri?
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
                        orientation="horizontal"
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

            <div className="flex w-full flex-row gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/30">
                <UserCheck className="text-primary" />
              </div>
              <div className="flex flex-col items-start justify-start">
                <p className="text- text-xl font-medium">
                  Data Penanggung Jawab Pengujian
                </p>
                <p className="text-xs text-muted-foreground">
                  Lengkapi data penanggung jawab pengujian
                </p>
              </div>
            </div>

            <div className="flex flex-row flex-wrap gap-2">
              <Controller
                control={form.control}
                name="responsibleTestingPerson"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="w-[49%] space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Penanggung Jawab Pengujian *
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
                    className="w-[49%] space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Email Penanggung Jawab Pengujian *
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
                    className="w-[49%] space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Telepon Penanggung Jawab Pengujian *
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
            </div>

            <Button
              type="submit"
              className="mt-2 h-10 w-full text-sm"
              disabled={createUserCompanyMutation.isPending}
            >
              {createUserCompanyMutation.isPending ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Simpan dan Lanjutkan
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
