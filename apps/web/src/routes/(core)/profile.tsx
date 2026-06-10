import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/utils/trpc";
import { globalSuccessToast, globalErrorToast } from "@/lib/toast";
import { useState, useRef } from "react";
import {
  Upload,
  ArrowLeft,
  Camera,
  X,
  ImageIcon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Building2,
  User,
} from "lucide-react";
import { useMutation, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import ChangePasswordForm from "@/components/change-password-form";
import UpdateUserProfileForm from "@/components/update-user-profile-form";
import ImageWithFallback from "@/components/image-with-fallback";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/(core)/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { data: user, refetch } = useSuspenseQuery(
    trpc.platform.auth.profile.queryOptions(),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const uploadAvatarMutation = useMutation(
    trpc.platform.user.updateAvatar.mutationOptions({
      onSuccess: async () => {
        globalSuccessToast("Avatar berhasil diunggah");
        setSelectedFile(null);
        setPreviewUrl(null);
        await refetch();
      },
      onError: (error) => {
        globalErrorToast(`Gagal mengunggah avatar: ${error.message}`);
      },
    }),
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        globalErrorToast("Ukuran file harus kurang dari 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        globalErrorToast("Harap pilih file gambar");
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("avatar", selectedFile);
    uploadAvatarMutation.mutate(formData);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <div className="container mx-auto max-w-2xl space-y-6 p-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => navigate({ to: "/" })}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Avatar Upload Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>
              Upload a new avatar to personalize your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-6">
              {/* Avatar with overlay */}
              <div className="group relative">
                <Avatar className="h-36 w-36 border-4 border-muted shadow-lg">
                  <AvatarImage
                    src={previewUrl || user.profilePictureUrl || undefined}
                    alt={user.name || "User"}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/10 text-5xl font-semibold text-primary">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                {/* Hover overlay */}
                <div
                  className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center text-white">
                    <Camera className="h-6 w-6" />
                    <span className="mt-1 text-xs font-medium">Change</span>
                  </div>
                </div>

                {/* Status badge */}
                {selectedFile && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-2 -right-2 gap-1"
                  >
                    <ImageIcon className="h-3 w-3" />
                    New
                  </Badge>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* File info and actions */}
              {selectedFile ? (
                <Card className="w-full max-w-xs border-dashed">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        onClick={handleCancel}
                        disabled={uploadAvatarMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={handleUpload}
                        disabled={uploadAvatarMutation.isPending}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {uploadAvatarMutation.isPending
                          ? "Uploading..."
                          : "Upload"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={uploadAvatarMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Choose Image
                </Button>
              )}

              <p className="max-w-xs text-center text-xs text-muted-foreground">
                Recommended: Square image, at least 400x400px
                <br />
                Maximum file size: 5MB
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information Form */}
        <UpdateUserProfileForm user={user} />

        {/* Pass Foto Latar Merah Card */}
        {/* ##################
            authored (generated by claude, Jun 10 2026 05:25 WITA)
        ################## */}
        <PassPhotoUploadCard />
        {/* ##################
            end authored
        ################## */}

        {/* Bimtek & Pelatihan Saya */}
        <BimtekRegistrationsList />

        {/* Change Password Form */}
        <ChangePasswordForm />
      </div>
    </div>
  );
}

// ##################
// authored (generated by gemini, Jun 03 2026 13:20 WITA)
// ##################

/**
 * Komponen untuk menampilkan daftar pendaftaran Bimtek K3 milik user beserta
 * status verifikasinya dan formulir revisi berkas jika diperlukan.
 */
function BimtekRegistrationsList() {
  const {
    data: enrollments,
    isLoading,
    refetch,
  } = useQuery(trpc.pelatihan.enrollment.getUserEnrollments.queryOptions());

  const bimtekEnrollments =
    enrollments?.filter((e: any) => e.pelatihan?.type === "bimtek") || [];

  if (isLoading) {
    return (
      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="font-['Plus_Jakarta_Sans'] text-lg font-bold">
            Bimtek K3 Saya
          </CardTitle>
          <CardDescription>Memuat data pendaftaran...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-[#1061D6]" />
        </CardContent>
      </Card>
    );
  }

  if (bimtekEnrollments.length === 0) {
    return null; // Don't show the card if the user has no Bimtek enrollments
  }

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-slate-800">
          Bimtek K3 Saya
        </CardTitle>
        <CardDescription className="font-['Poppins'] text-xs">
          Pantau status verifikasi berkas dan detail keikutsertaan bimbingan
          teknis Anda.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {bimtekEnrollments.map((enrollment: any) => (
          <BimtekItem
            key={enrollment.id}
            enrollment={enrollment}
            refetch={refetch}
          />
        ))}
      </CardContent>
    </Card>
  );
}

interface BimtekItemProps {
  enrollment: any;
  refetch: () => void;
}

function BimtekItem({ enrollment, refetch }: BimtekItemProps) {
  const [showDocs, setShowDocs] = useState(false);
  const [showCompany, setShowCompany] = useState(false);
  const [showRevision, setShowRevision] = useState(false);

  // Files for revision
  const [revisedFiles, setRevisedFiles] = useState<{
    employmentLetterUrl: string;
    employmentLetterName: string;
    consentLetterUrl: string;
    consentLetterName: string;
    diplomaUrl: string;
    diplomaName: string;
    // ##################
    // authored (generated by claude, Jun 10 2026 05:25 WITA)
    // ##################
    passPhotoUrl: string;
    passPhotoName: string;
    // ##################
    // end authored
    // ##################
  }>({
    employmentLetterUrl: "",
    employmentLetterName: "",
    consentLetterUrl: "",
    consentLetterName: "",
    diplomaUrl: "",
    diplomaName: "",
    // ##################
    // authored (generated by claude, Jun 10 2026 05:25 WITA)
    // ##################
    passPhotoUrl: "",
    passPhotoName: "",
    // ##################
    // end authored
    // ##################
  });

  const [uploadingState, setUploadingState] = useState<{
    employmentLetter: boolean;
    consentLetter: boolean;
    diploma: boolean;
    // ##################
    // authored (generated by claude, Jun 10 2026 05:25 WITA)
    // ##################
    passPhoto: boolean;
    // ##################
    // end authored
    // ##################
  }>({
    employmentLetter: false,
    consentLetter: false,
    diploma: false,
    // ##################
    // authored (generated by claude, Jun 10 2026 05:25 WITA)
    // ##################
    passPhoto: false,
    // ##################
    // end authored
    // ##################
  });

  const uploadMutation = useMutation(
    trpc.pelatihan.enrollment.uploadBimtekDocument.mutationOptions({
      onError: (err) => {
        toast.error(`Gagal mengunggah berkas: ${err.message}`);
      },
    }),
  );

  const updateDocsMutation = useMutation(
    trpc.pelatihan.enrollment.updateBimtekDocuments.mutationOptions({
      onSuccess: () => {
        toast.success("Berkas revisi berhasil dikirim ulang!");
        setShowRevision(false);
        refetch();
      },
      onError: (err) => {
        toast.error(err.message || "Gagal mengirim ulang berkas revisi.");
      },
    }),
  );

  const handleUploadRevisedFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "employmentLetter" | "consentLetter" | "diploma" | "passPhoto",
    label: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ##################
    // authored (generated by claude, Jun 10 2026 05:25 WITA)
    // ##################
    if (type === "passPhoto") {
      if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
        toast.error("Format pass foto harus berupa gambar (JPG, JPEG, PNG)");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran pass foto tidak boleh melebihi 5MB");
        return;
      }
    } else {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Ukuran berkas tidak boleh melebihi 10MB");
        return;
      }
    }
    // ##################
    // end authored
    // ##################

    const name = enrollment.participantName || "Peserta";
    const comp = enrollment.companyName || "Perusahaan";
    const extension = file.name.split(".").pop();
    const cleanName = `${label}_${name}_${comp}`.replace(
      /[^a-zA-Z0-9_\-\s]/g,
      "",
    );
    const renamedFileName = `${cleanName}.${extension}`;

    const renamedFile = new File([file], renamedFileName, { type: file.type });

    setUploadingState((prev) => ({ ...prev, [type]: true }));
    const formData = new FormData();
    formData.append("file", renamedFile);

    try {
      const res = await uploadMutation.mutateAsync(formData);
      setRevisedFiles((prev) => ({
        ...prev,
        [`${type}Url`]: res.url,
        [`${type}Name`]: res.name,
      }));
      toast.success(`Berkas ${label} berhasil diunggah!`);
    } catch (error) {
      console.error(error);
    } finally {
      setUploadingState((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleSendRevision = () => {
    const payload: any = {
      enrollmentId: enrollment.id,
    };

    if (revisedFiles.employmentLetterUrl) {
      payload.employmentLetterUrl = revisedFiles.employmentLetterUrl;
      payload.employmentLetterName = revisedFiles.employmentLetterName;
    }
    if (revisedFiles.consentLetterUrl) {
      payload.consentLetterUrl = revisedFiles.consentLetterUrl;
      payload.consentLetterName = revisedFiles.consentLetterName;
    }
    if (revisedFiles.diplomaUrl) {
      payload.diplomaUrl = revisedFiles.diplomaUrl;
      payload.diplomaName = revisedFiles.diplomaName;
    }
    // ##################
    // authored (generated by claude, Jun 10 2026 05:25 WITA)
    // ##################
    if (revisedFiles.passPhotoUrl) {
      payload.passPhotoUrl = revisedFiles.passPhotoUrl;
      payload.passPhotoName = revisedFiles.passPhotoName;
    }

    if (
      !payload.employmentLetterUrl &&
      !payload.consentLetterUrl &&
      !payload.diplomaUrl &&
      !payload.passPhotoUrl
    ) {
      toast.error(
        "Silakan unggah minimal satu berkas revisi sebelum mengirim.",
      );
      return;
    }
    // ##################
    // end authored
    // ##################

    updateDocsMutation.mutate(payload);
  };

  // Status visual mapping helper
  const getStatusBadgeAndAlert = (status: string) => {
    switch (status) {
      case "verified":
        return {
          badge: (
            <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">
              Terdaftar
            </Badge>
          ),
          alert: (
            <div className="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div className="text-xs leading-relaxed font-semibold">
                Selamat! Pendaftaran Bimtek Anda telah disetujui. Anda resmi
                terdaftar sebagai peserta.
              </div>
            </div>
          ),
        };
      case "rejected_needs_revision":
        return {
          badge: (
            <Badge className="bg-amber-500 text-white hover:bg-amber-600">
              Perbaiki Berkas
            </Badge>
          ),
          alert: (
            <div className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-4 text-amber-800">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold">Revisi Berkas Diperlukan:</span>
                <p className="mt-1 font-medium whitespace-pre-wrap text-slate-700">
                  {enrollment.rejectionReason ||
                    "Mohon periksa kembali berkas persyaratan Anda."}
                </p>
              </div>
            </div>
          ),
        };
      case "rejected_ineligible":
        return {
          badge: (
            <Badge className="bg-rose-500 text-white hover:bg-rose-600">
              Tidak Memenuhi Syarat
            </Badge>
          ),
          alert: (
            <div className="flex gap-3 rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-rose-800">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold">Pendaftaran Ditolak:</span>
                <p className="mt-1 font-medium whitespace-pre-wrap text-slate-700">
                  {enrollment.rejectionReason ||
                    "Maaf, Anda belum memenuhi kualifikasi program Bimtek ini."}
                </p>
              </div>
            </div>
          ),
        };
      case "pending":
      default:
        return {
          badge: (
            <Badge className="bg-blue-500 text-white hover:bg-blue-600">
              Menunggu Verifikasi
            </Badge>
          ),
          alert: (
            <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-blue-800">
              <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-[#1061D6]" />
              <div className="text-xs leading-relaxed font-semibold">
                Berkas pendaftaran sedang dalam proses peninjauan oleh tim
                admin. Mohon tunggu proses validasi data Anda.
              </div>
            </div>
          ),
        };
    }
  };

  const statusInfo = getStatusBadgeAndAlert(enrollment.verificationStatus);

  // Format Date Range helper
  const formatDateRange = () => {
    if (!enrollment.pelatihan?.startDate) return "-";
    const start = new Date(enrollment.pelatihan.startDate);
    const end = enrollment.pelatihan.endDate
      ? new Date(enrollment.pelatihan.endDate)
      : null;

    const opt: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    if (!end) return start.toLocaleDateString("id-ID", opt);

    return `${start.toLocaleDateString("id-ID", { day: "numeric" })} - ${end.toLocaleDateString("id-ID", opt)}`;
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-[#1061D6]/10">
      {/* Title Header */}
      <div className="flex flex-col justify-between gap-3 border-b border-slate-50 pb-4 sm:flex-row sm:items-start">
        <div className="space-y-1">
          <h4 className="font-['Plus_Jakarta_Sans'] text-base leading-tight font-bold text-slate-800">
            {enrollment.pelatihan?.title}
          </h4>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-400">
            <span>📅 {formatDateRange()}</span>
            {enrollment.pelatihan?.location && (
              <span>📍 {enrollment.pelatihan.location}</span>
            )}
          </div>
        </div>
        <div className="shrink-0">{statusInfo.badge}</div>
      </div>

      {/* Alert Message Box */}
      {statusInfo.alert}

      {/* Accordions */}
      <div className="flex flex-wrap gap-2 pt-2">
        {enrollment.verificationStatus === "verified" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowDocs(!showDocs)}
            className="flex items-center gap-1.5 rounded-xl border-slate-200 text-xs font-bold text-slate-700"
          >
            <Eye className="h-3.5 w-3.5" /> Lihat Berkas{" "}
            {showDocs ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        )}

        {enrollment.verificationStatus === "rejected_needs_revision" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowRevision(!showRevision)}
            className="flex items-center gap-1.5 rounded-xl border-amber-200 bg-amber-50/30 text-xs font-bold text-amber-700 hover:bg-amber-50"
          >
            <Upload className="h-3.5 w-3.5" /> Perbaiki Berkas{" "}
            {showRevision ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowCompany(!showCompany)}
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#1061D6]"
        >
          Data Registrasi{" "}
          {showCompany ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Document Viewer Accordion */}
      {showDocs && enrollment.verificationStatus === "verified" && (
        <div className="mt-3 space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <p className="font-['Plus_Jakarta_Sans'] text-xs font-bold text-slate-700">
            Berkas Terverifikasi:
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {enrollment.employmentLetterUrl && (
              <a
                href={enrollment.employmentLetterUrl}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-3 transition-all hover:border-[#1061D6]/20"
              >
                <FileText className="h-5 w-5 shrink-0 text-[#1061D6]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-700">
                    SK Kerja
                  </p>
                  <p className="truncate text-[10px] font-semibold text-slate-400">
                    {enrollment.employmentLetterName || "Buka berkas"}
                  </p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#1061D6]" />
              </a>
            )}

            {enrollment.consentLetterUrl && (
              <a
                href={enrollment.consentLetterUrl}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-3 transition-all hover:border-[#1061D6]/20"
              >
                <FileText className="h-5 w-5 shrink-0 text-[#1061D6]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-700">
                    Surat Kesediaan
                  </p>
                  <p className="truncate text-[10px] font-semibold text-slate-400">
                    {enrollment.consentLetterName || "Buka berkas"}
                  </p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#1061D6]" />
              </a>
            )}

            {enrollment.diplomaUrl && (
              <a
                href={enrollment.diplomaUrl}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-3 transition-all hover:border-[#1061D6]/20"
              >
                <FileText className="h-5 w-5 shrink-0 text-[#1061D6]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-700">
                    Ijazah
                  </p>
                  <p className="truncate text-[10px] font-semibold text-slate-400">
                    {enrollment.diplomaName || "Buka berkas"}
                  </p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#1061D6]" />
              </a>
            )}

            {enrollment.passPhotoUrl && (
              <a
                href={enrollment.passPhotoUrl}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-3 transition-all hover:border-[#1061D6]/20"
              >
                <FileText className="h-5 w-5 shrink-0 text-[#1061D6]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-700">
                    Pass Foto
                  </p>
                  <p className="truncate text-[10px] font-semibold text-slate-400">
                    {enrollment.passPhotoName || "Buka berkas"}
                  </p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#1061D6]" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Revision Form Accordion */}
      {showRevision &&
        enrollment.verificationStatus === "rejected_needs_revision" && (
          <div className="mt-3 space-y-4 rounded-xl border border-amber-100 bg-amber-50/10 p-4">
            <p className="font-['Plus_Jakarta_Sans'] text-xs font-bold text-amber-800">
              Silakan unggah berkas pengganti:
            </p>

            <div className="space-y-3">
              {/* SK Kerja Revision */}
              <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-700">
                    Surat Keterangan Kerja
                  </p>
                  <p className="max-w-[200px] truncate text-[10px] text-slate-400">
                    Saat ini: {enrollment.employmentLetterName || "Belum ada"}
                  </p>
                  {revisedFiles.employmentLetterName && (
                    <p className="mt-1 text-[10px] font-bold text-emerald-600">
                      Baru: {revisedFiles.employmentLetterName}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  <input
                    type="file"
                    id={`rev-sk-${enrollment.id}`}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) =>
                      handleUploadRevisedFile(
                        e,
                        "employmentLetter",
                        "Surat Keterangan Kerja",
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingState.employmentLetter}
                    onClick={() =>
                      document
                        .getElementById(`rev-sk-${enrollment.id}`)
                        ?.click()
                    }
                    className="flex h-8 items-center gap-1.5 rounded-lg border-dashed border-[#1061D6]/30 text-[11px] text-[#1061D6] hover:bg-blue-50/50"
                  >
                    {uploadingState.employmentLetter ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Upload className="h-3 w-3" />
                    )}
                    Pilih File
                  </Button>
                </div>
              </div>

              {/* Surat Kesediaan Revision */}
              <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-700">
                    Surat Pernyataan Kesediaan
                  </p>
                  <p className="max-w-[200px] truncate text-[10px] text-slate-400">
                    Saat ini: {enrollment.consentLetterName || "Belum ada"}
                  </p>
                  {revisedFiles.consentLetterName && (
                    <p className="mt-1 text-[10px] font-bold text-emerald-600">
                      Baru: {revisedFiles.consentLetterName}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  <input
                    type="file"
                    id={`rev-sper-${enrollment.id}`}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) =>
                      handleUploadRevisedFile(
                        e,
                        "consentLetter",
                        "Surat Pernyataan Kesediaan",
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingState.consentLetter}
                    onClick={() =>
                      document
                        .getElementById(`rev-sper-${enrollment.id}`)
                        ?.click()
                    }
                    className="flex h-8 items-center gap-1.5 rounded-lg border-dashed border-[#1061D6]/30 text-[11px] text-[#1061D6] hover:bg-blue-50/50"
                  >
                    {uploadingState.consentLetter ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Upload className="h-3 w-3" />
                    )}
                    Pilih File
                  </Button>
                </div>
              </div>

              {/* Ijazah Revision */}
              <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-700">
                    Ijazah Terakhir
                  </p>
                  <p className="max-w-[200px] truncate text-[10px] text-slate-400">
                    Saat ini: {enrollment.diplomaName || "Belum ada"}
                  </p>
                  {revisedFiles.diplomaName && (
                    <p className="mt-1 text-[10px] font-bold text-emerald-600">
                      Baru: {revisedFiles.diplomaName}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  <input
                    type="file"
                    id={`rev-ijaz-${enrollment.id}`}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) =>
                      handleUploadRevisedFile(e, "diploma", "Ijazah Terakhir")
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingState.diploma}
                    onClick={() =>
                      document
                        .getElementById(`rev-ijaz-${enrollment.id}`)
                        ?.click()
                    }
                    className="flex h-8 items-center gap-1.5 rounded-lg border-dashed border-[#1061D6]/30 text-[11px] text-[#1061D6] hover:bg-blue-50/50"
                  >
                    {uploadingState.diploma ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Upload className="h-3 w-3" />
                    )}
                    Pilih File
                  </Button>
                </div>
              </div>

              {/* Pass Foto Revision */}
              {/* ##################
                  authored (generated by claude, Jun 10 2026 05:25 WITA)
              ################## */}
              <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-700">
                    Pass Foto Latar Merah
                  </p>
                  <p className="max-w-[200px] truncate text-[10px] text-slate-400">
                    Saat ini: {enrollment.passPhotoName || "Belum ada"}
                  </p>
                  {revisedFiles.passPhotoName && (
                    <p className="mt-1 text-[10px] font-bold text-emerald-600">
                      Baru: {revisedFiles.passPhotoName}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  <input
                    type="file"
                    id={`rev-photo-${enrollment.id}`}
                    accept="image/jpeg,image/png,image/jpg"
                    className="hidden"
                    onChange={(e) =>
                      handleUploadRevisedFile(
                        e,
                        "passPhoto",
                        "Pass Foto Latar Merah",
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingState.passPhoto}
                    onClick={() =>
                      document
                        .getElementById(`rev-photo-${enrollment.id}`)
                        ?.click()
                    }
                    className="flex h-8 items-center gap-1.5 rounded-lg border-dashed border-[#1061D6]/30 text-[11px] text-[#1061D6] hover:bg-blue-50/50"
                  >
                    {uploadingState.passPhoto ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Upload className="h-3 w-3" />
                    )}
                    Pilih File
                  </Button>
                </div>
              </div>
              {/* ##################
                  end authored
              ################## */}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowRevision(false)}
                className="h-9 rounded-xl text-xs"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSendRevision}
                disabled={
                  updateDocsMutation.isPending ||
                  (!revisedFiles.employmentLetterUrl &&
                    !revisedFiles.consentLetterUrl &&
                    !revisedFiles.diplomaUrl &&
                    !revisedFiles.passPhotoUrl)
                }
                className="flex h-9 items-center gap-1.5 rounded-xl bg-[#1061D6] text-xs text-white hover:bg-blue-600"
              >
                {updateDocsMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
                Kirim Ulang Berkas
              </Button>
            </div>
          </div>
        )}

      {/* Company details Accordion */}
      {showCompany && (
        <div className="mt-3 space-y-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Data Diri */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1061D6]">
                <User className="h-3.5 w-3.5" />
                <span>Data Diri Peserta</span>
              </div>
              <div className="space-y-1.5 text-xs font-medium text-slate-600">
                <div>
                  <span className="text-slate-400">Nama:</span>{" "}
                  {enrollment.participantName}
                </div>
                <div>
                  <span className="text-slate-400">NIK:</span>{" "}
                  {enrollment.participantNik}
                </div>
                <div>
                  <span className="text-slate-400">TTL:</span>{" "}
                  {enrollment.participantBirthPlace},{" "}
                  {enrollment.participantBirthDate
                    ? new Date(
                        enrollment.participantBirthDate,
                      ).toLocaleDateString("id-ID")
                    : "-"}
                </div>
                <div>
                  <span className="text-slate-400">Email:</span>{" "}
                  {enrollment.participantEmail}
                </div>
                <div>
                  <span className="text-slate-400">No HP:</span>{" "}
                  {enrollment.participantPhone}
                </div>
                <div className="line-clamp-2">
                  <span className="text-slate-400">Alamat:</span>{" "}
                  {enrollment.participantAddress}
                </div>
              </div>
            </div>

            {/* Data Perusahaan */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1061D6]">
                <Building2 className="h-3.5 w-3.5" />
                <span>Data Perusahaan</span>
              </div>
              <div className="space-y-1.5 text-xs font-medium text-slate-600">
                <div>
                  <span className="text-slate-400">Perusahaan:</span>{" "}
                  {enrollment.companyName}
                </div>
                <div>
                  <span className="text-slate-400">KBLI:</span>{" "}
                  {enrollment.companyKbli}
                </div>
                <div>
                  <span className="text-slate-400">Provinsi:</span>{" "}
                  {enrollment.companyProvince?.name || "-"}
                </div>
                <div>
                  <span className="text-slate-400">Kab/Kota:</span>{" "}
                  {enrollment.companyRegency?.name || "-"}
                </div>
                <div>
                  <span className="text-slate-400">Kecamatan:</span>{" "}
                  {enrollment.companyDistrict?.name || "-"}
                </div>
                <div className="line-clamp-2">
                  <span className="text-slate-400">Alamat:</span>{" "}
                  {enrollment.companyAddress}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ##################
// end authored
// ##################

// ##################
// authored (generated by claude, Jun 10 2026 05:25 WITA)
// ##################

/**
 * Komponen untuk mengunggah dan mengelola Pass Foto Latar Merah milik pengguna.
 */
function PassPhotoUploadCard() {
  const { data: documents, refetch } = useQuery(
    trpc.pelatihan.profile.getMyDocuments.queryOptions(),
  );

  const passPhoto = documents?.find((doc: any) => doc.type === "pass_photo");
  const uploadMutation = useMutation(
    trpc.pelatihan.profile.uploadDocument.mutationOptions({
      onSuccess: () => {
        toast.success("Pass foto berhasil diunggah!");
        refetch();
      },
      onError: (err) => {
        toast.error(`Gagal mengunggah pass foto: ${err.message}`);
      },
    }),
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      toast.error("Format file harus gambar (JPG, JPEG, PNG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran pass foto maksimal 5MB");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "pass_photo");

    try {
      await uploadMutation.mutateAsync(formData);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-slate-800">
          Pass Foto Latar Merah
        </CardTitle>
        <CardDescription className="font-['Poppins'] text-xs">
          Unggah pass foto resmi berlatar belakang merah untuk keperluan
          sertifikat & verifikasi program K3.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
          <div className="relative flex h-40 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
            <ImageWithFallback
              src={passPhoto?.fileUrl ?? ""}
              alt="Pass Foto Latar Merah"
              imgClassName="h-full w-full object-cover"
            />

            {passPhoto?.fileUrl && (
              <div className="pointer-events-none absolute inset-0 bg-red-600/10 mix-blend-multiply" />
            )}
          </div>

          <div className="flex flex-1 flex-col justify-between py-1 text-center sm:text-left">
            <div className="space-y-2">
              <h4 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-slate-700">
                {passPhoto?.fileUrl
                  ? "Pass Foto Terunggah"
                  : "Unggah Pass Foto Baru"}
              </h4>
              <ul className="list-inside list-disc space-y-1 text-left text-[11px] leading-relaxed text-slate-500">
                <li>Latar belakang berwarna merah polos</li>
                <li>Wajah terlihat jelas (menghadap ke depan)</li>
                <li>Format file: JPG, JPEG, atau PNG</li>
                <li>Ukuran file maksimal 5MB</li>
              </ul>
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
              <Button
                type="button"
                variant={passPhoto?.fileUrl ? "outline" : "default"}
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={cn(
                  "h-9 rounded-xl text-xs font-semibold",
                  !passPhoto?.fileUrl &&
                    "bg-[#1061D6] text-white hover:bg-blue-600",
                )}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Mengunggah...
                  </>
                ) : passPhoto?.fileUrl ? (
                  "Ganti Foto"
                ) : (
                  "Pilih & Unggah Foto"
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ##################
// end authored
// ##################
