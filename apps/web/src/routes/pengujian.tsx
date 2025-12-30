import { Navbar } from "@/components/navbar";
import { Stepper } from "@/components/stepper";
import { FormSection } from "@/components/form-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Building2,
  Info,
  Users,
  UserCheck,
  UploadCloud,
  InfoIcon,
  Save,
} from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pengujian")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-100">
      {/* Background Grid Pattern */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10">
        <Navbar />

        <div className="mx-auto max-w-7xl space-y-12 px-4 py-8">
          {/* Page Title */}
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-[#0056B3]">
              layanan pengujian
            </h1>
            <div className="mx-auto h-1.5 w-48 rounded-full bg-gradient-to-r from-blue-600 via-blue-400 to-emerald-400" />
          </div>

          {/* Stepper */}
          <Stepper currentStep={2} />

          <Card className="mx-auto max-w-5xl border-none p-8 shadow-sm">
            <div className="space-y-12">
              {/* Section 1: Tambah Data Perusahaan */}
              <FormSection
                icon={Building2}
                title="Tambah Data Perusahaan"
                description="Lengkapi informasi perusahaan untuk pendaftaran"
              >
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">
                    Logo Perusahaan
                  </Label>
                  <div className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-200 bg-white transition-colors hover:bg-blue-50/50">
                    <UploadCloud className="mb-2 h-6 w-6 text-slate-400" />
                    <p className="text-xs text-slate-500">
                      Drag & drop logo atau{" "}
                      <span className="font-bold text-blue-600">
                        pilih file
                      </span>
                    </p>
                    <p className="mt-1 text-[10px] tracking-tight text-slate-400 uppercase">
                      PNG, JPG hingga 5MB
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">
                      Nama Perusahaan *
                    </Label>
                    <Input
                      placeholder="masukkan nama lokasi"
                      className="h-12 border-blue-100 bg-white placeholder:text-slate-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">
                      Email Perusahaan *
                    </Label>
                    <Input
                      placeholder="masukkan kota/kabupaten"
                      className="h-12 border-blue-100 bg-white placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">
                    Alamat *
                  </Label>
                  <Textarea
                    placeholder="masukkan alamat perusahaan"
                    className="min-h-[120px] border-blue-100 bg-white placeholder:text-slate-300"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">
                      Provinsi *
                    </Label>
                    <Select>
                      <SelectTrigger className="h-12 border-blue-100 bg-white">
                        <SelectValue placeholder="Pilih Provinsi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prov1">Provinsi 1</SelectItem>
                        <SelectItem value="prov2">Provinsi 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">
                      kecamatan *
                    </Label>
                    <Select>
                      <SelectTrigger className="h-12 border-blue-100 bg-white">
                        <SelectValue placeholder="Pilih Provinsi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kec1">Kecamatan 1</SelectItem>
                        <SelectItem value="kec2">Kecamatan 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">
                      Kabupaten/kota *
                    </Label>
                    <Select>
                      <SelectTrigger className="h-12 border-blue-100 bg-white">
                        <SelectValue placeholder="Pilih Provinsi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kab1">Kabupaten 1</SelectItem>
                        <SelectItem value="kab2">Kabupaten 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">
                      Kelurahan *
                    </Label>
                    <Select>
                      <SelectTrigger className="h-12 border-blue-100 bg-white">
                        <SelectValue placeholder="Pilih Provinsi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kel1">Kelurahan 1</SelectItem>
                        <SelectItem value="kel2">Kelurahan 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">
                    Jenis Kegiatan Usaha (KBLI) *
                  </Label>
                  <Input
                    placeholder="Kode KBLI"
                    className="h-12 border-blue-100 bg-white placeholder:text-slate-300"
                  />
                </div>
              </FormSection>

              {/* Section 2: Informasi WLKP Online */}
              <FormSection
                icon={Info}
                title="Informasi WLKP Online"
                description="Lengkapi data WLKP"
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">
                      Nomor WLKP Online *
                    </Label>
                    <Input
                      placeholder="Nomor WLKP"
                      className="h-12 border-blue-100 bg-white placeholder:text-slate-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">
                      Status WLKP Online *
                    </Label>
                    <Select>
                      <SelectTrigger className="h-12 border-blue-100 bg-white">
                        <SelectValue placeholder="Pilih Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="inactive">Tidak Aktif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </FormSection>

              {/* Section 3: Data Tenaga Kerja */}
              <FormSection
                icon={Users}
                title="Data Tenaga Kerja"
                description="Lengkapi data tenaga kerja"
              >
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">
                      Jumlah tenaga kerja Pria *
                    </Label>
                    <Input
                      placeholder="Nomor WLKP"
                      className="h-12 border-blue-100 bg-white placeholder:text-slate-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">
                      Jumlah tenaga kerja wanita *
                    </Label>
                    <Input
                      placeholder="Nomor WLKP"
                      className="h-12 border-blue-100 bg-white placeholder:text-slate-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">
                      Fasilitas kesehatan
                    </Label>
                    <Select>
                      <SelectTrigger className="h-12 border-blue-100 bg-white">
                        <SelectValue placeholder="Pilih fasilitas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fas1">Fasilitas 1</SelectItem>
                        <SelectItem value="fas2">Fasilitas 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </FormSection>

              {/* Section 4: Penanggung jawab pengujian */}
              <FormSection
                icon={UserCheck}
                title="Penanggung jawab pengujian"
                description="Lengkapi data penanggung jawab"
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">
                      Nama penanggung jawab *
                    </Label>
                    <Input
                      placeholder="Nomor WLKP"
                      className="h-12 border-blue-100 bg-white placeholder:text-slate-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">
                      No Hp penanggung jawab *
                    </Label>
                    <Input
                      placeholder="Kode KBLI"
                      className="h-12 border-blue-100 bg-white placeholder:text-slate-300"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">
                    Email penanggung jawab *
                  </Label>
                  <Input
                    placeholder="Nomor WLKP"
                    className="h-12 border-blue-100 bg-white placeholder:text-slate-300"
                  />
                </div>
              </FormSection>
            </div>

            <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <InfoIcon className="h-4 w-4" />
                <span>Field dengan tanda * wajib diisi</span>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  className="h-11 border-none bg-slate-100 px-8 text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </Button>
                <Button
                  variant="outline"
                  className="h-11 border-none bg-slate-400 px-8 text-white hover:bg-slate-500"
                >
                  Simpan Draft
                </Button>
                <Button className="h-11 bg-blue-600 px-8 text-white hover:bg-blue-700">
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Data
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
