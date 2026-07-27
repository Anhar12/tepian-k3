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
import { MaskableInput } from "@/components/ui/maskable-input";
import { NumberInput } from "@/components/ui/number-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SkeletonGenerator } from "@/components/ui/skeleton-generator";
import { Textarea } from "@/components/ui/textarea";

import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Building2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { toWaLink } from "@/utils/wa-link";
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

  const [unmaskedData, setUnmaskedData] = useState<any>(null);
  const { refetch: fetchUnmasked, isFetching: isUnmasking } = useQuery({
    ...trpc.pengujian.userCompany.getUnmaskedUserCompanyById.queryOptions({
      id: companyId,
    }),
    enabled: false,
  });

  const handleToggleMask = async () => {
    if (unmaskedData) {
      setUnmaskedData(null);
    } else {
      const { data } = await fetchUnmasked();
      if (data) setUnmaskedData(data);
    }
  };

  const displayCompany = unmaskedData || company;

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

  if (!company || !displayCompany) {
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
            <div className="flex justify-between items-start">
              {displayCompany.companyPictureUrl ? (
                // If company has a logo, display it
                <ImageWithFallback
                  src={displayCompany.companyPictureUrl}
                  alt="Logo Perusahaan"
                  className="h-32 w-32 rounded-lg object-cover"
                />
              ) : (
                // Placeholder for companies without a logo
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-200">
                  <span className="text-gray-500">No Logo</span>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleMask}
                disabled={isUnmasking}
                className="gap-2"
              >
                {unmaskedData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {unmaskedData ? "Sembunyikan Data" : "Lihat Data Lengkap"}
              </Button>
            </div>

            <FieldGroup>
              <FieldSet>
                <FieldLegend>Status WLKP di Perusahaan</FieldLegend>
                <FieldDescription>
                  WLKP (Wajib Lapor Ketenagakerjaan di Perusahaan) adalah
                  kewajiban perusahaan untuk melaporkan data ketenagakerjaan
                  kepada pemerintah sesuai UU No. 7 Tahun 1981. Apakah
                  perusahaan Anda memiliki status WLKP?
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
                <NumberInput
                  placeholder="Masukkan nomor WLKP perusahaan"
                  className="h-10 text-sm"
                  value={Number(company.wlkp) || 0}
                  disabled
                  readOnly
                />
              </Field>

              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Nama Perusahaan
                </FieldLabel>
                <Input
                  type="text"
                  placeholder="Masukkan nama perusahaan"
                  className="h-10 text-sm"
                  value={displayCompany.name}
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
                  value={displayCompany.email}
                  disabled
                  readOnly
                />
              </Field>

              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Jumlah Pekerja Perempuan
                </FieldLabel>
                <NumberInput
                  placeholder="Masukkan jumlah pekerja perempuan"
                  className="h-10 text-sm"
                  value={displayCompany.femaleWorkers}
                  disabled
                  readOnly
                />
              </Field>

              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Jumlah Pekerja Laki-laki
                </FieldLabel>
                <NumberInput
                  placeholder="Masukkan jumlah pekerja laki-laki"
                  className="h-10 text-sm"
                  value={displayCompany.maleWorkers}
                  disabled
                  readOnly
                />
              </Field>

              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Jenis KBLI Perusahaan
                </FieldLabel>
                <Input
                  type="text"
                  placeholder="Masukkan jenis KBLI perusahaan"
                  className="h-10 text-sm"
                  value={displayCompany.kbli?.name || "-"}
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
                  value={displayCompany.isSME ? "sme" : "non-sme"}
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
                  value={displayCompany.regency?.name || "-"}
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
                  value={displayCompany.district?.name || "-"}
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
                  value={displayCompany.village?.name || "-"}
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
                  value={displayCompany.address || "-"}
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

              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Penanggung Jawab Pengujian
                </FieldLabel>
                <Input
                  type="text"
                  placeholder="Masukkan penanggung jawab pengujian"
                  className="h-10 text-sm"
                  value={displayCompany.responsibleTestingPerson}
                  disabled
                  readOnly
                />
              </Field>

              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Email Penanggung Jawab Pengujian
                </FieldLabel>
                <MaskableInput
                  type="email"
                  placeholder="Masukkan email penanggung jawab pengujian"
                  className="h-10 text-sm"
                  value={displayCompany.responsibleTestingPersonEmail}
                  maskType="email"
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
                  value={displayCompany.responsibleTestingPersonPhone}
                  disabled
                  readOnly
                />
                {displayCompany.responsibleTestingPersonPhone && (
                  <a
                    href={toWaLink(displayCompany.responsibleTestingPersonPhone) ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-green-600 hover:underline"
                  >
                    <MessageCircle className="h-3 w-3" /> Buka di WhatsApp
                  </a>
                )}
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
                  value={displayCompany.companyBankName || "-"}
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
                  value={displayCompany.companyBankAccount || "-"}
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
                  value={displayCompany.companyBankAccountName || "-"}
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
