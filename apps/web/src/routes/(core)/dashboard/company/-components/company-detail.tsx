import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SkeletonGenerator } from "@/components/ui/skeleton-generator";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import ImageWithFallback from "@/components/image-with-fallback";

interface CompanyDetailProps {
  companyId: string;
}

export default function CompanyDetail({ companyId }: CompanyDetailProps) {
  const { data: company, isLoading } = useQuery(
    trpc.pengujian.userCompany.getUserCompanyByIdAndUserId.queryOptions({
      id: companyId,
    }),
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Detail Perusahaan</CardTitle>
            <CardDescription>
              Lihat detail informasi perusahaan Anda di sini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SkeletonGenerator variant="companyForm" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Detail Perusahaan</CardTitle>
            <CardDescription>
              Lihat detail informasi perusahaan Anda di sini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<Building2 />}
              title="Perusahaan Tidak Ditemukan"
              description="Perusahaan dengan ID yang diberikan tidak ditemukan. Silakan periksa kembali ID dan coba lagi."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Detail Perusahaan</CardTitle>
          <CardDescription>
            Lihat detail informasi perusahaan Anda di sini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex justify-start">
              {company.companyPictureUrl ? (
                // If company has a logo, display it
                <ImageWithFallback
                  src={company.companyPictureUrl}
                  alt="Logo Perusahaan"
                  className="h-32 w-32 rounded-lg object-cover"
                />
              ) : (
                // Placeholder for companies without a logo
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-200">
                  <span className="text-gray-500">No Logo</span>
                </div>
              )}
            </div>

            <FieldGroup>
              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Nama Perusahaan
                </FieldLabel>
                <Input
                  type="text"
                  placeholder="Masukkan nama perusahaan"
                  className="h-10 text-sm"
                  value={company.name}
                  disabled
                  readOnly
                />
              </Field>

              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Email Perusahaan
                </FieldLabel>
                <Input
                  type="text"
                  placeholder="Masukkan email perusahaan"
                  className="h-10 text-sm"
                  value={company.email}
                  disabled
                  readOnly
                />
              </Field>

              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Jumlah Pekerja Perempuan
                </FieldLabel>
                <Input
                  type="number"
                  placeholder="Masukkan jumlah pekerja perempuan"
                  className="h-10 text-sm"
                  value={company.femaleWorkers}
                  disabled
                  readOnly
                />
              </Field>

              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Jumlah Pekerja Laki-laki
                </FieldLabel>
                <Input
                  type="number"
                  placeholder="Masukkan jumlah pekerja laki-laki"
                  className="h-10 text-sm"
                  value={company.maleWorkers}
                  disabled
                  readOnly
                />
              </Field>

              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Jenis KBLI Perusahaan
                </FieldLabel>
                <Input
                  type="number"
                  placeholder="Masukkan jenis KBLI perusahaan"
                  className="h-10 text-sm"
                  value={company.kbli.name}
                  disabled
                  readOnly
                />
              </Field>

              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Provinsi Perusahaan
                </FieldLabel>
                <Input
                  type="text"
                  placeholder="Masukkan provinsi perusahaan"
                  className="h-10 text-sm"
                  value={company.province.name}
                  disabled
                  readOnly
                />
              </Field>

              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Kota/Kabupaten Perusahaan
                </FieldLabel>
                <Input
                  type="text"
                  placeholder="Masukkan kota/kabupaten perusahaan"
                  className="h-10 text-sm"
                  value={company.regency.name}
                  disabled
                  readOnly
                />
              </Field>

              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Kecamatan Perusahaan
                </FieldLabel>
                <Input
                  type="text"
                  placeholder="Masukkan kecamatan perusahaan"
                  className="h-10 text-sm"
                  value={company.district.name}
                  disabled
                  readOnly
                />
              </Field>

              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Desa/Kelurahan Perusahaan
                </FieldLabel>
                <Input
                  type="text"
                  placeholder="Masukkan desa/kelurahan perusahaan"
                  className="h-10 text-sm"
                  value={company.village.name}
                  disabled
                  readOnly
                />
              </Field>

              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Alamat Perusahaan
                </FieldLabel>
                <Textarea
                  placeholder="Masukkan alamat perusahaan"
                  className="h-10 text-sm"
                  value={company.address}
                  disabled
                  readOnly
                />
              </Field>

              <FieldSet>
                <FieldLegend>
                  Fasilitas Kesehatan Tersedia di Perusahaan
                </FieldLegend>
                <FieldDescription>
                  Apakah perusahaan Anda memiliki fasilitas kesehatan sendiri?
                </FieldDescription>
                <RadioGroup
                  name="healthFacilityAvailable"
                  value={String(company.healthFacilityAvailable)}
                  disabled
                  className="flex flex-row"
                >
                  <FieldLabel htmlFor={`form-rhf-radiogroup-no`}>
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Tidak</FieldTitle>
                        <FieldDescription>
                          Perusahaan tidak memiliki fasilitas kesehatan sendiri.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem
                        value="false"
                        id={`form-rhf-radiogroup-no`}
                      />
                    </Field>
                  </FieldLabel>
                  <FieldLabel htmlFor={`form-rhf-radiogroup-yes`}>
                    <Field orientation="vertical">
                      <FieldContent>
                        <FieldTitle>Ya</FieldTitle>
                        <FieldDescription>
                          Perusahaan memiliki fasilitas kesehatan sendiri.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem
                        value="true"
                        id={`form-rhf-radiogroup-yes`}
                      />
                    </Field>
                  </FieldLabel>
                </RadioGroup>
              </FieldSet>

              <FieldSet>
                <FieldLegend>Status WLKP di Perusahaan</FieldLegend>
                <FieldDescription>
                  Apakah perusahaan Anda memiliki status WLKP?
                </FieldDescription>
                <RadioGroup
                  name="wlkpStatus"
                  value={String(company.wlkpStatus)}
                  disabled
                  className="flex flex-row"
                >
                  <FieldLabel htmlFor={`form-wlkp-radiogroup-no`}>
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Tidak</FieldTitle>
                        <FieldDescription>
                          Perusahaan tidak memiliki status WLKP.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem
                        value="false"
                        id={`form-wlkp-radiogroup-no`}
                      />
                    </Field>
                  </FieldLabel>
                  <FieldLabel htmlFor={`form-wlkp-radiogroup-yes`}>
                    <Field orientation="vertical">
                      <FieldContent>
                        <FieldTitle>Ya</FieldTitle>
                        <FieldDescription>
                          Perusahaan memiliki status WLKP.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem
                        value="true"
                        id={`form-wlkp-radiogroup-yes`}
                      />
                    </Field>
                  </FieldLabel>
                </RadioGroup>
              </FieldSet>

              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Nomor WLKP Perusahaan
                </FieldLabel>
                <Input
                  type="number"
                  placeholder="Masukkan nomor WLKP perusahaan"
                  className="h-10 text-sm"
                  value={company.wlkp || "-"}
                  disabled
                  readOnly
                />
              </Field>

              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Penanggung Jawab Pengujian
                </FieldLabel>
                <Input
                  type="text"
                  placeholder="Masukkan penanggung jawab pengujian"
                  className="h-10 text-sm"
                  value={company.responsibleTestingPerson}
                  disabled
                  readOnly
                />
              </Field>

              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Email Penanggung Jawab Pengujian
                </FieldLabel>
                <Input
                  type="email"
                  placeholder="Masukkan email penanggung jawab pengujian"
                  className="h-10 text-sm"
                  value={company.responsibleTestingPersonEmail}
                  disabled
                  readOnly
                />
              </Field>

              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Telepon Penanggung Jawab Pengujian
                </FieldLabel>
                <Input
                  type="tel"
                  placeholder="Masukkan telepon penanggung jawab pengujian"
                  className="h-10 text-sm"
                  value={company.responsibleTestingPersonPhone}
                  disabled
                  readOnly
                />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Nama Bank Perusahaan
                </FieldLabel>
                <Input
                  type="text"
                  placeholder="Masukkan nama bank perusahaan"
                  className="h-10 text-sm"
                  value={company.companyBankName || "-"}
                  disabled
                  readOnly
                />
              </Field>
              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Nomor Rekening Perusahaan
                </FieldLabel>
                <Input
                  type="text"
                  placeholder="Masukkan nomor rekening perusahaan"
                  className="h-10 text-sm"
                  value={company.companyBankAccount || "-"}
                  disabled
                  readOnly
                />
              </Field>
              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Nama Pemilik Rekening Perusahaan
                </FieldLabel>
                <Input
                  type="text"
                  placeholder="Masukkan nama pemilik rekening perusahaan"
                  className="h-10 text-sm"
                  value={company.companyBankAccountName || "-"}
                  disabled
                  readOnly
                />
              </Field>
            </FieldGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
