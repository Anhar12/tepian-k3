import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SkeletonButton,
  SkeletonInput,
} from "@/components/ui/skeleton-generator";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { queryClient, trpc } from "@/utils/trpc";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type PermissionAction, type Resource } from "@tepian-k3/constants";
import { Check, Info, LoaderCircle, Search, Shield } from "lucide-react";
import { useMemo, useState } from "react";
import z from "zod";

// Keyed by `Resource` from @tepian-k3/constants — TypeScript enforces all resources have labels.
const RESOURCE_LABELS: Record<Resource, { title: string; category: string }> = {
  users: { title: "Akun Pengguna", category: "Pengguna & Keamanan" },
  roles: { title: "Peran / Hak Akses (Role)", category: "Pengguna & Keamanan" },
  permissions: {
    title: "Izin Detail (Permission)",
    category: "Pengguna & Keamanan",
  },
  "role-permissions": {
    title: "Pemetaan Izin Role",
    category: "Pengguna & Keamanan",
  },
  "user-permissions": {
    title: "Izin Spesifik Pengguna",
    category: "Pengguna & Keamanan",
  },
  "pengujian-import-export": {
    title: "Import / Export Data Master",
    category: "Master Data Pengujian",
  },

  tools: { title: "Alat Laboratorium", category: "Inventaris & Alat Lab" },
  "tool-codes": { title: "Kode Alat Lab", category: "Inventaris & Alat Lab" },
  "tool-calibrations": {
    title: "Kalibrasi Alat",
    category: "Inventaris & Alat Lab",
  },
  "tool-checks": {
    title: "Pemeriksaan Alat",
    category: "Inventaris & Alat Lab",
  },
  "tool-certifications": {
    title: "Sertifikasi Alat",
    category: "Inventaris & Alat Lab",
  },
  "tool-documentations": {
    title: "Dokumen Alat",
    category: "Inventaris & Alat Lab",
  },
  "chemical-materials": {
    title: "Bahan Kimia",
    category: "Inventaris & Alat Lab",
  },
  clusters: {
    title: "Klaster Alat & Parameter",
    category: "Inventaris & Alat Lab",
  },

  "parameter-categories": {
    title: "Kategori Parameter",
    category: "Parameter Pengujian",
  },
  parameters: { title: "Parameter Uji K3", category: "Parameter Pengujian" },
  "parameter-tool": {
    title: "Hubungan Parameter & Alat",
    category: "Parameter Pengujian",
  },
  "parameter-chemical-material": {
    title: "Hubungan Parameter & Bahan Kimia",
    category: "Parameter Pengujian",
  },

  provinces: { title: "Provinsi", category: "Wilayah Geografis" },
  regency: { title: "Kabupaten / Kota", category: "Wilayah Geografis" },
  district: { title: "Kecamatan", category: "Wilayah Geografis" },
  village: { title: "Kelurahan / Desa", category: "Wilayah Geografis" },
  kbli: { title: "Klasifikasi Industri (KBLI)", category: "Wilayah Geografis" },

  "user-company": {
    title: "Profil Perusahaan Mitra",
    category: "Manajemen Perusahaan",
  },
  "user-company-testing-location": {
    title: "Lokasi Pengujian Perusahaan",
    category: "Manajemen Perusahaan",
  },

  banners: { title: "Banner Informasi", category: "Konten & Informasi Web" },
  news: { title: "Berita & Pengumuman", category: "Konten & Informasi Web" },
  "media-publications": {
    title: "Media & Publikasi",
    category: "Konten & Informasi Web",
  },
  "ppid-documents": {
    title: "Dokumen Regulasi PPID",
    category: "PPID & Layanan Publik",
  },
  "ppid-submissions": {
    title: "Permohonan Tiket PPID",
    category: "PPID & Layanan Publik",
  },

  cart: { title: "Keranjang Belanja", category: "Pemesanan & Keuangan" },
  orders: { title: "Daftar Pesanan", category: "Pemesanan & Keuangan" },
  "orders-approval": {
    title: "Persetujuan Pesanan",
    category: "Pemesanan & Keuangan",
  },
  "orders-payment": {
    title: "Verifikasi Pembayaran",
    category: "Pemesanan & Keuangan",
  },
  "order-items": {
    title: "Detail Item Pesanan",
    category: "Pemesanan & Keuangan",
  },
  "order-status-history": {
    title: "Riwayat Status Pesanan",
    category: "Pemesanan & Keuangan",
  },

  testing: { title: "Proses Pengujian Lab", category: "Proses Lab K3" },
  "testing-item": { title: "Item Pengujian Lab", category: "Proses Lab K3" },

  documents: { title: "Semua Dokumen K3", category: "Dokumen & Verifikasi" },
  "document-signature": {
    title: "Tanda Tangan Dokumen",
    category: "Dokumen & Verifikasi",
  },
  "document-verifications": {
    title: "Verifikasi Dokumen (QR Scan)",
    category: "Dokumen & Verifikasi",
  },
  "documents-penawaran": {
    title: "Surat Penawaran",
    category: "Dokumen & Verifikasi",
  },
  "documents-spk": {
    title: "SPK (Surat Perintah Kerja)",
    category: "Dokumen & Verifikasi",
  },
  "documents-invoice": {
    title: "Invoice / Tagihan",
    category: "Dokumen & Verifikasi",
  },
  "documents-spt": {
    title: "SPT (Surat Perintah Tugas)",
    category: "Dokumen & Verifikasi",
  },

  audits: {
    title: "Catatan Aktivitas (Audit Logs)",
    category: "Sistem & Keamanan",
  },
  notifications: { title: "Sistem Notifikasi", category: "Sistem & Keamanan" },
  logs: { title: "Log Server", category: "Sistem & Keamanan" },

  positions: { title: "Jabatan Karyawan", category: "Kepegawaian" },
  employees: { title: "Profil Karyawan K3", category: "Kepegawaian" },

  worksheets: {
    title: "Lembar Kerja (Worksheet)",
    category: "Lembar Kerja Karyawan",
  },
  "worksheets-status": {
    title: "Perubahan Status Lembar Kerja",
    category: "Lembar Kerja Karyawan",
  },
  "worksheets-parameters": {
    title: "Parameter Lembar Kerja",
    category: "Lembar Kerja Karyawan",
  },
  "worksheets-personnel-assignments": {
    title: "Penugasan Personel Lab",
    category: "Lembar Kerja Karyawan",
  },
  "worksheets-transaction-details": {
    title: "Detail Transaksi Lembar Kerja",
    category: "Lembar Kerja Karyawan",
  },
  "worksheet-items": {
    title: "Item Lembar Kerja",
    category: "Lembar Kerja Karyawan",
  },
  "worksheet-tools": {
    title: "Alat dalam Lembar Kerja",
    category: "Lembar Kerja Karyawan",
  },
  "worksheet-notes": {
    title: "Catatan Lembar Kerja",
    category: "Lembar Kerja Karyawan",
  },
  "worksheet-assignments": {
    title: "Riwayat Penugasan Lembar Kerja",
    category: "Lembar Kerja Karyawan",
  },
  "worksheet-chemical-materials": {
    title: "Bahan Kimia Lembar Kerja",
    category: "Lembar Kerja Karyawan",
  },

  pelatihan: {
    title: "Program Pelatihan",
    category: "Pelatihan & Sertifikasi",
  },
  "pelatihan-categories": {
    title: "Kategori Pelatihan",
    category: "Pelatihan & Sertifikasi",
  },
  "pelatihan-cart": {
    title: "Keranjang Pelatihan",
    category: "Pelatihan & Sertifikasi",
  },
  "pelatihan-materials": {
    title: "Materi Pelatihan",
    category: "Pelatihan & Sertifikasi",
  },
  "pelatihan-assessments": {
    title: "Assessment Pelatihan",
    category: "Pelatihan & Sertifikasi",
  },
  "pelatihan-questions": {
    title: "Pertanyaan Assessment",
    category: "Pelatihan & Sertifikasi",
  },
  "pelatihan-enrollments": {
    title: "Pendaftaran Pelatihan",
    category: "Pelatihan & Sertifikasi",
  },
  "pelatihan-progress": {
    title: "Progres Pelatihan",
    category: "Pelatihan & Sertifikasi",
  },
  "pelatihan-assessment-attempts": {
    title: "Percobaan Assessment",
    category: "Pelatihan & Sertifikasi",
  },
  "pelatihan-certificates": {
    title: "Sertifikat Pelatihan",
    category: "Pelatihan & Sertifikasi",
  },

  "survey-questions": {
    title: "Pertanyaan Survei Kepuasan",
    category: "Survei & Kepuasan",
  },
  "survey-responses": {
    title: "Jawaban Survei Kepuasan",
    category: "Survei & Kepuasan",
  },
  "survey-feedback": {
    title: "Umpan Balik Survei",
    category: "Survei & Kepuasan",
  },
};

const ACTION_LABELS: Record<PermissionAction, string> = {
  view: "Melihat",
  read: "Membaca Detail",
  create: "Membuat Baru",
  update: "Mengubah (Edit)",
  delete: "Menghapus",
  approve: "Menyetujui",
  verify: "Memverifikasi",
  review: "Meninjau",
  reject: "Menolak",
};

export const Route = createFileRoute(
  "/(core)/back-office/roles/$roleId/detail",
)({
  params: z.object({
    roleId: z.uuidv7(),
  }),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "roles.read" }),
  loader: async ({ context, params }) => {
    context.queryClient.ensureQueryData(
      context.trpc.platform.role.getRoleWithPermissionsById.queryOptions({
        id: params.roleId,
      }),
    );

    context.queryClient.ensureQueryData(
      context.trpc.platform.permission.getAllPermissions.queryOptions(),
    );
  },
  head: () => pageHead("Detail Role"),
  component: RouteComponent,
  pendingComponent: LoaderComponent,
});

function LoaderComponent() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Detail Role & Izin: </CardTitle>
          <CardDescription>
            Kelola izin yang dimiliki oleh role ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <SkeletonInput className="mb-6 h-10 w-full" />

            <SkeletonButton className="w-full" />

            <Skeleton className="h-48 w-full" />

            <SkeletonButton className="w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function RouteComponent() {
  const { roleId } = Route.useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 3;

  const { data: role } = useSuspenseQuery(
    trpc.platform.role.getRoleWithPermissionsById.queryOptions({ id: roleId }),
  );

  const { data: allPermissions } = useSuspenseQuery(
    trpc.platform.permission.getAllPermissions.queryOptions(),
  );

  // Store original permissions as a Set for O(1) lookups
  const originalPermissions = useMemo(
    () => new Set(role?.permissions || []),
    [role?.permissions],
  );

  // Track current selected permissions
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    () => new Set(role?.permissions || []),
  );

  // Group and search permissions in a nested structure
  const groupedPermissions = useMemo(() => {
    const categories: Record<
      string,
      Record<
        string,
        Array<{
          id: string;
          name: string;
          rawAction: string;
          friendlyAction: string;
        }>
      >
    > = {};

    allPermissions.forEach((p) => {
      const parts = p.name.split(".");
      const resource = parts[0] || "";
      const rawAction = parts[1] || "";

      const resourceMeta = RESOURCE_LABELS[resource as Resource] || {
        title: resource,
        category: "Kategori Lainnya",
      };

      const category = resourceMeta.category;
      const resourceTitle = resourceMeta.title;
      const friendlyAction =
        ACTION_LABELS[rawAction as PermissionAction] || rawAction;

      // Filter based on search query (matches raw keys, translated keys, categories, or actions)
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resourceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friendlyAction.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return;

      if (!categories[category]) {
        categories[category] = {};
      }
      if (!categories[category][resource]) {
        categories[category][resource] = [];
      }

      categories[category][resource].push({
        id: p.id,
        name: p.name,
        rawAction,
        friendlyAction,
      });
    });

    return categories;
  }, [allPermissions, searchQuery]);

  // Derive pagination and selection stats
  const totalPages = useMemo(() => {
    return Math.ceil(Object.keys(groupedPermissions).length / ITEMS_PER_PAGE);
  }, [groupedPermissions]);

  const activePage = useMemo(() => {
    return Math.min(Math.max(1, currentPage), totalPages || 1);
  }, [currentPage, totalPages]);

  const paginatedCategories = useMemo(() => {
    return Object.entries(groupedPermissions).slice(
      (activePage - 1) * ITEMS_PER_PAGE,
      activePage * ITEMS_PER_PAGE,
    );
  }, [groupedPermissions, activePage]);

  const selectionStats = useMemo(() => {
    let total = 0;
    let selected = 0;

    allPermissions.forEach((p) => {
      total++;
      if (selectedPermissions.has(p.name)) {
        selected++;
      }
    });

    return {
      total,
      selected,
      percentage: total > 0 ? Math.round((selected / total) * 100) : 0,
    };
  }, [allPermissions, selectedPermissions]);

  // Derive added/removed permissions when needed
  const { addedPermissions, removedPermissions, hasChanges } = useMemo(() => {
    const added = [...selectedPermissions].filter(
      (perm) => !originalPermissions.has(perm),
    );
    const removed = [...originalPermissions].filter(
      (perm) => !selectedPermissions.has(perm),
    );
    return {
      addedPermissions: added,
      removedPermissions: removed,
      hasChanges: added.length > 0 || removed.length > 0,
    };
  }, [selectedPermissions, originalPermissions]);

  const updateRolePermissionsMutation = useMutation(
    trpc.platform.permission.updateRolePermissions.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.platform.role.getRoleWithPermissionsById.queryOptions({
            id: roleId,
          }),
        );
        await queryClient.refetchQueries(
          trpc.platform.role.getRoleWithPermissionsById.queryOptions({
            id: roleId,
          }),
        );
        globalSuccessToast("Berhasil memperbarui izin role.");
      },
      onError: (error) => {
        globalErrorToast("Gagal memperbarui izin role: " + error.message);
      },
    }),
  );

  // Check if all permissions are selected
  const allSelected = useMemo(
    () =>
      allPermissions.length > 0 &&
      allPermissions.every((p) => selectedPermissions.has(p.name)),
    [allPermissions, selectedPermissions],
  );

  function handleToggleAllPermissions() {
    if (allSelected) {
      setSelectedPermissions(new Set());
    } else {
      setSelectedPermissions(new Set(allPermissions.map((p) => p.name)));
    }
  }

  // Toggles all permissions in a specific resource
  function handleToggleResourcePermissions(
    _resourceName: string,
    permissions: Array<{ name: string }>,
  ) {
    const allOfResourceSelected = permissions.every((p) =>
      selectedPermissions.has(p.name),
    );
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      permissions.forEach((p) => {
        if (allOfResourceSelected) {
          next.delete(p.name);
        } else {
          next.add(p.name);
        }
      });
      return next;
    });
  }

  // Toggles all permissions in a specific business category
  function handleToggleCategoryPermissions(
    categoryPermissions: Array<{ name: string }>,
  ) {
    const allOfCategorySelected = categoryPermissions.every((p) =>
      selectedPermissions.has(p.name),
    );
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      categoryPermissions.forEach((p) => {
        if (allOfCategorySelected) {
          next.delete(p.name);
        } else {
          next.add(p.name);
        }
      });
      return next;
    });
  }

  function handleOnPermissionChange(
    permissionName: string,
    isChecked: boolean,
  ) {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (isChecked) {
        next.add(permissionName);
      } else {
        next.delete(permissionName);
      }
      return next;
    });
  }

  function handleUpdatePermissions() {
    updateRolePermissionsMutation.mutate({
      roleId: role.id,
      addedPermissions,
      removedPermissions,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-neutral-100 shadow-xl shadow-neutral-100/30">
        <CardHeader className="rounded-t-xl bg-linear-to-r from-blue-50/50 to-indigo-50/20 pb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-600 p-2 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight text-neutral-800">
                Pengaturan Izin & Hak Akses:{" "}
                <span className="font-extrabold text-blue-600">
                  {role.name}
                </span>
              </CardTitle>
              <CardDescription className="mt-1 text-neutral-500">
                Kelola hak akses detail karyawan.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6">
            {/* Form Input Detail Role */}
            <div className="grid grid-cols-1 items-center gap-4 rounded-xl border border-neutral-100 bg-neutral-50 p-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="ml-0.5 text-xs font-extrabold tracking-wider text-neutral-600 uppercase">
                  Nama Peran Karyawan (Role Key)
                </Label>
                <Input
                  type="text"
                  className="h-10 border-neutral-200 bg-white font-mono text-sm font-semibold text-neutral-700"
                  value={role.name}
                  disabled
                  readOnly
                />
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-xs text-neutral-500 md:mt-0">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <p>
                  Peran ini menentukan hak kerja untuk divisi{" "}
                  <strong>{role.name}</strong>. Anda dapat menyaring fungsi dan
                  mencentang izin spesifik di bawah ini.
                </p>
              </div>
            </div>

            {/* Visual Selection Stats Card */}
            <div className="rounded-xl border border-neutral-200/60 bg-linear-to-br from-white to-neutral-50/50 p-4 shadow-sm">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <span className="text-xs font-extrabold tracking-wider text-neutral-500 uppercase">
                    Statistik Hak Akses Terpilih
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-neutral-800">
                      {selectionStats.selected}
                    </span>
                    <span className="text-sm font-semibold text-neutral-500">
                      dari {selectionStats.total} izin aktif
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-blue-600">
                      {selectionStats.percentage}%
                    </span>
                    <span className="block text-xs font-semibold text-neutral-400">
                      Cakupan Izin
                    </span>
                  </div>
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-linear-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                  style={{ width: `${selectionStats.percentage}%` }}
                />
              </div>

              {/* Security Warning Alert for JWT Caching */}
              <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-100 bg-amber-50/40 p-3 text-[11px] leading-relaxed font-medium text-amber-700">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p>
                  <strong>Catatan Keamanan:</strong> Karyawan yang sedang login{" "}
                  <strong>wajib logout dan login kembali</strong> untuk
                  mengaktifkan perubahan hak akses baru ini.
                </p>
              </div>
            </div>

            {/* Bilah Pencarian & Tombol Global */}
            <div className="flex flex-col items-center justify-between gap-3 rounded-lg border border-neutral-100 bg-white p-3 sm:flex-row">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="Cari modul atau hak akses (misal: 'User', 'Kalibrasi', 'Hapus')..."
                  className="h-10 border-neutral-200 pl-9 text-sm focus-visible:ring-blue-600"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-full text-xs font-bold transition-all sm:w-auto"
                  disabled={!hasChanges}
                  onClick={() =>
                    setSelectedPermissions(new Set(role?.permissions || []))
                  }
                >
                  Kembalikan ke Semula
                </Button>
                <Button
                  variant={allSelected ? "destructive" : "outline"}
                  size="sm"
                  className="h-10 w-full text-xs font-bold transition-all sm:w-auto"
                  onClick={handleToggleAllPermissions}
                >
                  {allSelected
                    ? "Batalkan Semua Pilihan"
                    : "Pilih Semua Hak Akses"}
                </Button>
              </div>
            </div>

            {/* Kontainer Utama Permissions */}
            <div className="custom-scrollbar max-h-80 space-y-6 overflow-y-auto pr-2 sm:max-h-105 md:max-h-137.5">
              {paginatedCategories.length > 0 ? (
                paginatedCategories.map(([category, resources]) => {
                  // Collect all permission items in this category for category-level select-all
                  const categoryPermissionList =
                    Object.values(resources).flat();
                  const isAllOfCategorySelected = categoryPermissionList.every(
                    (p) => selectedPermissions.has(p.name),
                  );

                  return (
                    <div
                      key={category}
                      className="block overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm transition-all hover:shadow-md"
                    >
                      {/* Header Kategori Bisnis */}
                      <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-4 py-3">
                        <h3 className="text-sm font-extrabold tracking-wide text-neutral-700">
                          🛡️ {category}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs font-bold text-blue-600 hover:bg-blue-50/50 hover:text-blue-700"
                          onClick={() =>
                            handleToggleCategoryPermissions(
                              categoryPermissionList,
                            )
                          }
                        >
                          {isAllOfCategorySelected
                            ? "Batalkan Semua"
                            : "Pilih Semua"}
                        </Button>
                      </div>

                      {/* Konten Kategori (Daftar Modul / Resource) */}
                      <div className="divide-y divide-neutral-100">
                        {Object.entries(resources).map(
                          ([resource, permissions]) => {
                            const isAllOfResourceSelected = permissions.every(
                              (p) => selectedPermissions.has(p.name),
                            );
                            const friendlyTitle =
                              RESOURCE_LABELS[resource as Resource]?.title ||
                              resource;

                            return (
                              <div
                                key={resource}
                                className="flex flex-col justify-between gap-3 px-4 py-4 transition-colors hover:bg-neutral-50/30 lg:flex-row lg:items-center"
                              >
                                {/* Kolom Judul Modul */}
                                <div className="min-w-50">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-neutral-800">
                                      {friendlyTitle}
                                    </span>
                                    <span className="hidden rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-neutral-400 sm:inline">
                                      {resource}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleResourcePermissions(
                                        resource,
                                        permissions,
                                      )
                                    }
                                    className="mt-0.5 block text-left text-xs font-semibold text-blue-500 transition-all hover:underline"
                                  >
                                    {isAllOfResourceSelected
                                      ? "Batalkan Pilihan"
                                      : "Pilih Semua"}
                                  </button>
                                </div>

                                {/* Kolom Checkboxes Hak Akses (Indonesian action labels) */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-6 lg:justify-end">
                                  {permissions.map((permission) => (
                                    <label
                                      key={permission.id}
                                      className="group flex cursor-pointer items-center gap-2 py-1 text-xs text-neutral-600 select-none hover:text-neutral-900"
                                    >
                                      <Checkbox
                                        checked={selectedPermissions.has(
                                          permission.name,
                                        )}
                                        onCheckedChange={(isChecked) =>
                                          handleOnPermissionChange(
                                            permission.name,
                                            isChecked as boolean,
                                          )
                                        }
                                        className="border-neutral-300 transition-all focus-visible:ring-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                                      />
                                      <span className="transition-transform duration-150 group-hover:translate-x-0.5">
                                        {permission.friendlyAction}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 py-10">
                  <Search className="mb-2 h-8 w-8 text-neutral-300" />
                  <p className="text-sm font-medium text-neutral-500">
                    Tidak ada hak akses yang cocok dengan pencarian Anda.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-4 flex flex-col gap-4 border-t border-neutral-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs font-semibold text-neutral-500">
                  Menampilkan halaman{" "}
                  <span className="font-extrabold text-blue-600">
                    {activePage}
                  </span>{" "}
                  dari{" "}
                  <span className="font-extrabold text-neutral-700">
                    {totalPages}
                  </span>{" "}
                  kategori ({Object.keys(groupedPermissions).length} kategori
                  ditemukan)
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg border-neutral-200 px-3 font-bold text-neutral-600 transition-all hover:bg-neutral-50"
                    disabled={activePage === 1}
                    onClick={() => setCurrentPage(activePage - 1)}
                  >
                    Sebelumnya
                  </Button>

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => {
                      // Show maximum of 5 page buttons to prevent layout overflow
                      if (
                        totalPages > 5 &&
                        Math.abs(page - activePage) > 1 &&
                        page !== 1 &&
                        page !== totalPages
                      ) {
                        if (page === 2 || page === totalPages - 1) {
                          return (
                            <span
                              key={page}
                              className="px-1 text-xs text-neutral-400 select-none"
                            >
                              ...
                            </span>
                          );
                        }
                        return null;
                      }

                      return (
                        <Button
                          key={page}
                          variant={page === activePage ? "default" : "outline"}
                          size="sm"
                          className={`h-8 w-8 rounded-lg p-0 text-xs font-bold transition-all ${
                            page === activePage
                              ? "bg-blue-600 text-white shadow-md shadow-blue-600/10 hover:bg-blue-700"
                              : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                          }`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      );
                    },
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg border-neutral-200 px-3 font-bold text-neutral-600 transition-all hover:bg-neutral-50"
                    disabled={activePage === totalPages}
                    onClick={() => setCurrentPage(activePage + 1)}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}

            {/* Tombol Simpan Aksi */}
            <Button
              disabled={!hasChanges || updateRolePermissionsMutation.isPending}
              onClick={() => handleUpdatePermissions()}
              className="mt-2 h-11 w-full rounded-xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.99] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none"
            >
              {updateRolePermissionsMutation.isPending ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin text-white" />
              ) : (
                <Check className="mr-2 h-4 w-4 text-white" />
              )}
              Simpan Perubahan Hak Akses
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
