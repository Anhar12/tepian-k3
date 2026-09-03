import ImageWithFallback from "@/components/image-with-fallback";
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
import { NumberInput } from "@/components/ui/number-input";
import { RadioGroup } from "@/components/ui/radio-group";
import SingleImageUpload from "@/components/ui/single-image-upload";
import { SkeletonGenerator } from "@/components/ui/skeleton-generator";
import { Textarea } from "@/components/ui/textarea";
import { useRedirectBackWithTimeout } from "@/lib/redirect-back-with-timeout";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { toFormData } from "@/utils/form-data-mapper";
import { pageHead } from "@/utils/page-head";
import { queryClient, trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { RadioGroupItem } from "@radix-ui/react-radio-group";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import userCompanySchema from "@tepian-k3/schema/pengujian/user-company.schema";
import {
  CreditCard,
  LoaderCircle,
  MapPin,
  Building,
  BriefcaseBusiness,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import {
  TestingLocationList,
  type TestingLocation,
} from "./-components/testing-location-list";

export const Route = createFileRoute(
  "/(core)/dashboard/company/$companyId/edit",
)({
  params: z.object({
    companyId: z.uuidv7(),
  }),
  loader: async ({ context, params }) => {
    context.queryClient.ensureQueryData(
      context.trpc.pengujian.userCompany.getUserCompanyByIdAndUserId.queryOptions(
        {
          id: params.companyId,
        },
      ),
    );
    context.queryClient.ensureQueryData(
      context.trpc.pengujian.kbli.getAllKblis.queryOptions(),
    );
    context.queryClient.ensureQueryData(
      context.trpc.platform.province.getAllProvinces.queryOptions(),
    );
  },
  component: RouteComponent,
  pendingComponent: LoaderComponent,
  head: () => pageHead("Edit Perusahaan"),
});

function LoaderComponent() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Perbarui Perusahaan</CardTitle>
          <CardDescription>
            Isi form di bawah untuk memperbarui perusahaan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SkeletonGenerator variant="companyForm" />
        </CardContent>
      </Card>
    </div>
  );
}

function RouteComponent() {
  const { companyId } = Route.useParams();
  const redirectBack = useRedirectBackWithTimeout();

  const [kbliOpen, setKbliOpen] = useState(false);
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [regencyOpen, setRegencyOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [villageOpen, setVillageOpen] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [picEmailFocused, setPicEmailFocused] = useState(false);
  const [bankAccountFocused, setBankAccountFocused] = useState(false);

  const [testingLocations, setTestingLocations] = useState<TestingLocation[]>(
    [],
  );

  const [deletedTestingLocationIds, setDeletedTestingLocationIds] = useState<
    string[]
  >([]);

  const removeTestingLocation = (index: number) => {
    const location = testingLocations[index];

    if (!location) {
      return;
    }

    if (location.id && !location.isNew) {
      setDeletedTestingLocationIds((prev) =>
        prev.includes(location.id!) ? prev : [...prev, location.id!],
      );
    }

    setTestingLocations((prev) => prev.filter((_, i) => i !== index));
  };

  const addTestingLocation = () => {
    setTestingLocations((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        regencyId: "",
        regencyName: "",
        districtId: "",
        districtName: "",
        isNew: true,
      },
    ]);
  };

  const updateTestingLocation = (index: number, location: TestingLocation) => {
    const current = testingLocations[index];
    if (current?.id && !current.isNew) {
      setDeletedTestingLocationIds((prev) =>
        prev.includes(current.id!) ? prev : [...prev, current.id!],
      );
    }
    setTestingLocations((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? { ...location, id: undefined, isNew: true }
          : item,
      ),
    );
  };

  const updateLocationRegency = (index: number, regencyId: string) => {
    const selected = (locationRegency ?? []).find(
      (item) => item.id === regencyId,
    );
    updateTestingLocation(index, {
      ...testingLocations[index]!,
      regencyId,
      regencyName: selected?.name ?? "",
      districtId: "",
      districtName: "",
    });
  };

  const maskEmail = (email: string) => {
    if (!email) {
      return "";
    }

    const [username, domain] = email.split("@");

    if (!username || !domain) {
      return email;
    }

    if (username.length <= 2) {
      return `${username[0] ?? ""}***@${domain}`;
    }

    return `${username.slice(0, 2)}${"*".repeat(
      Math.max(username.length - 2, 3),
    )}@${domain}`;
  };

  const maskBankAccount = (account: string) => {
    if (!account) {
      return "";
    }

    if (account.length <= 4) {
      return "*".repeat(account.length);
    }

    return `${"*".repeat(account.length - 4)}${account.slice(-4)}`;
  };

  const { data: company } = useSuspenseQuery(
    trpc.pengujian.userCompany.getUserCompanyByIdAndUserId.queryOptions({
      id: companyId,
    }),
  );

  const { data: existingTestingLocations } = useQuery(
    trpc.pengujian.userCompanyTestingLocation.getAllUserCompanyTestingLocationsByCompanyIdAndUserId.queryOptions(
      {
        companyId,
      },
    ),
  );

  type UpdateUserCompanyInput = z.input<
    typeof userCompanySchema.updateUserCompanySchema
  >;

  type UpdateUserCompanyOutput = z.output<
    typeof userCompanySchema.updateUserCompanySchema
  >;

  const form = useForm<UpdateUserCompanyInput, any, UpdateUserCompanyOutput>({
    resolver: zodResolver(userCompanySchema.updateUserCompanySchema),
    defaultValues: {
      id: company.id,
      name: company.name,
      address: company.address,
      provinceId: company.provinceId,
      regencyId: company.regencyId,
      districtId: company.districtId,
      villageId: company.villageId,
      kbliId: company.kbliId,
      wlkpStatus: company.wlkpStatus,
      wlkp: company.wlkp ?? "",
      email: company.email,
      femaleWorkers: String(company.femaleWorkers),
      healthFacilityAvailable: company.healthFacilityAvailable,
      maleWorkers: String(company.maleWorkers),
      responsibleTestingPerson: company.responsibleTestingPerson,
      responsibleTestingPersonEmail: company.responsibleTestingPersonEmail,
      responsibleTestingPersonPhone: company.responsibleTestingPersonPhone,
      headOfCompany: company.headOfCompany,
      headOfCompanyPosition: company.headOfCompanyPosition,
      headOfCompanyEmail: company.headOfCompanyEmail ?? "",
      companyBankName: company.companyBankName ?? "",
      companyBankAccount: company.companyBankAccount ?? "",
      companyBankAccountName: company.companyBankAccountName ?? "",
      testingLocations: [],
      deletedTestingLocationIds: [],
    },
  });

  const provinceId = form.watch("provinceId") || "";
  const regencyId = form.watch("regencyId") || "";
  const districtId = form.watch("districtId") || "";
  const wlkpStatus = form.watch("wlkpStatus") || false;

  const updateUserCompanyMutation = useMutation(
    trpc.pengujian.userCompany.userUpdateUserCompany.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.userCompany.getUserCompanyByIdAndUserId.queryOptions({
            id: companyId,
          }),
        );
        globalSuccessToast("Berhasil memperbarui data perusahaan");
        await redirectBack();
      },
      onError: (error) => {
        globalErrorToast("Gagal memperbarui data perusahaan: " + error.message);
      },
    }),
  );

  const handleSubmit = (
    data: z.infer<typeof userCompanySchema.updateUserCompanySchema>,
  ) => {
    const formData = toFormData({
      ...data,

      testingLocations: testingLocations
        .filter((location) => location.isNew)
        .map((location) => ({
          name: location.name,
          regencyId: location.regencyId,
          districtId: location.districtId,
        })),

      deletedTestingLocationIds,
    });

    updateUserCompanyMutation.mutate(formData);
  };

  const handleInvalid = (errors: typeof form.formState.errors) => {
    console.log("SUBMIT INVALID:", errors);
  };

  const { data: kbli } = useSuspenseQuery(
    trpc.pengujian.kbli.getAllKblis.queryOptions(),
  );

  const { data: province } = useSuspenseQuery(
    trpc.platform.province.getAllProvinces.queryOptions(),
  );

  const { data: regency } = useQuery({
    ...trpc.platform.regency.getAllRegenciesByProvinceId.queryOptions({
      provinceId,
    }),
    enabled: !!provinceId,
  });

  const { data: district } = useQuery({
    ...trpc.platform.district.getAllDistrictsByRegencyId.queryOptions({
      regencyId,
    }),
    enabled: !!regencyId,
  });

  const { data: village } = useQuery({
    ...trpc.platform.village.getAllVillagesByDistrictId.queryOptions({
      districtId,
    }),
    enabled: !!districtId,
  });

  const { data: locationRegency } = useQuery({
    ...trpc.platform.regency.getAllRegenciesByProvinceId.queryOptions({
      provinceId,
    }),
    enabled: !!provinceId,
  });

  useEffect(() => {
    if (!existingTestingLocations) {
      return;
    }

    setTestingLocations(
      existingTestingLocations.map((location) => ({
        id: location.id,
        name: location.name,
        regencyId: location.regencyId,
        regencyName: location.regency?.name ?? "-",
        districtId: location.districtId,
        districtName: location.district?.name ?? "-",
        isNew: false,
      })),
    );
  }, [existingTestingLocations]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Perbarui Perusahaan</CardTitle>
          <CardDescription>
            Isi form di bawah untuk memperbarui perusahaan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(handleSubmit, handleInvalid)}
            className="grid gap-4"
          >
            <FieldGroup>
              {/* 1. informasi dasar */}
              <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex w-full flex-row gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-100">
                    <Building className="text-primary" />
                  </div>
                  <div className="flex flex-col items-start justify-start">
                    <p className="text- text-xl font-medium">Informasi Dasar</p>
                    <p className="text-xs text-muted-foreground">
                      Lengkapi data informasi dasar perusahaan
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
                        WLKP (Wajib Lapor Ketenagakerjaan di Perusahaan) adalah
                        kewajiban perusahaan untuk melaporkan data
                        ketenagakerjaan kepada pemerintah sesuai UU No. 7 Tahun
                        1981. Apakah perusahaan Anda memiliki status WLKP
                        online?
                      </FieldDescription>
                      <RadioGroup
                        name={field.name}
                        value={String(field.value)}
                        onValueChange={(value) => {
                          field.onChange(value === "true");
                          if (value === "false") {
                            form.setValue("wlkp", "");
                          }
                        }}
                        aria-invalid={fieldState.invalid}
                        className="flex flex-row"
                      >
                        <FieldLabel
                          htmlFor={`form-wlkp-radiogroup-no`}
                          className="bg-white"
                        >
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
                        <FieldLabel
                          htmlFor={`form-wlkp-radiogroup-yes`}
                          className="bg-white"
                        >
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
                    <Field
                      data-invalid={fieldState.invalid}
                      className="space-y-1"
                    >
                      <FieldLabel className="ml-1 text-sm font-bold">
                        Nomor WLKP Online *
                      </FieldLabel>
                      <NumberInput
                        placeholder="Masukkan nomor WLKP perusahaan"
                        className="h-10 bg-white text-sm"
                        value={field.value ?? ""}
                        onChange={(value) => field.onChange(String(value))}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        aria-invalid={fieldState.invalid}
                        disabled={!wlkpStatus}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <hr className="my-6 border-t border-slate-200" />

                <div className="flex justify-start">
                  {company.companyPictureUrl ? (
                    <ImageWithFallback
                      src={company.companyPictureUrl}
                      alt="Logo Perusahaan"
                      className="h-32 w-32 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-200">
                      <span className="text-gray-500">No Logo</span>
                    </div>
                  )}
                </div>

                <Controller
                  control={form.control}
                  name="picture"
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="space-y-1"
                    >
                      <FieldLabel className="ml-1 text-sm font-bold">
                        Logo Perusahaan
                      </FieldLabel>
                      <SingleImageUpload
                        {...field}
                        error={fieldState.error?.message}
                      />
                    </Field>
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
                          className="h-10 bg-white text-sm"
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
                          type="email"
                          placeholder="Masukkan email perusahaan"
                          className="h-10 bg-white text-sm"
                          value={
                            emailFocused
                              ? (field.value ?? "")
                              : maskEmail(field.value ?? "")
                          }
                          onFocus={() => setEmailFocused(true)}
                          onBlur={() => {
                            setEmailFocused(false);
                            field.onBlur();
                          }}
                          onChange={field.onChange}
                          name={field.name}
                          ref={field.ref}
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
                    <Field
                      data-invalid={fieldState.invalid}
                      className="space-y-1"
                    >
                      <FieldLabel className="ml-1 text-sm font-bold">
                        Alamat Perusahaan *
                      </FieldLabel>
                      <Textarea
                        placeholder="Masukkan alamat perusahaan"
                        className="h-30 bg-white text-sm"
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
                          options={province}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="Pilih provinsi..."
                          searchPlaceholder="Cari provinsi..."
                          emptyMessage="Tidak ada provinsi yang ditemukan."
                          open={provinceOpen}
                          onOpenChange={setProvinceOpen}
                          invalid={fieldState.invalid}
                          className="w-12 bg-white"
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
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="Pilih kabupaten/kota..."
                          searchPlaceholder="Cari kabupaten/kota..."
                          emptyMessage="Tidak ada kabupaten/kota yang ditemukan."
                          open={regencyOpen}
                          onOpenChange={setRegencyOpen}
                          disabled={!provinceId}
                          invalid={fieldState.invalid}
                          className="bg-white"
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
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="Pilih kecamatan..."
                          searchPlaceholder="Cari kecamatan..."
                          emptyMessage="Tidak ada kecamatan yang ditemukan."
                          open={districtOpen}
                          onOpenChange={setDistrictOpen}
                          disabled={!regencyId}
                          invalid={fieldState.invalid}
                          className="bg-white"
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
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="Pilih desa/kelurahan..."
                          searchPlaceholder="Cari desa/kelurahan..."
                          emptyMessage="Tidak ada desa/kelurahan yang ditemukan."
                          open={villageOpen}
                          onOpenChange={setVillageOpen}
                          disabled={!districtId}
                          invalid={fieldState.invalid}
                          className="bg-white"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
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
                          PIC *
                        </FieldLabel>
                        <Input
                          type="text"
                          placeholder="Masukkan nama PIC"
                          className="h-10 bg-white text-sm"
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
                          Email PIC *
                        </FieldLabel>

                        <Input
                          type="email"
                          placeholder="Masukkan email PIC"
                          className="h-10 bg-white text-sm"
                          value={
                            picEmailFocused
                              ? (field.value ?? "")
                              : maskEmail(field.value ?? "")
                          }
                          onFocus={() => setPicEmailFocused(true)}
                          onBlur={() => {
                            setPicEmailFocused(false);
                            field.onBlur();
                          }}
                          onChange={field.onChange}
                          name={field.name}
                          ref={field.ref}
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
                          No WA PIC *
                        </FieldLabel>
                        <Input
                          type="tel"
                          placeholder="Masukkan nomor WhatsApp PIC"
                          className="h-10 bg-white text-sm"
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

                <div className="flex flex-row flex-wrap gap-2">
                  <Controller
                    control={form.control}
                    name="headOfCompany"
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        className="w-[49%] space-y-1"
                      >
                        <FieldLabel className="ml-1 text-sm font-bold">
                          Nama Pimpinan Perusahaan *
                        </FieldLabel>
                        <Input
                          type="text"
                          placeholder="Masukkan nama pimpinan perusahaan"
                          className="h-10 bg-white text-sm"
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
                    name="headOfCompanyPosition"
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        className="w-[49%] space-y-1"
                      >
                        <FieldLabel className="ml-1 text-sm font-bold">
                          Posisi Pimpinan Perusahaan *
                        </FieldLabel>
                        <Input
                          type="text"
                          placeholder="Masukkan posisi pimpinan perusahaan"
                          className="h-10 bg-white text-sm"
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
                    name="headOfCompanyEmail"
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        className="w-full space-y-1"
                      >
                        <FieldLabel className="ml-1 text-sm font-bold">
                          Email Pimpinan Perusahaan *
                        </FieldLabel>
                        <Input
                          type="email"
                          placeholder="email@perusahaan.com"
                          className="h-10 bg-white text-sm"
                          {...field}
                          aria-invalid={fieldState.invalid}
                        />
                        <p className="ml-1 text-xs text-slate-500">
                          Email aktif pimpinan perusahaan wajib diisi untuk
                          pengiriman tautan TTE persetujuan penawaran dan
                          Perjanjian Kerja Sama.
                        </p>
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
                    <Field
                      data-invalid={fieldState.invalid}
                      className="space-y-1"
                    >
                      <FieldLabel className="ml-1 text-sm font-bold">
                        Kategori KBLI *
                      </FieldLabel>
                      <ComboBox
                        options={kbli}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Pilih kategori KBLI..."
                        searchPlaceholder="Cari kategori KBLI..."
                        emptyMessage="Tidak ada kategori KBLI yang ditemukan."
                        open={kbliOpen}
                        onOpenChange={setKbliOpen}
                        invalid={fieldState.invalid}
                        className="bg-white"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              {/* 2. lokasi pengujian */}
              <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex w-full flex-row gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-100">
                    <MapPin className="text-primary" />
                  </div>

                  <div className="flex flex-col items-start justify-start">
                    <p className="text-xl font-medium">Lokasi Pengujian</p>

                    <p className="text-xs text-muted-foreground">
                      Lengkapi lokasi pengujian perusahaan
                    </p>
                  </div>
                </div>

                <FieldGroup>
                  <TestingLocationList
                    locations={testingLocations}
                    regency={locationRegency ?? []}
                    onAdd={addTestingLocation}
                    onChange={updateTestingLocation}
                    onRegencyChange={updateLocationRegency}
                    onRemove={removeTestingLocation}
                  />
                </FieldGroup>
              </div>

              {/* 3. data tenaga kerja */}
              <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex w-full flex-row gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-100">
                    <BriefcaseBusiness className="text-primary" />
                  </div>
                  <div className="flex flex-col items-start justify-start">
                    <p className="text- text-xl font-medium">
                      Data Tenaga Kerja
                    </p>
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
                        <NumberInput
                          placeholder="Masukkan jumlah pekerja laki-laki"
                          className="h-10 bg-white text-sm"
                          value={field.value ?? ""}
                          onChange={(value) => field.onChange(String(value))}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
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
                        <NumberInput
                          placeholder="Masukkan jumlah pekerja perempuan"
                          className="h-10 bg-white text-sm"
                          value={field.value ?? ""}
                          onChange={(value) => field.onChange(String(value))}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
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
                        <FieldLabel
                          htmlFor={`form-rhf-radiogroup-no`}
                          className="bg-white"
                        >
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
                        <FieldLabel
                          htmlFor={`form-rhf-radiogroup-yes`}
                          className="bg-white"
                        >
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
              </div>

              {/* 4. informasi bank */}
              <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex w-full flex-row gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-100">
                    <CreditCard className="text-primary" />
                  </div>
                  <div className="flex flex-col items-start justify-start">
                    <p className="text- text-xl font-medium">
                      Informasi Bank Perusahaan
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Lengkapi data Rekening Bank untuk pengembalian kelebihan
                      dana operasional apabila terdapat sisa dana dari
                      pelaksanaan kegiatan.
                    </p>
                  </div>
                </div>

                <Controller
                  control={form.control}
                  name="companyBankName"
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="space-y-1"
                    >
                      <FieldLabel className="ml-1 text-sm font-bold">
                        Nama Bank Perusahaan
                      </FieldLabel>
                      <Input
                        type="text"
                        placeholder="Masukkan nama bank perusahaan"
                        className="h-10 bg-white text-sm"
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
                  name="companyBankAccount"
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="space-y-1"
                    >
                      <FieldLabel className="ml-1 text-sm font-bold">
                        Nomor Rekening Bank Perusahaan
                      </FieldLabel>

                      <Input
                        type="text"
                        placeholder="Masukkan nomor rekening bank perusahaan"
                        className="h-10 bg-white text-sm"
                        value={
                          bankAccountFocused
                            ? (field.value ?? "")
                            : maskBankAccount(field.value ?? "")
                        }
                        onFocus={() => setBankAccountFocused(true)}
                        onBlur={() => {
                          setBankAccountFocused(false);
                          field.onBlur();
                        }}
                        onChange={field.onChange}
                        name={field.name}
                        ref={field.ref}
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
                  name="companyBankAccountName"
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="space-y-1"
                    >
                      <FieldLabel className="ml-1 text-sm font-bold">
                        Nama Pemilik Rekening Bank Perusahaan
                      </FieldLabel>
                      <Input
                        type="text"
                        placeholder="Masukkan nama pemilik rekening bank perusahaan"
                        className="h-10 bg-white text-sm"
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
                disabled={updateUserCompanyMutation.isPending}
              >
                {updateUserCompanyMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Perbarui Perusahaan
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
