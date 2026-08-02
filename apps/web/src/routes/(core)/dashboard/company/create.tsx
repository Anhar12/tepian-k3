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
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
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
import { trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { RadioGroupItem } from "@radix-ui/react-radio-group";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import userCompanySchema from "@tepian-k3/schema/pengujian/user-company.schema";
import {
  CreditCard,
  LoaderCircle,
  MapPin,
  Users,
  Building,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { cn } from "@/lib/utils";
import { HelpTooltip } from "@/components/help-tooltip";

export const Route = createFileRoute("/(core)/dashboard/company/create")({
  loader: async ({ context }) => {
    context.queryClient.ensureQueryData(
      context.trpc.pengujian.kbli.getAllKblis.queryOptions(),
    );
    context.queryClient.ensureQueryData(
      context.trpc.platform.province.getAllProvinces.queryOptions(),
    );
  },
  component: RouteComponent,
  pendingComponent: LoaderComponent,
  head: () => pageHead("Tambah Perusahaan"),
});

function LoaderComponent() {
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
          <SkeletonGenerator variant="companyForm" />
        </CardContent>
      </Card>
    </div>
  );
}

const STEPS = [
  { id: 1, title: "Informasi Dasar", icon: Building },
  { id: 2, title: "Kontak & Pimpinan", icon: Users },
  { id: 3, title: "Data Ketenagakerjaan", icon: MapPin }, // Using MapPin to match original icon layout
  { id: 4, title: "Informasi Bank", icon: CreditCard },
];

function RouteComponent() {
  const redirectBack = useRedirectBackWithTimeout();

  const [currentStep, setCurrentStep] = useState(1);
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
      wlkpStatus: false,
      healthFacilityAvailable: false,
    },
    mode: "onTouched",
  });

  const provinceId = form.watch("provinceId");
  const regencyId = form.watch("regencyId");
  const districtId = form.watch("districtId");
  const wlkpStatus = form.watch("wlkpStatus");

  const createUserCompanyMutation = useMutation(
    trpc.pengujian.userCompany.userCreateUserCompany.mutationOptions({
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
    const formData = toFormData(data);
    createUserCompanyMutation.mutate(formData);
  };

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];

    if (currentStep === 1) {
      fieldsToValidate = [
        "wlkpStatus",
        "wlkp",
        "picture",
        "name",
        "email",
        "kbliId",
        "address",
        "provinceId",
        "regencyId",
        "districtId",
        "villageId",
      ];
    } else if (currentStep === 2) {
      fieldsToValidate = [
        "responsibleTestingPerson",
        "responsibleTestingPersonEmail",
        "responsibleTestingPersonPhone",
        "headOfCompany",
        "headOfCompanyPosition",
        "headOfCompanyEmail",
      ];
    } else if (currentStep === 3) {
      fieldsToValidate = [
        "maleWorkers",
        "femaleWorkers",
        "healthFacilityAvailable",
      ];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        {/* Progress Header */}
        <div className="border-b border-slate-100 bg-slate-50 p-6 md:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-800">
            Pendaftaran Perusahaan
          </h1>
          <p className="mt-1 text-slate-500">
            Lengkapi data perusahaan Anda dalam 4 langkah mudah.
          </p>

          <div className="relative mt-8 flex items-center justify-between">
            {/* Progress Bar Background */}
            <div className="absolute top-1/2 right-0 left-0 z-0 hidden h-1 -translate-y-1/2 rounded-full bg-slate-200 sm:block"></div>

            {/* Progress Bar Fill */}
            <div
              className="absolute top-1/2 left-0 z-0 hidden h-1 -translate-y-1/2 rounded-full bg-primary transition-all duration-500 sm:block"
              style={{
                width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
              }}
            ></div>

            {STEPS.map((step) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div
                  key={step.id}
                  className="relative z-10 flex flex-col items-center gap-2"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                      isActive
                        ? "scale-110 border-primary bg-primary text-white shadow-md shadow-primary/20"
                        : isCompleted
                          ? "border-primary bg-primary text-white"
                          : "border-slate-200 bg-white text-slate-400",
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "hidden text-xs font-semibold transition-colors sm:block",
                      isActive
                        ? "text-primary"
                        : isCompleted
                          ? "text-neutral-700"
                          : "text-slate-400",
                    )}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <CardContent className="p-6 md:p-8">
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid gap-6"
          >
            {/* STEP 1: Informasi Dasar */}
            <div
              className={cn(
                "animate-in space-y-6 duration-500 fade-in slide-in-from-right-4",
                currentStep !== 1 && "hidden",
              )}
            >
              <div className="mb-4 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-semibold text-neutral-800">
                  1. Informasi Dasar Perusahaan
                </h3>
                <p className="text-sm text-slate-500">
                  Logo, nama, kontak utama, dan alamat lengkap perusahaan.
                </p>
              </div>

              <FieldGroup>
                <div className="mb-6 space-y-6">
                  <Controller
                    name="wlkpStatus"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <FieldSet
                        data-invalid={fieldState.invalid}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <FieldLegend className="flex items-center gap-1 text-base">
                          Status WLKP Online *
                          <HelpTooltip content="Wajib Lapor Ketenagakerjaan di Perusahaan sesuai dengan UU No. 7 Tahun 1981." />
                        </FieldLegend>
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
                          className="mt-3 flex flex-row gap-4"
                        >
                          <FieldLabel
                            htmlFor={`form-wlkp-radiogroup-yes`}
                            className="cursor-pointer"
                          >
                            <div
                              className={cn(
                                "rounded-lg border px-4 py-3 transition-all",
                                field.value === true
                                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                                  : "border-slate-200 hover:border-primary/50",
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <RadioGroupItem
                                  value="true"
                                  id={`form-wlkp-radiogroup-yes`}
                                />
                                <span className="text-sm font-semibold">
                                  Ya, Sudah Ada
                                </span>
                              </div>
                            </div>
                          </FieldLabel>
                          <FieldLabel
                            htmlFor={`form-wlkp-radiogroup-no`}
                            className="cursor-pointer"
                          >
                            <div
                              className={cn(
                                "rounded-lg border px-4 py-3 transition-all",
                                field.value === false
                                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                                  : "border-slate-200 hover:border-primary/50",
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <RadioGroupItem
                                  value="false"
                                  id={`form-wlkp-radiogroup-no`}
                                />
                                <span className="text-sm font-semibold">
                                  Belum Ada
                                </span>
                              </div>
                            </div>
                          </FieldLabel>
                        </RadioGroup>
                        {fieldState.invalid && (
                          <FieldError
                            errors={[fieldState.error]}
                            className="mt-2"
                          />
                        )}
                      </FieldSet>
                    )}
                  />

                  {wlkpStatus && (
                    <Controller
                      control={form.control}
                      name="wlkp"
                      render={({ field, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          className="animate-in space-y-1 fade-in slide-in-from-top-2"
                        >
                          <FieldLabel className="ml-1 text-sm font-bold">
                            Nomor Registrasi WLKP *
                          </FieldLabel>
                          <Input
                            placeholder="Masukkan nomor seri WLKP"
                            className="h-11 text-sm"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value)}
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
                  )}
                </div>

                <hr className="my-2 border-t border-slate-200" />

                <Controller
                  control={form.control}
                  name="picture"
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="space-y-1"
                    >
                      <FieldLabel className="ml-1 flex items-center gap-1 text-sm font-bold">
                        Logo Perusahaan *
                        <HelpTooltip content="Unggah logo resmi perusahaan berformat JPG/PNG maksimal 2MB." />
                      </FieldLabel>
                      <SingleImageUpload
                        {...field}
                        error={fieldState.error?.message}
                      />
                    </Field>
                  )}
                />

                <div className="flex flex-col gap-4 sm:flex-row">
                  <Controller
                    control={form.control}
                    name="name"
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        className="flex-1 space-y-1"
                      >
                        <FieldLabel className="ml-1 text-sm font-bold">
                          Nama Perusahaan *
                        </FieldLabel>
                        <Input
                          type="text"
                          placeholder="PT Contoh Sejahtera"
                          className="h-11 text-sm"
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
                        className="flex-1 space-y-1"
                      >
                        <FieldLabel className="ml-1 text-sm font-bold">
                          Email Perusahaan *
                        </FieldLabel>
                        <Input
                          type="email"
                          placeholder="info@perusahaan.com"
                          className="h-11 text-sm"
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
                  name="kbliId"
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="space-y-1"
                    >
                      <FieldLabel className="ml-1 flex items-center gap-1 text-sm font-bold">
                        Kategori KBLI *
                        <HelpTooltip content="Klasifikasi Baku Lapangan Usaha Indonesia sesuai NIB." />
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
                  name="address"
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="space-y-1"
                    >
                      <FieldLabel className="ml-1 text-sm font-bold">
                        Alamat Lengkap *
                      </FieldLabel>
                      <Textarea
                        placeholder="Jalan, RT/RW, Patokan..."
                        className="h-24 resize-none text-sm"
                        {...field}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    control={form.control}
                    name="provinceId"
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        className="space-y-1"
                      >
                        <FieldLabel className="ml-1 text-sm font-bold">
                          Provinsi *
                        </FieldLabel>
                        <ComboBox
                          options={province}
                          value={field.value}
                          onChange={(val) => {
                            field.onChange(val);
                            form.setValue("regencyId", "");
                            form.setValue("districtId", "");
                            form.setValue("villageId", "");
                          }}
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
                          Kabupaten/Kota *
                        </FieldLabel>
                        <ComboBox
                          options={regency || []}
                          value={field.value}
                          onChange={(val) => {
                            field.onChange(val);
                            form.setValue("districtId", "");
                            form.setValue("villageId", "");
                          }}
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
                          Kecamatan *
                        </FieldLabel>
                        <ComboBox
                          options={district || []}
                          value={field.value}
                          onChange={(val) => {
                            field.onChange(val);
                            form.setValue("villageId", "");
                          }}
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
              </FieldGroup>
            </div>

            {/* STEP 2: Kontak & Pimpinan */}
            <div
              className={cn(
                "animate-in space-y-6 duration-500 fade-in slide-in-from-right-4",
                currentStep !== 2 && "hidden",
              )}
            >
              <div className="mb-4 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-semibold text-neutral-800">
                  2. Kontak & Pimpinan
                </h3>
                <p className="text-sm text-slate-500">
                  Informasi penanggung jawab pengujian (PIC) dan pimpinan
                  perusahaan.
                </p>
              </div>

              <FieldGroup>
                <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-2 flex items-center gap-2 font-semibold text-primary">
                    <Users className="h-5 w-5" />
                    Penanggung Jawab / PIC
                  </div>
                  <Controller
                    control={form.control}
                    name="responsibleTestingPerson"
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        className="space-y-1"
                      >
                        <FieldLabel className="ml-1 text-sm font-bold">
                          Nama PIC *
                        </FieldLabel>
                        <Input
                          type="text"
                          placeholder="Nama lengkap PIC"
                          className="h-11 bg-white text-sm"
                          {...field}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Controller
                      control={form.control}
                      name="responsibleTestingPersonEmail"
                      render={({ field, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          className="space-y-1"
                        >
                          <FieldLabel className="ml-1 text-sm font-bold">
                            Email PIC *
                          </FieldLabel>
                          <Input
                            type="email"
                            placeholder="email.pic@contoh.com"
                            className="h-11 bg-white text-sm"
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
                          <FieldLabel className="ml-1 flex items-center gap-1 text-sm font-bold">
                            No WhatsApp PIC *
                            <HelpTooltip content="Nomor WhatsApp aktif untuk menerima notifikasi otomatis terkait pengujian." />
                          </FieldLabel>
                          <Input
                            type="tel"
                            placeholder="08xxxxxxxxxx"
                            className="h-11 bg-white text-sm"
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
                </div>

                <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-2 flex items-center gap-2 font-semibold text-primary">
                    <Building className="h-5 w-5" />
                    Pimpinan Perusahaan
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Controller
                      control={form.control}
                      name="headOfCompany"
                      render={({ field, fieldState }) => (
                        <Field
                          data-invalid={fieldState.invalid}
                          className="space-y-1"
                        >
                          <FieldLabel className="ml-1 text-sm font-bold">
                            Nama Pimpinan *
                          </FieldLabel>
                          <Input
                            type="text"
                            placeholder="Nama Pimpinan Perusahaan"
                            className="h-11 bg-white text-sm"
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
                          className="space-y-1"
                        >
                          <FieldLabel className="ml-1 text-sm font-bold">
                            Jabatan *
                          </FieldLabel>
                          <Input
                            type="text"
                            placeholder="Direktur Utama / Manajer"
                            className="h-11 bg-white text-sm"
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
                    name="headOfCompanyEmail"
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        className="space-y-1"
                      >
                        <FieldLabel className="ml-1 text-sm font-bold">
                          Email Pimpinan *
                        </FieldLabel>
                        <Input
                          type="email"
                          placeholder="email@perusahaan.com"
                          className="h-11 bg-white text-sm"
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
              </FieldGroup>
            </div>

            {/* STEP 3: WLKP & Tenaga Kerja */}
            <div
              className={cn(
                "animate-in space-y-6 duration-500 fade-in slide-in-from-right-4",
                currentStep !== 3 && "hidden",
              )}
            >
              <div className="mb-4 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-semibold text-neutral-800">
                  3. Data Ketenagakerjaan
                </h3>
                <p className="text-sm text-slate-500">
                  Informasi kepatuhan WLKP dan rincian tenaga kerja perusahaan.
                </p>
              </div>

              <FieldGroup>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                            placeholder="Contoh: 50"
                            className="h-11 text-sm"
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
                            placeholder="Contoh: 25"
                            className="h-11 text-sm"
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
                      <FieldSet
                        data-invalid={fieldState.invalid}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <FieldLegend className="flex items-center gap-1 text-base">
                          Fasilitas Kesehatan di Perusahaan *
                          <HelpTooltip content="Apakah terdapat klinik, ruang P3K, atau layanan medis internal di area perusahaan?" />
                        </FieldLegend>
                        <RadioGroup
                          name={field.name}
                          value={String(field.value)}
                          onValueChange={(value) => {
                            field.onChange(value === "true");
                          }}
                          aria-invalid={fieldState.invalid}
                          className="mt-3 flex flex-row gap-4"
                        >
                          <FieldLabel
                            htmlFor={`form-rhf-radiogroup-yes`}
                            className="cursor-pointer"
                          >
                            <div
                              className={cn(
                                "rounded-lg border px-4 py-3 transition-all",
                                field.value === true
                                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                                  : "border-slate-200 hover:border-primary/50",
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <RadioGroupItem
                                  value="true"
                                  id={`form-rhf-radiogroup-yes`}
                                />
                                <span className="text-sm font-semibold">
                                  Ya, Tersedia
                                </span>
                              </div>
                            </div>
                          </FieldLabel>
                          <FieldLabel
                            htmlFor={`form-rhf-radiogroup-no`}
                            className="cursor-pointer"
                          >
                            <div
                              className={cn(
                                "rounded-lg border px-4 py-3 transition-all",
                                field.value === false
                                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                                  : "border-slate-200 hover:border-primary/50",
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <RadioGroupItem
                                  value="false"
                                  id={`form-rhf-radiogroup-no`}
                                />
                                <span className="text-sm font-semibold">
                                  Tidak Tersedia
                                </span>
                              </div>
                            </div>
                          </FieldLabel>
                        </RadioGroup>
                        {fieldState.invalid && (
                          <FieldError
                            errors={[fieldState.error]}
                            className="mt-2"
                          />
                        )}
                      </FieldSet>
                    )}
                  />
                </div>
              </FieldGroup>
            </div>

            {/* STEP 4: Bank */}
            <div
              className={cn(
                "animate-in space-y-6 duration-500 fade-in slide-in-from-right-4",
                currentStep !== 4 && "hidden",
              )}
            >
              <div className="mb-4 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-semibold text-neutral-800">
                  4. Informasi Bank
                </h3>
                <p className="text-sm text-slate-500">
                  Data rekening bank untuk keperluan pengembalian dana (refund)
                  operasional jika ada.
                </p>
              </div>

              <FieldGroup>
                <Controller
                  control={form.control}
                  name="companyBankName"
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="space-y-1"
                    >
                      <FieldLabel className="ml-1 flex items-center gap-1 text-sm font-bold">
                        Nama Bank
                        <span className="ml-2 font-normal text-slate-400">
                          (Opsional)
                        </span>
                      </FieldLabel>
                      <Input
                        type="text"
                        placeholder="Contoh: Bank Mandiri"
                        className="h-11 text-sm"
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
                        Nomor Rekening
                        <span className="ml-2 font-normal text-slate-400">
                          (Opsional)
                        </span>
                      </FieldLabel>
                      <Input
                        type="text"
                        placeholder="Contoh: 14200xxxxxxxx"
                        className="h-11 text-sm"
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
                  name="companyBankAccountName"
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="space-y-1"
                    >
                      <FieldLabel className="ml-1 text-sm font-bold">
                        Nama Pemilik Rekening
                        <span className="ml-2 font-normal text-slate-400">
                          (Opsional)
                        </span>
                      </FieldLabel>
                      <Input
                        type="text"
                        placeholder="Atas nama sesuai buku tabungan"
                        className="h-11 text-sm"
                        {...field}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            </div>

            {/* Navigation Buttons */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className={cn(
                  "h-11 gap-2 px-6 font-medium",
                  currentStep === 1 && "invisible",
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>

              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="ml-auto h-11 gap-2 px-8 font-medium shadow-sm"
                >
                  Selanjutnya
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="ml-auto h-11 gap-2 bg-green-600 px-8 font-medium shadow-sm hover:bg-green-700"
                  disabled={createUserCompanyMutation.isPending}
                >
                  {createUserCompanyMutation.isPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Simpan Perusahaan
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
