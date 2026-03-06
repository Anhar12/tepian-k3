import type { Permission } from "./permissions";
import { getResourcePermissions, getAllPermissions } from "./permissions";

/**
 * Semua peran sistem yang tersedia.
 *
 * Peran mengelompokkan izin akses untuk berbagai jenis pengguna dalam sistem
 * manajemen layanan pengujian Tepian K3. Setiap peran mencerminkan aktor
 * yang terlibat dalam alur bisnis dari proses pengajuan hingga penyelesaian pengujian.
 */
export const ROLES = [
  "super_admin", // Super Administrator
  "admin", // Administrator Back Office
  "user", // Pengguna Layanan
  "employee", // Karyawan
  "sample_collector", // Petugas Sampling
  "lab_technician", // Laboratorium
  "lab_manager", // Manajer Mutu / Manajer Teknis (sama)
  "kaji_ulang", // Kaji Ulang
  "head_of_institution", // Kepala Balai
  "admin_manager", // Manajer Admin
  "treasurer", // Bendahara Penerimaan
  "penjadwalan", // Penjadwalan
  "equipment_officer", // Peralatan
  "petugas_koding", // Petugas Koding
  "viewer", // Penampil (Hanya Baca)
] as const;

export type Role = (typeof ROLES)[number];

/**
 * Peran yang termasuk dalam sisi karyawan/internal sistem.
 * Digunakan untuk menentukan menu atau sidebar yang ditampilkan bagi pengguna tertentu.
 * Karyawan dengan peran ini mengakses alur back office (Tahap 1–4) dalam proses bisnis.
 */
export const EMPLOYEE_ROLES = [
  "employee",
  "sample_collector",
  "lab_technician",
  "lab_manager",
  "kaji_ulang",
  "head_of_institution",
  "admin_manager",
  "treasurer",
  "penjadwalan",
  "equipment_officer",
  "petugas_koding",
] as const satisfies readonly Role[];

/**
 * Peran yang termasuk dalam sisi back office / administrasi sistem.
 * Pengguna dengan peran ini memiliki akses pengelolaan sistem secara keseluruhan
 * dan tidak terlibat langsung dalam alur pengujian lapangan.
 */
export const BACK_OFFICE_ROLES = [
  "admin",
  "super_admin",
  "viewer",
] as const satisfies readonly Role[];

/**
 * Metadata peran yang mencakup nama, deskripsi, dan daftar izin.
 */
export interface RoleMetadata {
  name: Role;
  description: string;
  permissions: Permission[];
}

/**
 * Deskripsi setiap peran dalam sistem, digunakan untuk tampilan UI dan dokumentasi.
 *
 * Deskripsi mencerminkan tanggung jawab masing-masing aktor dalam alur bisnis
 * layanan digital Tepian K3, mulai dari pengguna layanan hingga proses back office.
 *
 * Alur back office terbagi menjadi 4 tahap:
 * - **Tahap 1** – Admin: menerima dan mendistribusikan permintaan pengujian.
 * - **Tahap 2** – Manajer Teknis/Mutu: mengkaji ulang dan menyetujui/merevisi.
 * - **Tahap 3** – Manajer Adm. & Bendahara: penawaran, kode billing, verifikasi pembayaran.
 * - **Tahap 4** – Kepala Balai: persetujuan final dan penandatanganan SPT.
 */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  /** Super Administrator dengan seluruh izin sistem tanpa pembatasan. */
  super_admin: "Super Administrator dengan semua izin sistem",

  /**
   * Administrator back office yang mengelola permintaan pengujian masuk (Proses Back Office Tahap 1).
   * Bertugas menerima, meninjau, dan meneruskan permintaan ke Manajer Teknis/Mutu,
   * serta mengirimkan format penawaran awal.
   */
  admin:
    "Administrator yang mengelola permintaan pengujian dan proses back office",

  /**
   * Pengguna layanan yang mengakses tepian3.id untuk melakukan transaksi pengujian.
   * Dapat memilih parameter pengujian, melakukan checkout, memantau status pesanan,
   * dan mengunggah bukti pembayaran.
   */
  user: "Pengguna layanan yang dapat membuat pesanan dan memantau status pengujian",

  /** Karyawan internal dengan akses dasar ke alur pengujian. */
  employee: "Karyawan dengan akses dasar ke alur pengujian",

  /**
   * Petugas Sampling yang bertugas di lapangan untuk memastikan ketersediaan alat
   * yang dipinjam dan mengumpulkan sampel di lokasi pengujian sesuai SPT.
   */
  sample_collector:
    "Petugas Sampling yang bertanggung jawab memastikan alat yang dipinjam dan pengumpulan sampel",

  /**
   * Analis Laboratorium yang melakukan pengujian dan analisa laboratorium.
   * Menerima daftar bahan secara otomatis dan menginput hasil pengujian.
   */
  lab_technician:
    "Analis Laboratorium yang melakukan pengujian dan menginput hasil analisa",

  /**
   * Manajer Teknis/Mutu yang mengkaji ulang permintaan pengujian (Proses Back Office Tahap 2).
   * Berwenang menyetujui atau merevisi permintaan, serta merekomendasikan jadwal
   * dan personel pelaksanaan pengujian.
   */
  lab_manager:
    "Manajer Teknis/Mutu yang mengkaji dan menyetujui permintaan pengujian serta merekomendasikan jadwal",

  /**
   * Petugas Kaji Ulang yang bertugas meninjau worksheet dan parameter pengujian
   * yang sedang berjalan. Memiliki akses penuh ke semua sumber daya worksheet,
   * termasuk item, alat, bahan kimia, catatan, penugasan, dan detail transaksi.
   */
  kaji_ulang:
    "Petugas Kaji Ulang dengan akses penuh ke semua sumber daya worksheet dan parameter pengujian",

  /**
   * Kepala Balai dengan otoritas persetujuan final (Proses Back Office Tahap 4).
   * Bertanggung jawab menandatangani SPT (Surat Perintah Tugas), mengirimkan SPT
   * secara otomatis ke petugas, serta memverifikasi SPT akhir.
   */
  head_of_institution:
    "Kepala Balai dengan otoritas persetujuan final dan penandatanganan SPT",

  /**
   * Manajer Administrasi yang menangani sisi administrasi keuangan (Proses Back Office Tahap 3).
   * Bertugas menyusun surat penawaran, menerbitkan kode billing, memverifikasi
   * pembayaran, dan memberikan rekomendasi personel.
   */
  admin_manager:
    "Manajer Administrasi yang menangani surat penawaran, kode billing, dan verifikasi pembayaran",

  /**
   * Bendahara Penerimaan yang bertanggung jawab atas pemrosesan keuangan (Proses Back Office Tahap 3).
   * Menerima penawaran fix, memverifikasi status pembayaran, dan mengelola
   * dokumen keuangan terkait pesanan pengujian.
   */
  treasurer:
    "Bendahara Penerimaan yang bertanggung jawab atas pemrosesan keuangan dan verifikasi pembayaran",

  /**
   * Petugas Peralatan yang mengelola ketersediaan dan peminjaman alat laboratorium.
   * Memastikan alat yang dipinjam sesuai kebutuhan dan daftar alat terkirim secara otomatis.
   */
  equipment_officer:
    "Petugas Peralatan yang mengelola ketersediaan alat dan memastikan bahan yang diminta",

  /**
   * Petugas Penjadwalan yang bertanggung jawab mengatur jadwal dan penugasan personel
   * pada worksheet pengujian. Dapat menetapkan tanggal pelaksanaan, menugaskan karyawan
   * ke worksheet, serta mengunduh dokumen jadwal yang telah ditetapkan.
   */
  penjadwalan:
    "Petugas Penjadwalan yang mengatur jadwal dan penugasan personel pada worksheet pengujian",

  /**
   * Petugas Koding yang bertanggung jawab menginput kode billing pada pesanan pengujian.
   * Bertugas di Proses Back Office Tahap 3 bersama Manajer Admin dan Bendahara,
   * dengan akses untuk melihat dan memperbarui data pesanan terkait kode billing.
   */
  petugas_koding:
    "Petugas Koding yang menginput kode billing pada pesanan pengujian",

  /** Akses hanya baca untuk melihat data sistem tanpa melakukan modifikasi apapun. */
  viewer: "Akses hanya baca untuk melihat data tanpa modifikasi",
};

/**
 * Izin default untuk setiap peran.
 * Ini adalah izin dasar yang diberikan saat sebuah peran dibuat atau ditetapkan ke pengguna.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Super Admin: Semua izin sistem
  super_admin: getAllPermissions(),

  // Admin: Semua izin (pengelola back office utama)
  admin: getAllPermissions(),

  // Pengguna Layanan: Manajemen perusahaan, pesanan, dan operasi dasar
  user: [
    // Pengguna dapat mengelola profil sendiri
    "users.view",
    "users.read",
    "users.update",

    // Manajemen perusahaan
    ...getResourcePermissions("user-company"),
    ...getResourcePermissions("user-company-testing-location"),

    // Belanja dan pesanan pengujian
    ...getResourcePermissions("cart"),
    "orders.view",
    "orders.create",
    "orders.read",

    // Melihat parameter pengujian
    "parameters.view",
    "parameters.read",
    "parameter-categories.view",
    "parameter-categories.read",
    "clusters.view",
    "clusters.read",

    // Melihat dokumen
    "documents.view",
    "documents.read",

    // Data geografi untuk pemilihan lokasi pengujian
    "provinces.view",
    "provinces.read",
    "regency.view",
    "regency.read",
    "district.view",
    "district.read",
    "village.view",
    "village.read",
    "kbli.view",
    "kbli.read",
  ],

  // Karyawan: Akses dasar ke alur pengujian
  employee: [
    "users.view",
    "users.read",
    "orders.view",
    "testing.view",
    "documents.view",
  ],

  // Petugas Sampling: Fokus pada pengumpulan sampel dan data terkait
  sample_collector: [
    // Dapat melihat dan memperbarui profil sendiri
    "users.view",
    "users.read",
    "users.update",
    // Dapat mengelola lokasi pengujian yang ditugaskan
    ...getResourcePermissions("user-company-testing-location"),
    // Dapat melihat pesanan dan pengujian yang terkait dengan lokasinya
    "orders.view",
    "orders.read",
    "testing.view",
    "testing.read",
    // Dapat melihat dokumen terkait pekerjaannya
    "documents.view",
    "documents.read",
  ],

  // Analis Laboratorium: Operasional pengujian di laboratorium
  lab_technician: [
    // Dapat melihat dan memperbarui data pengujian
    "testing.view",
    "testing.read",
    "testing.update",
    "testing-item.view",
    "testing-item.read",
    "testing-item.update",

    // Dapat mengelola lembar kerja (worksheet)
    "worksheets.view",
    "worksheets.read",
    "worksheets.update",
    ...getResourcePermissions("worksheet-items"),
    ...getResourcePermissions("worksheet-tools"),
    ...getResourcePermissions("worksheet-notes"),

    // Dapat melihat peralatan dan parameter
    "tools.view",
    "tools.read",
    "parameters.view",
    "parameters.read",
    "parameter-categories.view",
    "parameter-categories.read",

    // Dapat melihat pesanan
    "orders.view",
    "orders.read",

    // Dapat melihat dokumen
    "documents.view",
    "documents.read",
  ],

  // Petugas Kaji Ulang: Mengisi worksheet dan mengajukan verifikasi
  // Tidak memiliki hak untuk memverifikasi atau merevisi worksheet (itu tugas lab_manager)
  kaji_ulang: [
    // Akses worksheet tanpa hak verifikasi/review/approve
    "worksheets.view",
    "worksheets.read",
    "worksheets.create",
    "worksheets.update", // untuk ajukan verifikasi (submitForVerification)
    "worksheets.delete",
    // Hanya baca status worksheet, tidak bisa mengubah status secara langsung
    "worksheets-status.view",
    "worksheets-status.read",
    ...getResourcePermissions("worksheets-parameters"),
    ...getResourcePermissions("worksheet-items"),
    ...getResourcePermissions("worksheet-tools"),
    ...getResourcePermissions("worksheet-notes"),
    ...getResourcePermissions("worksheet-assignments"),
    ...getResourcePermissions("worksheet-chemical-materials"),

    // Membuat estimasi pps dan hari kerja
    "worksheets-transaction-details.create",

    // Akses baca ke sumber daya pendukung
    "parameters.view",
    "parameters.read",
    "parameter-categories.view",
    "parameter-categories.read",
    "tools.view",
    "tools.read",
    "chemical-materials.view",
    "chemical-materials.read",

    // Akses baca pesanan untuk membuka halaman detail order (diperlukan untuk ajukan verifikasi worksheet)
    "orders.view",
    "orders.read",
  ],

  // Manajer Teknis/Mutu: Pengelolaan pengujian secara penuh (Back Office Tahap 2)
  lab_manager: [
    // Akses penuh ke data pengujian
    ...getResourcePermissions("testing"),
    ...getResourcePermissions("testing-item"),

    // Akses penuh ke lembar kerja
    ...getResourcePermissions("worksheets"),
    ...getResourcePermissions("worksheet-items"),
    ...getResourcePermissions("worksheet-tools"),
    ...getResourcePermissions("worksheet-notes"),
    ...getResourcePermissions("worksheet-assignments"),
    ...getResourcePermissions("worksheet-chemical-materials"),
    ...getResourcePermissions("worksheets-transaction-details"),
    ...getResourcePermissions("worksheets-personnel-assignments"),

    // Manajemen karyawan
    ...getResourcePermissions("employees"),

    // Manajemen peralatan
    ...getResourcePermissions("tools"),

    // Akses parameter pengujian
    "parameters.view",
    "parameters.read",
    "parameter-categories.view",
    "parameter-categories.read",
    "clusters.view",
    "clusters.read",

    // Manajemen pesanan dan persetujuan
    ...getResourcePermissions("orders"),
    ...getResourcePermissions("order-items"),
    "order-status-history.view",
    "order-status-history.read",
    "orders-approval.view",
    "orders-approval.update", // approve / reject order

    // Manajemen status worksheet (verify, revisi, complete, sync)
    "worksheets-status.update",

    // Manajemen dokumen
    "documents.view",
    "documents.read",
    "documents.create",
    "documents.update",
    ...getResourcePermissions("document-signature"),

    // Dapat melihat data pengguna
    "users.view",
    "users.read",
  ],

  // Kepala Balai: Otoritas persetujuan final dan penandatanganan SPT (Back Office Tahap 4)
  head_of_institution: [
    // Dapat melihat data pengguna
    "users.view",
    "users.read",

    // Pengawasan dan persetujuan final atas pesanan (Tahap 4)
    "orders.view",
    "orders.read",
    "order-items.view",
    "order-items.read",
    "order-status-history.view",
    "order-status-history.read",
    "orders-approval.view",
    "orders-approval.update", // persetujuan final kepala balai

    // Pengawasan pengujian
    "testing.view",
    "testing.read",
    "testing.update",
    "testing-item.view",
    "testing-item.read",

    // Manajemen dan penandatanganan dokumen (SPT, dll.)
    "documents.view",
    "documents.read",
    "documents.create",
    "documents.update",
    "documents-spt.create", // Generate surat tugas / SPT
    ...getResourcePermissions("document-signature"),

    // Pengawasan karyawan
    "employees.view",
    "employees.read",

    // Pengawasan lembar kerja
    "worksheets.view",
    "worksheets.read",
  ],

  // Manajer Administrasi: Surat penawaran, kode billing, verifikasi pembayaran (Back Office Tahap 3)
  admin_manager: [
    // Dapat melihat data pengguna
    "users.view",
    "users.read",

    // Administrasi pesanan (surat penawaran, kode billing) — hanya baca, tidak ada approval
    "orders.view",
    "orders.read",
    "order-items.view",
    "order-items.read",
    "order-status-history.view",
    "order-status-history.read",

    // Tinjauan pengujian
    "testing.view",
    "testing.read",

    // Manajemen dokumen (surat penawaran, dll.)
    "documents.view",
    "documents.read",
    "documents.create",
    "documents.update",
    "documents-admin.create", // Generate surat penawaran, SPK, tagihan

    // Estimasi dan biaya operasional worksheet
    "worksheets.view",
    "worksheets.read",
    "worksheets-transaction-details.view",
    "worksheets-transaction-details.read",
    "worksheets-transaction-details.create",
    "worksheets-transaction-details.update",

    // Info perusahaan untuk keperluan penawaran
    "user-company.view",
    "user-company.read",
  ],

  // Bendahara: Pemrosesan keuangan dan verifikasi pembayaran (Back Office Tahap 3)
  treasurer: [
    // Manajemen keuangan pesanan
    "orders.view",
    "orders.read",
    "order-status-history.view",
    "order-status-history.read",
    "orders-payment.view",
    "orders-payment.update", // verifikasi / tolak pembayaran

    // Dokumen keuangan
    "documents.view",
    "documents.read",
    "documents.update",

    // Tinjauan pengujian
    "testing.view",
  ],

  // Petugas Peralatan: Manajemen ketersediaan alat dan bahan laboratorium
  equipment_officer: [
    // Manajemen peralatan
    ...getResourcePermissions("tools"),
    ...getResourcePermissions("tool-checks"),
    ...getResourcePermissions("tool-calibrations"),
    ...getResourcePermissions("tool-certifications"),
    ...getResourcePermissions("tool-documentations"),

    // Manajemen alat worksheet (memilih alat untuk worksheet yang terverifikasi)
    "worksheets.view",
    "worksheets.read",
    "worksheet-tools.update",

    // Tinjauan pesanan (untuk melihat kebutuhan peralatan)
    "orders.view",

    // Tinjauan pengujian
    "testing.view",
  ],

  // Penjadwalan: Penjadwalan dan penugasan personel pada worksheet (jadwal-personel)
  penjadwalan: [
    // Akses worksheet untuk penjadwalan (hanya baca, update melalui sub-resource spesifik)
    "worksheets.view",
    "worksheets.read",

    // Manajemen penugasan personel pada worksheet
    ...getResourcePermissions("worksheet-assignments"),
    "worksheets-personnel-assignments.view",
    "worksheets-personnel-assignments.read",
    "worksheets-personnel-assignments.create",
    "worksheets-personnel-assignments.update",

    // Data karyawan untuk pemilihan personel
    "employees.view",
    "employees.read",

    // Dokumen jadwal (generate SPT dan unduh)
    "documents.view",
    "documents.read",
    "documents-spt.create",
  ],

  // Petugas Koding: Menginput kode billing pada pesanan (Back Office Tahap 3)
  petugas_koding: [
    // Melihat pesanan untuk keperluan kode billing (hanya baca, tidak ada approval/payment)
    "orders.view",
    "orders.read",
    "order-items.view",
    "order-items.read",
    "order-status-history.view",
    "order-status-history.read",

    // Tinjauan dokumen pesanan
    "documents.view",
    "documents.read",
  ],

  // Viewer: Akses hanya baca ke sebagian besar sumber daya
  viewer: [
    "users.view",
    "roles.view",
    "permissions.view",
    "tools.view",
    "clusters.view",
    "parameter-categories.view",
    "parameters.view",
    "provinces.view",
    "regency.view",
    "district.view",
    "village.view",
    "kbli.view",
    "user-company.view",
    "cart.view",
    "orders.view",
    "testing.view",
    "documents.view",
    "audits.view",
    "employees.view",
    "worksheets.view",
  ],
};

/**
 * Memeriksa apakah nama peran valid dalam sistem.
 *
 * @param role - String peran yang akan divalidasi
 * @returns `true` jika peran valid dan terdaftar dalam sistem
 */
export function isValidRole(role: string): role is Role {
  return ROLES.includes(role as Role);
}

/**
 * Mengambil metadata peran beserta izin yang dimilikinya.
 *
 * @param role - Nama peran yang ingin diambil metadatanya
 * @returns Metadata peran berisi nama, deskripsi, dan daftar izin
 */
export function getRoleMetadata(role: Role): RoleMetadata {
  return {
    name: role,
    description: ROLE_DESCRIPTIONS[role],
    permissions: ROLE_PERMISSIONS[role],
  };
}

/**
 * Mengambil semua peran beserta metadata masing-masing.
 *
 * @returns Array berisi metadata seluruh peran yang terdaftar dalam sistem
 */
export function getAllRolesMetadata(): RoleMetadata[] {
  return ROLES.map((role) => getRoleMetadata(role));
}

/**
 * Menghasilkan daftar peran untuk kebutuhan seeding database.
 *
 * @returns Array objek peran berisi nama dan deskripsi masing-masing peran
 */
export function generateRolesList() {
  return ROLES.map((role) => ({
    name: role,
    description: ROLE_DESCRIPTIONS[role],
  }));
}

/**
 * Memeriksa apakah pengguna dengan peran tertentu memiliki izin yang dibutuhkan.
 * Berguna untuk pemeriksaan izin yang mempertimbangkan hierarki peran.
 *
 * @param userRoles - Array peran yang dimiliki pengguna
 * @param requiredPermission - Izin yang perlu diperiksa
 * @returns `true` jika salah satu peran pengguna memberikan izin tersebut
 */
export function hasRolePermission(
  userRoles: Role[],
  requiredPermission: Permission,
): boolean {
  return userRoles.some((role) =>
    ROLE_PERMISSIONS[role].includes(requiredPermission),
  );
}

/**
 * Mengambil semua izin pengguna berdasarkan seluruh peran yang dimilikinya.
 * Menggabungkan izin dari semua peran yang ditugaskan tanpa duplikasi.
 *
 * @param userRoles - Array peran yang dimiliki pengguna
 * @returns Array izin unik dari gabungan semua peran pengguna
 */
export function getCombinedRolePermissions(userRoles: Role[]): Permission[] {
  const permissionsSet = new Set<Permission>();

  for (const role of userRoles) {
    for (const permission of ROLE_PERMISSIONS[role]) {
      permissionsSet.add(permission);
    }
  }

  return Array.from(permissionsSet);
}
