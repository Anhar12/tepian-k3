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
import { trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { RadioGroupItem } from "@radix-ui/react-radio-group";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import userCompanySchema from "@tepian-k3/schema/pengujian/user-company.schema";
import { CreditCard, LoaderCircle, MapPin, Users, Building, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
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
  const wlkp = form.watch("wlkp");

  // Mock WLKP integration pre-fill
  useEffect(() => {
    if (wlkpStatus && wlkp && wlkp.length >= 6) {
      form.setValue("name", "PT Waskita Karya (Mock WLKP)");
      form.setValue("email", "contact@waskita.mock");
      form.setValue("address", "Jl. MT Haryono Kav 10");
      form.setValue("maleWorkers", "150");
      form.setValue("femaleWorkers", "50");
      form.setValue("healthFacilityAvailable", true);
      form.setValue("responsibleTestingPerson", "Budi Santoso");
      form.setValue("responsibleTestingPersonEmail", "budi@waskita.mock");
      form.setValue("responsibleTestingPersonPhone", "08123456789");
      form.setValue("headOfCompany", "Agus Suharyanto");
      form.setValue("headOfCompanyPosition", "Direktur Utama");
    }
  }, [wlkpStatus, wlkp, form]);

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
      fieldsToValidate = ['wlkpStatus', 'wlkp', 'picture', 'name', 'email', 'kbliId', 'address', 'provinceId', 'regencyId', 'districtId', 'villageId'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['responsibleTestingPerson', 'responsibleTestingPersonEmail', 'responsibleTestingPersonPhone', 'headOfCompany', 'headOfCompanyPosition'];
    } else if (currentStep === 3) {
      fieldsToValidate = ['maleWorkers', 'femaleWorkers', 'healthFacilityAvailable'];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="flex flex-col gap-6 mx-auto max-w-4xl">
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        {/* Progress Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-6 md:p-8">
          <h1 className="text-2xl font-bold text-neutral-800 tracking-tight">Pendaftaran Perusahaan</h1>
          <p className="text-slate-500 mt-1">Lengkapi data perusahaan Anda dalam 4 langkah mudah.</p>
          
          <div className="mt-8 flex items-center justify-between relative">
            {/* Progress Bar Background */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 rounded-full z-0 hidden sm:block"></div>
            
            {/* Progress Bar Fill */}
            <div 
              className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full z-0 transition-all duration-500 hidden sm:block"
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            ></div>

            {STEPS.map((step) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                  <div 
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                      isActive ? "bg-primary border-primary text-white shadow-md shadow-primary/20 scale-110" : 
                      isCompleted ? "bg-primary border-primary text-white" : 
                      "bg-white border-slate-200 text-slate-400"
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                  </div>
                  <span className={cn(
                    "text-xs font-semibold hidden sm:block transition-colors",
                    isActive ? "text-primary" : 
                    isCompleted ? "text-neutral-700" : "text-slate-400"
                  )}>
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
            <div className={cn("space-y-6 animate-in fade-in slide-in-from-right-4 duration-500", currentStep !== 1 && "hidden")}>
              <div className="mb-4 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-semibold text-neutral-800">1. Informasi Dasar Perusahaan</h3>
                <p className="text-sm text-slate-500">Logo, nama, kontak utama, dan alamat lengkap perusahaan.</p>
              </div>

              <FieldGroup>
                <div className="space-y-6 mb-6">
                  <Controller
                    name="wlkpStatus"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <FieldSet data-invalid={fieldState.invalid} className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm">
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
                          className="flex flex-row gap-4 mt-3"
                        >
                          <FieldLabel htmlFor={`form-wlkp-radiogroup-yes`} className="cursor-pointer">
                            <div className={cn("px-4 py-3 border rounded-lg transition-all", field.value === true ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-200 hover:border-primary/50")}>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="true" id={`form-wlkp-radiogroup-yes`} />
                                <span className="font-semibold text-sm">Ya, Sudah Ada</span>
                              </div>
                            </div>
                          </FieldLabel>
                          <FieldLabel htmlFor={`form-wlkp-radiogroup-no`} className="cursor-pointer">
                            <div className={cn("px-4 py-3 border rounded-lg transition-all", field.value === false ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-200 hover:border-primary/50")}>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="false" id={`form-wlkp-radiogroup-no`} />
                                <span className="font-semibold text-sm">Belum Ada</span>
                              </div>
                            </div>
                          </FieldLabel>
                        </RadioGroup>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} className="mt-2" />
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
                          className="space-y-1 animate-in slide-in-from-top-2 fade-in"
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
                      <FieldLabel className="ml-1 text-sm font-bold flex items-center gap-1">
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

                <div className="flex flex-col sm:flex-row gap-4">
                  <Controller
                    control={form.control}
                    name="name"
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        className="space-y-1 flex-1"
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
                        className="space-y-1 flex-1"
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
                      <FieldLabel className="ml-1 text-sm font-bold flex items-center gap-1">
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
                        className="h-24 text-sm resize-none"
                        {...field}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className={cn("space-y-6 animate-in fade-in slide-in-from-right-4 duration-500", currentStep !== 2 && "hidden")}>
              <div className="mb-4 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-semibold text-neutral-800">2. Kontak & Pimpinan</h3>
                <p className="text-sm text-slate-500">Informasi penanggung jawab pengujian (PIC) dan pimpinan perusahaan.</p>
              </div>

              <FieldGroup>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-2 text-primary font-semibold">
                    <Users className="w-5 h-5" />
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
                          className="h-11 text-sm bg-white"
                          {...field}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            className="h-11 text-sm bg-white"
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
                          <FieldLabel className="ml-1 text-sm font-bold flex items-center gap-1">
                            No WhatsApp PIC *
                            <HelpTooltip content="Nomor WhatsApp aktif untuk menerima notifikasi otomatis terkait pengujian." />
                          </FieldLabel>
                          <Input
                            type="tel"
                            placeholder="08xxxxxxxxxx"
                            className="h-11 text-sm bg-white"
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

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-2 text-primary font-semibold">
                    <Building className="w-5 h-5" />
                    Pimpinan Perusahaan
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            className="h-11 text-sm bg-white"
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
                            className="h-11 text-sm bg-white"
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
              </FieldGroup>
            </div>

            {/* STEP 3: WLKP & Tenaga Kerja */}
            <div className={cn("space-y-6 animate-in fade-in slide-in-from-right-4 duration-500", currentStep !== 3 && "hidden")}>
              <div className="mb-4 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-semibold text-neutral-800">3. Data Ketenagakerjaan</h3>
                <p className="text-sm text-slate-500">Informasi kepatuhan WLKP dan rincian tenaga kerja perusahaan.</p>
              </div>

              <FieldGroup>
                <div className="space-y-6">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <FieldSet data-invalid={fieldState.invalid} className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm">
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
                          className="flex flex-row gap-4 mt-3"
                        >
                          <FieldLabel htmlFor={`form-rhf-radiogroup-yes`} className="cursor-pointer">
                            <div className={cn("px-4 py-3 border rounded-lg transition-all", field.value === true ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-200 hover:border-primary/50")}>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="true" id={`form-rhf-radiogroup-yes`} />
                                <span className="font-semibold text-sm">Ya, Tersedia</span>
                              </div>
                            </div>
                          </FieldLabel>
                          <FieldLabel htmlFor={`form-rhf-radiogroup-no`} className="cursor-pointer">
                            <div className={cn("px-4 py-3 border rounded-lg transition-all", field.value === false ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-200 hover:border-primary/50")}>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="false" id={`form-rhf-radiogroup-no`} />
                                <span className="font-semibold text-sm">Tidak Tersedia</span>
                              </div>
                            </div>
                          </FieldLabel>
                        </RadioGroup>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} className="mt-2" />
                        )}
                      </FieldSet>
                    )}
                  />
                </div>
              </FieldGroup>
            </div>

            {/* STEP 4: Bank */}
            <div className={cn("space-y-6 animate-in fade-in slide-in-from-right-4 duration-500", currentStep !== 4 && "hidden")}>
              <div className="mb-4 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-semibold text-neutral-800">4. Informasi Bank</h3>
                <p className="text-sm text-slate-500">Data rekening bank untuk keperluan pengembalian dana (refund) operasional jika ada.</p>
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
                      <FieldLabel className="ml-1 text-sm font-bold flex items-center gap-1">
                        Nama Bank
                        <span className="font-normal text-slate-400 ml-2">(Opsional)</span>
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
                        <span className="font-normal text-slate-400 ml-2">(Opsional)</span>
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
                        <span className="font-normal text-slate-400 ml-2">(Opsional)</span>
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
            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className={cn("h-11 px-6 font-medium gap-2", currentStep === 1 && "invisible")}
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </Button>

              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="h-11 px-8 font-medium gap-2 ml-auto shadow-sm"
                >
                  Selanjutnya
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="h-11 px-8 font-medium gap-2 shadow-sm bg-green-600 hover:bg-green-700 ml-auto"
                  disabled={createUserCompanyMutation.isPending}
                >
                  {createUserCompanyMutation.isPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
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
