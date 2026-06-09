import type { Permission } from "./permissions";
import { getAllPermissions } from "./permissions";

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
  "user", // Pengguna Layanan / Perusahaan
  "employee", // Karyawan dasar
  "petugas_sampling", // Petugas Sampling
  "petugas_laboratorium", // Petugas Laboratorium
  "koordinator_pengujian", // Koordinator Pengujian
  "penyelia", // Penyelia
  "koordinator_mutu", // Koordinator Mutu
  "kaji_ulang", // Kaji Ulang
  "kepala_balai", // Kepala Balai
  "koordinator_administrasi", // Koordinator Administrasi
  "bendahara", // Bendahara Penerimaan
  "tim_penjadwalan", // Tim Penjadwalan
  "tim_peralatan", // Tim Peralatan
  "petugas_koding", // Petugas Koding
  "viewer", // Viewer / Monitoring
] as const;

export type Role = (typeof ROLES)[number];

/**
 * Peran yang termasuk dalam sisi karyawan/internal sistem.
 */
export const EMPLOYEE_ROLES = [
  "employee",
  "petugas_sampling",
  "petugas_laboratorium",
  "koordinator_pengujian",
  "penyelia",
  "koordinator_mutu",
  "kaji_ulang",
  "kepala_balai",
  "koordinator_administrasi",
  "bendahara",
  "tim_penjadwalan",
  "tim_peralatan",
  "petugas_koding",
] as const satisfies readonly Role[];

/**
 * Peran yang termasuk dalam sisi back office / administrasi sistem.
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
 * Deskripsi setiap peran dalam sistem.
 */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: "Super Administrator dengan semua izin sistem",

  admin:
    "Administrator back office yang menerima, memverifikasi kelengkapan data order, dan meneruskan ke alur kaji ulang",

  user: "Pengguna layanan yang dapat membuat pesanan, memantau status pengujian, dan mengunggah dokumen pembayaran",

  employee: "Karyawan dengan akses dasar ke alur pengujian",

  petugas_sampling:
    "Petugas Sampling yang bertanggung jawab menerima SPT, memastikan alat yang dipinjam, dan mengumpulkan sampel di lapangan",

  petugas_laboratorium:
    "Petugas Laboratorium yang melakukan pengujian di laboratorium dan menginput hasil analisa ke worksheet",

  koordinator_pengujian:
    "Koordinator Pengujian yang memverifikasi hasil kaji ulang dan meneruskan order ke Koordinator Administrasi",

  penyelia:
    "Penyelia yang mengawasi dan memverifikasi proses pengujian serta hasil worksheet analis laboratorium",

  koordinator_mutu:
    "Koordinator Mutu yang memastikan mutu proses pengujian, memverifikasi dokumen, dan menyetujui hasil akhir",

  kaji_ulang:
    "Kaji Ulang yang mengisi worksheet pengujian, mengecek kesiapan alat dan bahan, serta mengestimasi hari dan personel",

  kepala_balai:
    "Kepala Balai dengan otoritas persetujuan final atas penawaran, SPK/tagihan, dan SPT",

  koordinator_administrasi:
    "Koordinator Administrasi yang menangani penawaran, SPK/tagihan, biaya operasional, dan verifikasi dokumen administrasi",

  bendahara:
    "Bendahara Penerimaan yang menerbitkan kode billing SIMPONI, memvalidasi pembayaran, dan mengelola dokumen keuangan",

  tim_penjadwalan:
    "Tim Penjadwalan yang menginput jadwal pengujian, menugaskan personel, dan membuat SPT",

  tim_peralatan:
    "Tim Peralatan yang mengelola ketersediaan alat, kalibrasi, dan serah terima alat ke Petugas Sampling",

  petugas_koding:
    "Petugas Koding yang menginput kode billing pada pesanan pengujian",

  viewer:
    "Akses hanya baca untuk memantau data sistem tanpa melakukan modifikasi apapun",
};

/**
 * Izin default untuk setiap peran berdasarkan dokumen Workflow & Permission Final v1.0.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Super Admin: semua izin sistem
  super_admin: getAllPermissions(),

  // Admin: verifikasi data order, teruskan ke kaji ulang, kelola dokumen — tidak dapat setujui/tolak order
  admin: [
    "orders.view",
    "orders.read",
    "orders.update",
    "orders.review",
    "orders.verify",
    "order-items.view",
    "order-items.read",
    "order-status-history.view",
    "order-status-history.create",
    "order-status-history.read",
    "orders-approval.view",
    "orders-approval.create",
    "orders-approval.read",
    "orders-approval.review",
    "orders-approval.verify",
    "user-company.view",
    "user-company.read",
    "user-company.review",
    "user-company.verify",
    "user-company-testing-location.view",
    "user-company-testing-location.read",
    "user-company-testing-location.review",
    "user-company-testing-location.verify",
    "testing.view",
    "testing.read",
    "testing-item.view",
    "testing-item.read",
    "worksheets.view",
    "worksheets.read",
    "worksheets.review",
    "worksheets.create",
    "worksheets-status.view",
    "worksheets-status.read",
    "worksheets-status.update",
    "worksheet-items.view",
    "worksheet-items.read",
    "worksheet-notes.view",
    "worksheet-notes.create",
    "worksheet-notes.read",
    "worksheet-notes.update",
    "documents.view",
    "documents.create",
    "documents.read",
    "documents.update",
    "documents.review",
    "documents.verify",
    "documents-penawaran.view",
    "documents-penawaran.create",
    "documents-penawaran.read",
    "documents-penawaran.update",
    "documents-spk.view",
    "documents-spk.create",
    "documents-spk.read",
    "documents-spk.update",
    "documents-invoice.view",
    "documents-invoice.create",
    "documents-invoice.read",
    "documents-invoice.update",
    "documents-spt.view",
    "documents-spt.create",
    "documents-spt.read",
    "documents-spt.update",
    "document-verifications.view",
    "document-verifications.read",
    "parameters.view",
    "parameters.read",
    "parameter-categories.view",
    "parameter-categories.read",
    "clusters.view",
    "clusters.read",
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
    "employees.view",
    "employees.read",
    "positions.view",
    "positions.read",
    "audits.view",
    "audits.read",
    "logs.view",
    "logs.read",
    "notifications.view",
    "notifications.read",
    "notifications.update",
  ],

  // Pengguna Layanan: 72 izin — buat order, bayar, pantau status
  user: [
    "user-company.view",
    "user-company.create",
    "user-company.read",
    "user-company.update",
    "user-company-testing-location.view",
    "user-company-testing-location.create",
    "user-company-testing-location.read",
    "user-company-testing-location.update",
    "clusters.view",
    "clusters.read",
    "parameter-categories.view",
    "parameter-categories.read",
    "parameters.view",
    "parameters.read",
    "kbli.view",
    "kbli.read",
    "provinces.view",
    "provinces.read",
    "regency.view",
    "regency.read",
    "district.view",
    "district.read",
    "village.view",
    "village.read",
    "cart.view",
    "cart.create",
    "cart.read",
    "cart.update",
    "cart.delete",
    "orders.view",
    "orders.create",
    "orders.read",
    "orders.update",
    "order-items.view",
    "order-items.create",
    "order-items.read",
    "order-items.update",
    "order-items.delete",
    "order-status-history.view",
    "order-status-history.read",
    "documents.view",
    "documents.create",
    "documents.read",
    "documents.update",
    "documents-penawaran.view",
    "documents-penawaran.read",
    "documents-spk.view",
    "documents-spk.read",
    "documents-invoice.view",
    "documents-invoice.read",
    "documents-spt.view",
    "documents-spt.read",
    "document-signature.view",
    "document-signature.create",
    "document-signature.read",
    "document-signature.update",
    "orders-payment.view",
    "orders-payment.create",
    "orders-payment.read",
    "orders-payment.update",
    "testing.view",
    "testing.read",
    "testing-item.view",
    "testing-item.read",
    "survey-questions.view",
    "survey-questions.read",
    "survey-responses.view",
    "survey-responses.create",
    "survey-responses.read",
    "survey-responses.update",
    "survey-feedback.view",
    "survey-feedback.create",
    "survey-feedback.read",
    "notifications.view",
    "notifications.read",
    "notifications.update",
  ],

  // Karyawan: akses dasar
  employee: [
    "users.view",
    "users.read",
    "orders.view",
    "testing.view",
    "documents.view",
  ],

  // Petugas Sampling: 35 izin — terima SPT, kelola alat di lapangan
  petugas_sampling: [
    "orders.view",
    "orders.read",
    "testing.view",
    "testing.read",
    "testing-item.view",
    "testing-item.read",
    "documents-spt.view",
    "documents-spt.read",
    "worksheets.view",
    "worksheets.read",
    "worksheets-status.view",
    "worksheets-status.read",
    "worksheets-status.update",
    "worksheet-assignments.view",
    "worksheet-assignments.read",
    "worksheet-assignments.update",
    "worksheets-personnel-assignments.view",
    "worksheets-personnel-assignments.read",
    "worksheet-tools.view",
    "worksheet-tools.read",
    "worksheet-tools.update",
    "worksheet-tools.verify",
    "tools.view",
    "tools.read",
    "tool-codes.view",
    "tool-codes.read",
    "tool-calibrations.view",
    "tool-calibrations.read",
    "worksheet-notes.view",
    "worksheet-notes.create",
    "worksheet-notes.read",
    "worksheet-notes.update",
    "notifications.view",
    "notifications.read",
    "notifications.update",
  ],

  // Petugas Laboratorium: 44 izin — pengujian di lab, input hasil analisa
  petugas_laboratorium: [
    "orders.view",
    "orders.read",
    "testing.view",
    "testing.read",
    "testing.update",
    "testing.review",
    "testing-item.view",
    "testing-item.read",
    "testing-item.update",
    "worksheets.view",
    "worksheets.read",
    "worksheets.review",
    "worksheets-status.view",
    "worksheets-status.read",
    "worksheets-status.update",
    "worksheet-items.view",
    "worksheet-items.read",
    "worksheet-items.update",
    "worksheet-items.review",
    "worksheets-parameters.view",
    "worksheets-parameters.read",
    "worksheets-parameters.update",
    "worksheets-parameters.review",
    "worksheet-notes.view",
    "worksheet-notes.create",
    "worksheet-notes.read",
    "worksheet-notes.update",
    "tools.view",
    "tools.read",
    "chemical-materials.view",
    "chemical-materials.read",
    "parameters.view",
    "parameters.read",
    "documents.view",
    "documents.create",
    "documents.read",
    "documents.update",
    "documents.review",
    "notifications.view",
    "notifications.read",
    "notifications.update",
    "audits.view",
    "audits.read",
  ],

  // Koordinator Pengujian: verifikasi hasil kaji ulang, teruskan ke Koordinator Administrasi — tidak dapat mengajukan verifikasi
  koordinator_pengujian: [
    "orders.view",
    "orders.read",
    "orders.update",
    "orders.review",
    "orders.verify",
    "orders-approval.view",
    "orders-approval.read",
    "orders-approval.reject",
    "order-items.view",
    "order-items.read",
    "order-status-history.view",
    "order-status-history.create",
    "order-status-history.read",
    "worksheets.view",
    "worksheets.read",
    "worksheets.review",
    "worksheets.verify",
    "worksheets.approve",
    "worksheets-status.view",
    "worksheets-status.read",
    "worksheets-status.update",
    "worksheets-status.verify",
    "worksheets-status.approve",
    "worksheets-parameters.view",
    "worksheets-parameters.read",
    "worksheets-parameters.review",
    "worksheets-parameters.verify",
    "worksheet-items.view",
    "worksheet-items.read",
    "worksheet-items.review",
    "worksheet-items.verify",
    "worksheet-tools.view",
    "worksheet-tools.read",
    "worksheet-tools.review",
    "worksheet-tools.verify",
    "worksheet-chemical-materials.view",
    "worksheet-chemical-materials.read",
    "worksheet-chemical-materials.review",
    "worksheet-chemical-materials.verify",
    "worksheet-notes.view",
    "worksheet-notes.create",
    "worksheet-notes.read",
    "worksheet-notes.update",
    "worksheets-personnel-assignments.view",
    "worksheets-personnel-assignments.create",
    "worksheets-personnel-assignments.read",
    "worksheets-personnel-assignments.update",
    "worksheets-personnel-assignments.verify",
    "worksheet-assignments.view",
    "worksheet-assignments.create",
    "worksheet-assignments.read",
    "worksheet-assignments.update",
    "worksheet-assignments.verify",
    "employees.view",
    "employees.read",
    "positions.view",
    "positions.read",
    "tools.view",
    "tools.read",
    "tool-calibrations.view",
    "tool-calibrations.read",
    "notifications.view",
    "notifications.read",
    "notifications.update",
    "audits.view",
    "audits.read",
  ],

  // Penyelia: 43 izin — supervisi proses pengujian dan verifikasi worksheet analis
  penyelia: [
    "orders.view",
    "orders.read",
    "testing.view",
    "testing.read",
    "testing.review",
    "testing.verify",
    "testing-item.view",
    "testing-item.read",
    "testing-item.review",
    "testing-item.verify",
    "worksheets.view",
    "worksheets.read",
    "worksheets.review",
    "worksheets.verify",
    "worksheets.approve",
    "worksheets-status.view",
    "worksheets-status.read",
    "worksheets-status.update",
    "worksheets-status.verify",
    "worksheets-status.approve",
    "worksheet-items.view",
    "worksheet-items.read",
    "worksheet-items.review",
    "worksheet-items.verify",
    "worksheet-items.approve",
    "worksheets-parameters.view",
    "worksheets-parameters.read",
    "worksheets-parameters.review",
    "worksheets-parameters.verify",
    "worksheets-parameters.approve",
    "worksheet-notes.view",
    "worksheet-notes.create",
    "worksheet-notes.read",
    "worksheet-notes.update",
    "documents.view",
    "documents.read",
    "documents.review",
    "documents.verify",
    "notifications.view",
    "notifications.read",
    "notifications.update",
    "audits.view",
    "audits.read",
  ],

  // Koordinator Mutu: memastikan mutu pengujian dan menyetujui dokumen hasil — dapat tolak order
  koordinator_mutu: [
    "orders.view",
    "orders.read",
    "orders-approval.view",
    "orders-approval.read",
    "orders-approval.reject",
    "testing.view",
    "testing.read",
    "testing.review",
    "testing.verify",
    "testing-item.view",
    "testing-item.read",
    "testing-item.review",
    "testing-item.verify",
    "worksheets.view",
    "worksheets.read",
    "worksheets.review",
    "worksheets.verify",
    "worksheets.approve",
    "worksheets-status.view",
    "worksheets-status.read",
    "worksheets-status.update",
    "worksheets-status.review",
    "worksheets-status.verify",
    "worksheets-status.approve",
    "worksheet-items.view",
    "worksheet-items.read",
    "worksheet-items.review",
    "worksheet-items.verify",
    "worksheet-items.approve",
    "worksheets-parameters.view",
    "worksheets-parameters.read",
    "worksheets-parameters.review",
    "worksheets-parameters.verify",
    "worksheets-parameters.approve",
    "worksheet-tools.view",
    "worksheet-tools.read",
    "worksheet-tools.review",
    "worksheet-tools.verify",
    "worksheet-chemical-materials.view",
    "worksheet-chemical-materials.read",
    "worksheet-chemical-materials.review",
    "worksheet-chemical-materials.verify",
    "worksheet-notes.view",
    "worksheet-notes.create",
    "worksheet-notes.read",
    "worksheet-notes.update",
    "documents.view",
    "documents.read",
    "documents.review",
    "documents.verify",
    "documents.approve",
    "document-verifications.view",
    "document-verifications.read",
    "document-verifications.review",
    "document-verifications.verify",
    "audits.view",
    "audits.read",
    "logs.view",
    "logs.read",
    "notifications.view",
    "notifications.read",
    "notifications.update",
  ],

  // Kaji Ulang: 73 izin — isi worksheet, cek alat/bahan, estimasi hari/personel
  kaji_ulang: [
    "orders.view",
    "orders.read",
    "order-items.view",
    "order-items.read",
    "order-status-history.view",
    "order-status-history.create",
    "order-status-history.read",
    "worksheets.view",
    "worksheets.create",
    "worksheets.read",
    "worksheets.update",
    "worksheets-status.view",
    "worksheets-status.read",
    "worksheets-status.update",
    "worksheets-parameters.view",
    "worksheets-parameters.create",
    "worksheets-parameters.read",
    "worksheets-parameters.update",
    "worksheets-parameters.review",
    "worksheets-parameters.verify",
    "worksheet-items.view",
    "worksheet-items.read",
    "worksheet-items.update",
    "worksheet-items.review",
    "worksheet-items.verify",
    "worksheet-tools.view",
    "worksheet-tools.create",
    "worksheet-tools.read",
    "worksheet-tools.update",
    "worksheet-tools.review",
    "worksheet-tools.verify",
    "worksheet-chemical-materials.view",
    "worksheet-chemical-materials.create",
    "worksheet-chemical-materials.read",
    "worksheet-chemical-materials.update",
    "worksheet-chemical-materials.review",
    "worksheet-chemical-materials.verify",
    "worksheet-notes.view",
    "worksheet-notes.create",
    "worksheet-notes.read",
    "worksheet-notes.update",
    "worksheets-transaction-details.create",
    "parameters.view",
    "parameters.read",
    "parameter-categories.view",
    "parameter-categories.read",
    "clusters.view",
    "clusters.read",
    "tools.view",
    "tools.read",
    "tool-calibrations.view",
    "tool-calibrations.read",
    "tool-checks.view",
    "tool-checks.read",
    "tool-certifications.view",
    "tool-certifications.read",
    "tool-documentations.view",
    "tool-documentations.read",
    "chemical-materials.view",
    "chemical-materials.read",
    "parameter-tool.view",
    "parameter-tool.read",
    "parameter-chemical-material.view",
    "parameter-chemical-material.read",
    "notifications.view",
    "notifications.read",
    "notifications.update",
    "audits.view",
    "audits.read",
  ],

  // Kepala Balai: persetujuan final order, worksheet, SPK/tagihan, dan SPT
  kepala_balai: [
    "orders.view",
    "orders.read",
    "orders.review",
    "orders.approve",
    "orders-approval.view",
    "orders-approval.read",
    "orders-approval.approve",
    "orders-approval.reject",
    "order-items.view",
    "order-items.read",
    "order-status-history.view",
    "order-status-history.create",
    "order-status-history.read",
    "documents.view",
    "documents.read",
    "documents.review",
    "documents.approve",
    "documents-penawaran.view",
    "documents-penawaran.read",
    "documents-penawaran.review",
    "documents-penawaran.approve",
    "documents-spk.view",
    "documents-spk.read",
    "documents-spk.review",
    "documents-spk.approve",
    "documents-invoice.view",
    "documents-invoice.read",
    "documents-invoice.review",
    "documents-invoice.approve",
    "documents-spt.view",
    "documents-spt.read",
    "documents-spt.review",
    "documents-spt.approve",
    "document-verifications.view",
    "document-verifications.read",
    "worksheets.view",
    "worksheets.read",
    "worksheets.verify",
    "worksheets.approve",
    "worksheets-status.view",
    "worksheets-status.read",
    "worksheets-status.verify",
    "worksheets-status.approve",
    "worksheets-transaction-details.view",
    "worksheets-transaction-details.read",
    "worksheet-notes.view",
    "worksheet-notes.create",
    "worksheet-notes.read",
    "audits.view",
    "audits.read",
    "logs.view",
    "logs.read",
    "notifications.view",
    "notifications.read",
    "notifications.update",
  ],

  // Koordinator Administrasi: penawaran, SPK/tagihan, biaya operasional — dapat tolak order sebelum disetujui
  koordinator_administrasi: [
    "orders.view",
    "orders.read",
    "orders.update",
    "orders.review",
    "orders.verify",
    "orders-approval.view",
    "orders-approval.read",
    "orders-approval.reject",
    "order-items.view",
    "order-items.read",
    "order-status-history.view",
    "order-status-history.create",
    "order-status-history.read",
    "worksheets.view",
    "worksheets.read",
    "worksheets-status.view",
    "worksheets-status.read",
    "worksheets-status.update",
    "worksheets-status.verify",
    "worksheets-transaction-details.view",
    "worksheets-transaction-details.create",
    "worksheets-transaction-details.read",
    "worksheets-transaction-details.update",
    "worksheets-transaction-details.review",
    "worksheets-transaction-details.verify",
    "worksheet-notes.view",
    "worksheet-notes.create",
    "worksheet-notes.read",
    "worksheet-notes.update",
    "employees.view",
    "employees.read",
    "positions.view",
    "positions.read",
    "parameters.view",
    "parameters.read",
    "tools.view",
    "tools.read",
    "notifications.view",
    "notifications.read",
    "notifications.update",
    "audits.view",
    "audits.read",
  ],

  // Bendahara Penerimaan: 48 izin — billing SIMPONI, validasi pembayaran, dokumen keuangan
  bendahara: [
    "orders.view",
    "orders.read",
    "orders.update",
    "orders.review",
    "orders.verify",
    "order-items.view",
    "order-items.read",
    "order-status-history.view",
    "order-status-history.create",
    "order-status-history.read",
    "orders-payment.view",
    "orders-payment.create",
    "orders-payment.read",
    "orders-payment.update",
    "orders-payment.review",
    "orders-payment.verify",
    "orders-payment.reject",
    "orders-payment.approve",
    "worksheets.view",
    "worksheets.read",
    "worksheets-transaction-details.view",
    "worksheets-transaction-details.read",
    "worksheets-transaction-details.verify",
    "worksheet-notes.view",
    "worksheet-notes.create",
    "worksheet-notes.read",
    "worksheet-notes.update",
    "notifications.view",
    "notifications.read",
    "notifications.update",
    "audits.view",
    "audits.read",
    "logs.view",
    "logs.read",
  ],

  // Tim Penjadwalan: 55 izin — input jadwal, penugasan personel, buat SPT
  tim_penjadwalan: [
    "orders.view",
    "orders.read",
    "orders.update",
    "orders.review",
    "orders.verify",
    "order-items.view",
    "order-items.read",
    "order-status-history.view",
    "order-status-history.create",
    "order-status-history.read",
    "testing.view",
    "testing.create",
    "testing.read",
    "testing.update",
    "testing.review",
    "testing.verify",
    "testing-item.view",
    "testing-item.create",
    "testing-item.read",
    "testing-item.update",
    "worksheets.view",
    "worksheets.read",
    "worksheets-status.view",
    "worksheets-status.read",
    "worksheets-status.update",
    "worksheets-personnel-assignments.view",
    "worksheets-personnel-assignments.create",
    "worksheets-personnel-assignments.read",
    "worksheets-personnel-assignments.update",
    "worksheets-personnel-assignments.verify",
    "worksheet-assignments.view",
    "worksheet-assignments.create",
    "worksheet-assignments.read",
    "worksheet-assignments.update",
    "worksheet-assignments.verify",
    "worksheet-notes.view",
    "worksheet-notes.create",
    "worksheet-notes.read",
    "worksheet-notes.update",
    "documents-spt.view",
    "documents-spt.create",
    "documents-spt.read",
    "documents-spt.update",
    "documents-spt.review",
    "documents-spt.verify",
    "employees.view",
    "employees.read",
    "positions.view",
    "positions.read",
    "notifications.view",
    "notifications.read",
    "notifications.update",
    "audits.view",
    "audits.read",
  ],

  // Tim Peralatan: 41 izin — kelola alat, kalibrasi, serah terima ke Petugas Sampling
  tim_peralatan: [
    "orders.view",
    "orders.read",
    "worksheets.view",
    "worksheets.read",
    "worksheet-tools.view",
    "worksheet-tools.create",
    "worksheet-tools.read",
    "worksheet-tools.update",
    "worksheet-tools.review",
    "worksheet-tools.verify",
    "worksheet-tools.approve",
    "worksheet-notes.view",
    "worksheet-notes.create",
    "worksheet-notes.read",
    "worksheet-notes.update",
    "tools.view",
    "tools.read",
    "tools.update",
    "tool-codes.view",
    "tool-codes.read",
    "tool-codes.update",
    "tool-calibrations.view",
    "tool-calibrations.read",
    "tool-calibrations.update",
    "tool-calibrations.verify",
    "tool-checks.view",
    "tool-checks.create",
    "tool-checks.read",
    "tool-checks.update",
    "tool-checks.verify",
    "tool-certifications.view",
    "tool-certifications.read",
    "tool-documentations.view",
    "tool-documentations.create",
    "tool-documentations.read",
    "tool-documentations.update",
    "notifications.view",
    "notifications.read",
    "notifications.update",
    "audits.view",
    "audits.read",
  ],

  // Petugas Koding: 8 izin — input kode billing
  petugas_koding: [
    "orders.view",
    "orders.read",
    "order-items.view",
    "order-items.read",
    "order-status-history.view",
    "order-status-history.read",
    "documents.view",
    "documents.read",
  ],

  // Viewer / Monitoring: 38 izin — hanya baca, tidak bisa modifikasi
  viewer: [
    "orders.view",
    "orders.read",
    "order-items.view",
    "order-items.read",
    "order-status-history.view",
    "order-status-history.read",
    "testing.view",
    "testing.read",
    "testing-item.view",
    "testing-item.read",
    "worksheets.view",
    "worksheets.read",
    "worksheets-status.view",
    "worksheets-status.read",
    "worksheet-items.view",
    "worksheet-items.read",
    "worksheets-parameters.view",
    "worksheets-parameters.read",
    "worksheet-tools.view",
    "worksheet-tools.read",
    "worksheet-notes.view",
    "worksheet-notes.read",
    "documents.view",
    "documents.read",
    "documents-penawaran.view",
    "documents-penawaran.read",
    "documents-spk.view",
    "documents-spk.read",
    "documents-invoice.view",
    "documents-invoice.read",
    "documents-spt.view",
    "documents-spt.read",
    "user-company.view",
    "user-company.read",
    "user-company-testing-location.view",
    "user-company-testing-location.read",
    "audits.view",
    "audits.read",
    "logs.view",
    "logs.read",
    "notifications.view",
    "notifications.read",
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
