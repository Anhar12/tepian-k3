import LandingNavbar from "@/components/navbar";
import GridBackground from "@/components/grid-background";
import Footer from "@/components/footer";
import ImageWithFallback from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createFileRoute, Link } from "@tanstack/react-router";
import { pageHead } from "@/utils/page-head";
import { useState } from "react";
import { trpc, trpcClient } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import {
  Clipboard,
  Search,
  Loader2,
  ArrowLeft,
  Upload,
  Clock,
  UserRoundPen,
  ClipboardPen,
  Info,
  Eye,
  Trash2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ppid/permohonan")({
  component: PPIDPermohonanPage,
  head: () => pageHead("Permohonan & Lacak PPID - Balai K3 Samarinda"),
});

function PPIDPermohonanPage() {
  const [activeTab, setActiveTab] = useState<"ajukan" | "lacak">("ajukan");

  // Track ticket state
  const [trackTicketNumber, setTrackTicketNumber] = useState("");
  const [trackEmail, setTrackEmail] = useState("");
  const [trackedData, setTrackedData] = useState<any>(null);
  const [isTrackLoading, setIsTrackLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    namaPemohon: "",
    phone: "",
    email: "",
    address: "",
    jenisInformasi: "",
    rincianInformasi: "",
    tujuanPenggunaan: "",
    caraMendapatkan: "email",
  });
  const [identityFiles, setIdentityFiles] = useState<File[]>([]);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isDeclaredTrue, setIsDeclaredTrue] = useState(false);

  // Success dialog state
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [createdTicketNumber, setCreatedTicketNumber] = useState("");

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackTicketNumber || !trackEmail) {
      toast.error("Silakan isi nomor tiket dan email pemohon");
      return;
    }

    setIsTrackLoading(true);
    try {
      // Call tRPC track endpoint
      const result = await trpcClient.platform.ppid.trackSubmission.query({
        ticketNumber: trackTicketNumber,
        email: trackEmail,
      });
      setTrackedData(result);
      toast.success("Data tiket berhasil ditemukan");
    } catch (err: any) {
      toast.error(
        err.message ||
          "Gagal menemukan data tiket. Pastikan nomor tiket dan email benar.",
      );
      setTrackedData(null);
    } finally {
      setIsTrackLoading(false);
    }
  };

  const submitMutation = useMutation(
    trpc.platform.ppid.submitRequest.mutationOptions({
      onSuccess: (data) => {
        setCreatedTicketNumber(data.ticketNumber);
        setIsSuccessOpen(true);
        // Reset form
        setFormData({
          namaPemohon: "",
          phone: "",
          email: "",
          address: "",
          jenisInformasi: "",
          rincianInformasi: "",
          tujuanPenggunaan: "",
          caraMendapatkan: "email",
        });
        setIdentityFiles([]);
        setIsDeclaredTrue(false);
      },
      onError: (err) => {
        toast.error(err.message || "Gagal mengirimkan permohonan");
      },
    }),
  );

  const handleReset = () => {
    setFormData({
      namaPemohon: "",
      phone: "",
      email: "",
      address: "",
      jenisInformasi: "",
      rincianInformasi: "",
      tujuanPenggunaan: "",
      caraMendapatkan: "email",
    });
    setIdentityFiles([]);
    setIsDeclaredTrue(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (identityFiles.length === 0) {
      toast.error("Wajib mengunggah minimal 1 dokumen identitas/pendukung");
      return;
    }

    if (!isDeclaredTrue) {
      toast.error("Anda harus menyetujui pernyataan kebenaran data");
      return;
    }

    const multipartFormData = new FormData();
    multipartFormData.append("namaPemohon", formData.namaPemohon);
    multipartFormData.append("phone", formData.phone);
    multipartFormData.append("email", formData.email);
    multipartFormData.append("address", formData.address);
    multipartFormData.append("jenisInformasi", formData.jenisInformasi);
    multipartFormData.append("rincianInformasi", formData.rincianInformasi);
    multipartFormData.append("tujuanPenggunaan", formData.tujuanPenggunaan);
    multipartFormData.append("caraMendapatkan", formData.caraMendapatkan);

    // Append each file to identityFiles[] array
    identityFiles.forEach((file) => {
      multipartFormData.append("identityFiles[]", file);
    });

    submitMutation.mutate(multipartFormData);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(createdTicketNumber);
    toast.success("Nomor tiket berhasil disalin ke clipboard");
  };

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden overflow-y-auto bg-white dark:bg-neutral-950">
      <LandingNavbar />

      <section className="relative flex h-48 flex-col items-center justify-center bg-primary px-4 text-center sm:px-6 md:px-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
          <GridBackground />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-primary-foreground md:text-5xl">
            Layanan Permohonan Informasi
          </h1>
          <p className="mt-2 text-sm text-primary-foreground/80 md:text-base">
            Ajukan permohonan informasi publik secara online atau lacak status
            tiket permohonan Anda.
          </p>
        </div>
      </section>

      <main className="container mx-auto max-w-7xl flex-1 px-4 py-10">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as any)}
          className="w-full"
        >
          <TabsList className="mb-8 grid h-14 w-full grid-cols-2 rounded-2xl border bg-slate-100 p-1 dark:border-neutral-800 dark:bg-neutral-900">
            <TabsTrigger
              value="ajukan"
              className="rounded-xl py-3 text-base font-semibold"
            >
              Ajukan Permohonan Baru
            </TabsTrigger>
            <TabsTrigger
              value="lacak"
              className="rounded-xl py-3 text-base font-semibold"
            >
              Lacak Status Tiket
            </TabsTrigger>
          </TabsList>

          {/* Kembali Button */}
          <div className="mb-6 flex justify-start">
            <Link
              to="/ppid"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[#AFCFFA] bg-[#1061D6] px-5 py-2 text-sm font-semibold text-[#F8FAFC] shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1061D6]/90"
            >
              <ArrowLeft className="size-4" />
              <span>Kembali</span>
            </Link>
          </div>

          {/* TAB: AJUKAN PERMOHONAN */}
          <TabsContent value="ajukan">
            <Card className="overflow-hidden rounded-[30px] border border-slate-100 bg-white p-6 shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] md:p-12 dark:border-neutral-800 dark:bg-neutral-900">
              <form onSubmit={handleFormSubmit} className="space-y-8">
                {/* SECTION 1: Data Pemohon Informasi */}
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex size-[55px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-[#DBEAFE] text-[#1061D6] dark:border-neutral-800 dark:bg-blue-950/30">
                      <UserRoundPen className="size-6" />
                    </div>
                    <div>
                      <h3 className="font-poppins text-2xl font-semibold text-[#4D4D4D] md:text-3xl dark:text-slate-100">
                        Data Pemohon Informasi
                      </h3>
                      <p className="font-poppins mt-1 text-sm text-[#4D4D4D] md:text-base dark:text-slate-400">
                        Silakan isi formulir berikut untuk mengajukan permohonan
                        informasi. Pastikan data yang diisi sudah benar dan
                        lengkap.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2.5">
                      <Label
                        htmlFor="namaPemohon"
                        className="font-poppins text-base font-medium text-slate-700 dark:text-slate-300"
                      >
                        Nama Pemohon <span className="text-[#1061D6]">*</span>
                      </Label>
                      <Input
                        id="namaPemohon"
                        placeholder="Masukkan nama lengkap sesuai identitas"
                        className="h-[55px] border-[#A1C7FD] bg-white px-4 text-sm focus-visible:ring-2 focus-visible:ring-primary dark:border-neutral-800 dark:bg-neutral-950"
                        value={formData.namaPemohon}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            namaPemohon: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor="phone"
                        className="font-poppins text-base font-medium text-slate-700 dark:text-slate-300"
                      >
                        Nomor Telepon/Whatsapp{" "}
                        <span className="text-[#1061D6]">*</span>
                      </Label>
                      <Input
                        id="phone"
                        placeholder="0812xxxxxxx"
                        className="h-[55px] border-[#A1C7FD] bg-white px-4 text-sm focus-visible:ring-2 focus-visible:ring-primary dark:border-neutral-800 dark:bg-neutral-950"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor="email"
                        className="font-poppins text-base font-medium text-slate-700 dark:text-slate-300"
                      >
                        E-mail <span className="text-[#1061D6]">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="contoh@gmail.com"
                        className="h-[55px] border-[#A1C7FD] bg-white px-4 text-sm focus-visible:ring-2 focus-visible:ring-primary dark:border-neutral-800 dark:bg-neutral-950"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor="address"
                        className="font-poppins text-base font-medium text-slate-700 dark:text-slate-300"
                      >
                        Alamat <span className="text-[#1061D6]">*</span>
                      </Label>
                      <Textarea
                        id="address"
                        placeholder="Masukkan alamat lengkap"
                        className="min-h-[55px] border-[#A1C7FD] bg-white px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-primary dark:border-neutral-800 dark:bg-neutral-950"
                        rows={1}
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Line 51 Divider */}
                <div className="my-8 border-t border-[#1b6bdd]/20 dark:border-neutral-800/40" />

                {/* SECTION 2: Informasi yang Dimohonkan */}
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex size-[55px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-[#DBEAFE] text-[#1061D6] dark:border-neutral-800 dark:bg-blue-950/30">
                      <ClipboardPen className="size-6" />
                    </div>
                    <div>
                      <h3 className="font-poppins text-2xl font-semibold text-[#4D4D4D] md:text-3xl dark:text-slate-100">
                        Informasi yang Dimohonkan
                      </h3>
                      <p className="font-poppins mt-1 text-sm text-[#4D4D4D] md:text-base dark:text-slate-400">
                        Silakan jelaskan informasi yang dibutuhkan secara rinci
                        agar permohonan dapat diproses dengan tepat.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2.5">
                      <Label
                        htmlFor="jenisInformasi"
                        className="font-poppins text-base font-medium text-slate-700 dark:text-slate-300"
                      >
                        Jenis Informasi yang Dibutuhkan{" "}
                        <span className="text-[#1061D6]">*</span>
                      </Label>
                      <Input
                        id="jenisInformasi"
                        placeholder="Data/Dokumen, Laporan, Informasi Kegiatan, dll"
                        className="h-[55px] border-[#A1C7FD] bg-white px-4 text-sm focus-visible:ring-2 focus-visible:ring-primary dark:border-neutral-800 dark:bg-neutral-950"
                        value={formData.jenisInformasi}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            jenisInformasi: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor="rincianInformasi"
                        className="font-poppins text-base font-medium text-slate-700 dark:text-slate-300"
                      >
                        Rincian Informasi yang Dibutuhkan{" "}
                        <span className="text-[#1061D6]">*</span>
                      </Label>
                      <Input
                        id="rincianInformasi"
                        placeholder="laporan kegiatan tahun 2025, data pengujian K3, dll"
                        className="h-[55px] border-[#A1C7FD] bg-white px-4 text-sm focus-visible:ring-2 focus-visible:ring-primary dark:border-neutral-800 dark:bg-neutral-950"
                        value={formData.rincianInformasi}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rincianInformasi: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor="tujuanPenggunaan"
                        className="font-poppins text-base font-medium text-slate-700 dark:text-slate-300"
                      >
                        Tujuan Penggunaan Informasi{" "}
                        <span className="text-[#1061D6]">*</span>
                      </Label>
                      <Input
                        id="tujuanPenggunaan"
                        placeholder="penelitian, kebutuhan perusahaan, dll"
                        className="h-[55px] border-[#A1C7FD] bg-white px-4 text-sm focus-visible:ring-2 focus-visible:ring-primary dark:border-neutral-800 dark:bg-neutral-950"
                        value={formData.tujuanPenggunaan}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tujuanPenggunaan: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor="caraMendapatkan"
                        className="font-poppins text-base font-medium text-slate-700 dark:text-slate-300"
                      >
                        Cara Mendapatkan Informasi{" "}
                        <span className="text-[#1061D6]">*</span>
                      </Label>
                      <select
                        id="caraMendapatkan"
                        className="flex h-[55px] w-full rounded-lg border border-[#A1C7FD] bg-white px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950"
                        value={formData.caraMendapatkan}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            caraMendapatkan: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="email">dikirim melalui Email</option>
                        <option value="ambil-langsung">Melihat langsung</option>
                        <option value="whatsapp">Kirim lewat WhatsApp</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: UPLOAD AREA */}
                <div className="space-y-3">
                  <Label className="font-poppins text-base font-semibold text-slate-700 dark:text-slate-300">
                    Upload Dokumen{" "}
                    <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                      (Unggah dokumen pendukung seperti surat permohonan atau
                      identitas apabila diperlukan.)
                    </span>
                  </Label>
                  <div className="relative flex h-[170px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#93C5FD] bg-[#DBEAFE]/10 px-6 py-4 transition-colors hover:bg-[#DBEAFE]/20 dark:border-neutral-800 dark:bg-neutral-900/30">
                    <input
                      type="file"
                      multiple
                      className="absolute inset-0 cursor-pointer opacity-0"
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          const newFiles: File[] = [];
                          const maxLimit = 5 * 1024 * 1024; // 5MB limit
                          const fileList = Array.from(files);
                          for (const file of fileList) {
                            if (file.size > maxLimit) {
                              toast.error(
                                `Ukuran file "${file.name}" melebihi batas optimal 5MB.`,
                              );
                            } else {
                              newFiles.push(file);
                            }
                          }
                          if (newFiles.length > 0) {
                            setIdentityFiles((prev) => [...prev, ...newFiles]);
                          }
                          // Clear input value so same files can be re-selected if deleted
                          e.target.value = "";
                        }
                      }}
                      required={identityFiles.length === 0}
                    />
                    <Upload className="mb-2 size-8 text-[#1061D6]" />
                    <span className="text-sm text-slate-700 dark:text-neutral-300">
                      Drag & drop atau{" "}
                      <span className="font-semibold text-[#1061D6] hover:underline">
                        pilih file
                      </span>
                    </span>
                    <span className="mt-1 text-xs text-slate-400">
                      PDF, JPEG, PNG, atau WEBP (Maksimal 5MB per berkas)
                    </span>
                  </div>

                  {/* LIST FILE TERPILIH & PRATINJAU */}
                  {identityFiles.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <Label className="font-poppins text-sm font-semibold text-slate-700 dark:text-slate-300">
                        File Terpilih ({identityFiles.length})
                      </Label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {identityFiles.map((file, idx) => {
                          const isImage = file.type.startsWith("image/");
                          const fileSizeStr =
                            (file.size / (1024 * 1024)).toFixed(2) + " MB";
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-900/30"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                {isImage ? (
                                  <div className="size-12 shrink-0 overflow-hidden rounded-lg border bg-white dark:bg-neutral-900">
                                    <ImageWithFallback
                                      src={URL.createObjectURL(file)}
                                      alt={file.name}
                                      className="size-full"
                                      imgClassName="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border bg-blue-50 text-[#1061D6] dark:bg-neutral-950">
                                    <FileText className="size-6" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                                    {file.name}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {fileSizeStr}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="size-8 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                  onClick={() => setPreviewFile(file)}
                                >
                                  <Eye className="size-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="size-8 text-destructive hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                  onClick={() => {
                                    setIdentityFiles((prev) =>
                                      prev.filter((_, i) => i !== idx),
                                    );
                                  }}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 4: DECLARATION CHECKBOX */}
                <div className="flex items-start gap-3 rounded-lg py-2">
                  <input
                    id="isDeclaredTrue"
                    type="checkbox"
                    className="mt-1 size-5 rounded border-[#A1C7FD] text-primary focus:ring-primary dark:border-neutral-800"
                    checked={isDeclaredTrue}
                    onChange={(e) => setIsDeclaredTrue(e.target.checked)}
                    required
                  />
                  <Label
                    htmlFor="isDeclaredTrue"
                    className="font-poppins cursor-pointer text-sm leading-relaxed font-medium text-[#4D4D4D] select-none dark:text-slate-300"
                  >
                    Saya menyatakan bahwa data yang diisi adalah benar dan dapat
                    dipertanggungjawabkan.{" "}
                    <span className="text-[#1061D6]">*</span>
                  </Label>
                </div>

                {/* FORM FOOTER ACTIONS */}
                <div className="flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                  <div className="flex items-center gap-1.5 text-sm text-[#4B5563]">
                    <Info className="size-4 text-slate-400" />
                    <span>
                      Field dengan tanda{" "}
                      <span className="font-bold text-[#1061D6]">*</span> wajib
                      diisi
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleReset}
                      className="h-[49px] w-[101px] rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-neutral-800 dark:text-slate-300 dark:hover:bg-neutral-700"
                    >
                      Batal
                    </Button>

                    <Button
                      type="submit"
                      disabled={submitMutation.isPending}
                      className="h-[49px] w-[208px] rounded-lg bg-[#1061D6] font-bold text-white shadow-md transition-all hover:bg-[#1061D6]/90"
                    >
                      {submitMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Mengirimkan...
                        </>
                      ) : (
                        "Kirim Permohonan"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </TabsContent>

          {/* TAB: LACAK STATUS TIKET */}
          <TabsContent value="lacak">
            <div className="space-y-6">
              <Card className="rounded-[30px] border border-slate-100 bg-white p-6 shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] md:p-12 dark:border-neutral-800 dark:bg-neutral-900">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="font-poppins text-2xl font-bold text-slate-800 dark:text-slate-100">
                    Pelacakan Tiket
                  </CardTitle>
                  <CardDescription className="font-poppins text-sm text-slate-500 dark:text-slate-400">
                    Masukkan nomor tiket dan email pemohon yang Anda terima saat
                    mengirimkan pengajuan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <form onSubmit={handleTrackSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2.5">
                        <Label
                          htmlFor="trackTicketNumber"
                          className="font-poppins text-base font-medium text-slate-700 dark:text-slate-300"
                        >
                          Nomor Tiket PPID
                        </Label>
                        <Input
                          id="trackTicketNumber"
                          placeholder="Contoh: PPID-20260612-8172"
                          className="h-[55px] border-[#A1C7FD] bg-white px-4 text-sm focus-visible:ring-2 focus-visible:ring-primary dark:border-neutral-800 dark:bg-neutral-950"
                          value={trackTicketNumber}
                          onChange={(e) => setTrackTicketNumber(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label
                          htmlFor="trackEmail"
                          className="font-poppins text-base font-medium text-slate-700 dark:text-slate-300"
                        >
                          Email Pemohon
                        </Label>
                        <Input
                          id="trackEmail"
                          type="email"
                          placeholder="Contoh: budi@gmail.com"
                          className="h-[55px] border-[#A1C7FD] bg-white px-4 text-sm focus-visible:ring-2 focus-visible:ring-primary dark:border-neutral-800 dark:bg-neutral-950"
                          value={trackEmail}
                          onChange={(e) => setTrackEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={isTrackLoading}
                      className="h-[49px] w-full gap-1.5 rounded-lg bg-[#1061D6] font-bold text-[#F8FAFC] shadow-md transition-all hover:bg-[#1061D6]/90"
                    >
                      {isTrackLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Mencari...
                        </>
                      ) : (
                        <>
                          <Search className="size-4" />
                          Lacak Tiket PPID
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* TRACKED TICKET RESULT DISPLAY */}
              {trackedData && (
                <Card className="overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] dark:border-neutral-800 dark:bg-neutral-900">
                  <CardHeader className="border-b bg-slate-50/50 p-6 md:p-8 dark:bg-neutral-900/50">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                          Nomor Tiket
                        </span>
                        <h4 className="text-xl font-bold text-[#1061D6]">
                          {trackedData.ticketNumber}
                        </h4>
                      </div>
                      <div>
                        <span className="mb-1 block text-right text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                          Status Tiket
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-4 py-1 text-xs font-bold tracking-wider uppercase ${
                            trackedData.status === "pending"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                              : trackedData.status === "disetujui"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                                : trackedData.status === "ditolak"
                                  ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                          }`}
                        >
                          {trackedData.status === "pending" &&
                            "Menunggu Verifikasi"}
                          {trackedData.status === "disetujui" &&
                            "Permohonan Disetujui"}
                          {trackedData.status === "ditolak" &&
                            "Permohonan Ditolak"}
                          {trackedData.status === "selesai" &&
                            "Selesai Dijawab"}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-8 p-6 text-sm md:p-8">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <div>
                          <span className="block text-xs font-semibold tracking-wider text-slate-400 uppercase">
                            Nama Pemohon
                          </span>
                          <span className="text-base font-semibold text-slate-700 dark:text-neutral-300">
                            {trackedData.namaPemohon}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs font-semibold tracking-wider text-slate-400 uppercase">
                            WhatsApp / Telepon
                          </span>
                          <span className="text-base font-semibold text-slate-700 dark:text-neutral-300">
                            {trackedData.phone}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs font-semibold tracking-wider text-slate-400 uppercase">
                            Cara Memperoleh
                          </span>
                          <span className="text-base font-semibold text-slate-700 capitalize dark:text-neutral-300">
                            {trackedData.caraMendapatkan === "email"
                              ? "dikirim melalui Email"
                              : trackedData.caraMendapatkan === "ambil-langsung"
                                ? "Melihat langsung"
                                : trackedData.caraMendapatkan}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <span className="block text-xs font-semibold tracking-wider text-slate-400 uppercase">
                            Informasi yang Diminta
                          </span>
                          <span className="block text-base font-semibold text-slate-700 dark:text-neutral-300">
                            {trackedData.jenisInformasi}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs font-semibold tracking-wider text-slate-400 uppercase">
                            Tujuan Penggunaan
                          </span>
                          <p className="text-base leading-relaxed text-slate-600 dark:text-neutral-400">
                            {trackedData.tujuanPenggunaan}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Progress tracking indicator */}
                    <div className="border-t border-slate-100 pt-6 dark:border-neutral-800">
                      <h5 className="mb-6 flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-200">
                        <Clock className="size-4 text-[#1061D6]" />
                        Status Progress Tiket
                      </h5>
                      <div className="relative space-y-8 border-l-2 border-[#AFCFFA] pl-6 dark:border-neutral-800">
                        {/* Step: Selesai */}
                        {trackedData.status === "selesai" && (
                          <div className="relative">
                            <div className="absolute top-0.5 -left-[31px] size-4 rounded-full border-4 border-white bg-emerald-600 shadow-sm dark:border-neutral-950" />
                            <h6 className="text-base font-bold text-emerald-600">
                              Selesai Dijawab
                            </h6>
                            <p className="mt-0.5 text-sm text-slate-600 dark:text-neutral-400">
                              Admin PPID telah melampirkan berkas jawaban.
                            </p>
                            {trackedData.responseFileUrl && (
                              <a
                                href={trackedData.responseFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex items-center text-sm font-semibold text-[#1061D6] underline hover:text-[#1061D6]/80"
                              >
                                Download Berkas Tanggapan PPID
                              </a>
                            )}
                          </div>
                        )}

                        {/* Step: Disetujui */}
                        {(trackedData.status === "disetujui" ||
                          trackedData.status === "selesai") && (
                          <div className="relative">
                            <div className="absolute top-0.5 -left-[31px] size-4 rounded-full border-4 border-white bg-blue-600 shadow-sm dark:border-neutral-950" />
                            <h6 className="text-base font-bold text-blue-600">
                              Permohonan Disetujui
                            </h6>
                            <p className="mt-0.5 text-sm text-slate-600 dark:text-neutral-400">
                              Permohonan Anda disetujui dan sedang dalam proses
                              pencarian berkas oleh tim pengolah data PPID.
                            </p>
                          </div>
                        )}

                        {/* Step: Ditolak */}
                        {trackedData.status === "ditolak" && (
                          <div className="relative">
                            <div className="absolute top-0.5 -left-[31px] size-4 rounded-full border-4 border-white bg-red-600 shadow-sm dark:border-neutral-950" />
                            <h6 className="text-base font-bold text-red-600">
                              Permohonan Ditolak / Dikecualikan
                            </h6>
                            <p className="mt-0.5 text-sm text-slate-600 dark:text-neutral-400">
                              Permohonan ditolak karena alasan klasifikasi
                              dokumen rahasia/dikecualikan.
                            </p>
                            {trackedData.adminNotes && (
                              <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-900 dark:bg-red-950/20 dark:text-red-300">
                                <strong>Catatan Admin:</strong>{" "}
                                {trackedData.adminNotes}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Step: Pending */}
                        <div className="relative">
                          <div className="absolute top-0.5 -left-[31px] size-4 rounded-full border-4 border-white bg-slate-600 shadow-sm dark:border-neutral-950" />
                          <h6 className="text-base font-bold text-slate-700 dark:text-neutral-300">
                            Permohonan Diterima
                          </h6>
                          <p className="mt-0.5 text-sm text-slate-600 dark:text-neutral-400">
                            Tiket pengajuan telah terdaftar di sistem PPID dan
                            menunggu verifikasi administrasi.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* DIALOG SUCCESS POP-UP */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="w-[95%] max-w-[765px] overflow-hidden rounded-[40px] border border-slate-100 bg-[#FCFCFC] p-0 shadow-[0px_0px_82px_-1.6px_rgba(16,97,214,0.14)] dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-col items-center px-6 pt-8 pb-6 md:px-12">
            {/* Success Illustration */}
            <div className="mb-6 flex w-full max-w-[416px] justify-center">
              <ImageWithFallback
                src="/assets/popup_success.svg"
                alt="Permohonan Berhasil"
                className="h-auto max-h-[225px] w-full"
                imgClassName="object-contain"
              />
            </div>

            {/* Title & Description */}
            <div className="max-w-[700px] space-y-3 text-center">
              <DialogTitle className="font-poppins text-2xl font-semibold text-[#1061D6] md:text-[32px] md:leading-[130%]">
                Permohonan Berhasil Dikirim!
              </DialogTitle>
              <DialogDescription className="font-poppins text-base font-medium text-slate-600 md:text-xl dark:text-slate-300">
                Konfirmasi dan detail permohonan akan dikirimkan melalui email
                yang telah didaftarkan.
              </DialogDescription>
            </div>

            {/* Ticket Display Card */}
            <div className="mt-6 flex w-full max-w-md items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-[#EDF5FF] p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  Nomor Tiket Pelacakan
                </span>
                <span className="font-mono text-base font-bold text-[#1061D6] select-all md:text-lg">
                  {createdTicketNumber}
                </span>
              </div>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={copyToClipboard}
                className="rounded-xl border-blue-200 bg-white text-[#1061D6] hover:bg-[#EDF5FF] dark:border-neutral-800 dark:bg-neutral-900"
              >
                <Clipboard className="size-4" />
              </Button>
            </div>
          </div>

          {/* Solid Blue Footer Bar (Rectangle 3464235) */}
          <div className="flex w-full flex-col items-center justify-center gap-4 border-t border-blue-700/20 bg-[#1061D6] px-6 py-5 sm:flex-row md:px-12">
            <Button
              type="button"
              className="h-12 w-full rounded-xl bg-white px-8 font-bold text-[#1061D6] shadow-md hover:bg-slate-50 sm:w-auto"
              onClick={() => {
                setIsSuccessOpen(false);
                setActiveTab("lacak");
                setTrackTicketNumber(createdTicketNumber);
              }}
            >
              Lacak Status Tiket
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-12 w-full rounded-xl border border-white/30 px-8 font-semibold text-white hover:bg-white/10 sm:w-auto"
              onClick={() => setIsSuccessOpen(false)}
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG PREVIEW DOKUMEN */}
      <Dialog
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      >
        <DialogContent className="flex h-[80vh] w-[95%] max-w-4xl flex-col overflow-hidden rounded-[30px] border border-slate-100 bg-white p-6 shadow-[0px_0px_82px_-1.6px_rgba(16,97,214,0.14)] dark:border-neutral-800 dark:bg-neutral-900">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="font-poppins truncate pr-6 text-lg font-bold text-slate-800 dark:text-slate-100">
              Pratinjau: {previewFile?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Meninjau berkas sebelum mengajukan permohonan.
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-auto rounded-2xl bg-slate-50 p-2 dark:bg-neutral-950/40">
            {previewFile &&
              (previewFile.type.startsWith("image/") ? (
                <ImageWithFallback
                  src={URL.createObjectURL(previewFile)}
                  alt={previewFile.name}
                  className="max-h-full max-w-full rounded-lg shadow-sm"
                  imgClassName="object-contain"
                />
              ) : previewFile.type === "application/pdf" ? (
                <iframe
                  src={URL.createObjectURL(previewFile)}
                  title="PDF Preview"
                  className="size-full rounded-lg border-0"
                />
              ) : (
                <div className="space-y-2 text-center">
                  <FileText className="mx-auto size-16 text-[#1061D6] opacity-60" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Format file tidak didukung untuk pratinjau langsung.
                  </p>
                  <p className="text-xs text-slate-400">
                    File ini dapat diunggah dengan aman.
                  </p>
                </div>
              ))}
          </div>

          <DialogFooter className="flex items-center justify-end border-t pt-4">
            <Button
              type="button"
              className="h-[44px] rounded-xl bg-[#1061D6] px-6 font-semibold text-white hover:bg-[#1061D6]/90"
              onClick={() => setPreviewFile(null)}
            >
              Tutup Pratinjau
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

// ##################
// end authored
// ##################
