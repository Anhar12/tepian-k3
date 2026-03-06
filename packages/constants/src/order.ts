export const ORDER_STATUS = [
  // Initial state
  "pending",
  // Kaji ulang phase
  "kaji_ulang",
  "kaji_ulang_disetujui",
  // Penawaran phase
  "penawaran_diterbitkan",
  "revision", // Can go back to kaji_ulang
  // Persetujuan phase
  "upload_surat_persetujuan",
  "surat_persetujuan_diproses",
  "persetujuan_disetujui",
  // Pembayaran phase
  "tagihan_diterbitkan",
  "proses_validasi_pembayaran",
  "pembayaran_diterima",
  // SPT & Pengujian phase
  "menunggu_penerbitan_spt_jadwal",
  "proses_pengambilan_sampel",
  "sampel_dalam_proses_penyerahan",
  "sampel_telah_dianalisis",
  "sampel_selesai_dianalisis",
  // Completion
  "laporan_diterbitkan",
  "completed",
  // Terminal states
  "rejected",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUS)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  kaji_ulang: "Kaji Ulang",
  kaji_ulang_disetujui: "Kaji Ulang Disetujui",
  penawaran_diterbitkan: "Penawaran Diterbitkan",
  revision: "Revisi",
  upload_surat_persetujuan: "Upload Surat Persetujuan",
  surat_persetujuan_diproses: "Surat Persetujuan Diproses",
  persetujuan_disetujui: "Persetujuan Disetujui",
  tagihan_diterbitkan: "Tagihan Diterbitkan",
  proses_validasi_pembayaran: "Proses Validasi Pembayaran",
  pembayaran_diterima: "Pembayaran Diterima",
  menunggu_penerbitan_spt_jadwal: "Menunggu Penerbitan SPT & Jadwal",
  proses_pengambilan_sampel: "Proses Pengambilan Sampel",
  sampel_dalam_proses_penyerahan: "Sampel Dalam Proses Penyerahan",
  sampel_telah_dianalisis: "Sampel Telah Dianalisis",
  sampel_selesai_dianalisis: "Sampel Selesai Dianalisis",
  laporan_diterbitkan: "Laporan Diterbitkan",
  completed: "Selesai",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  kaji_ulang: "bg-blue-100 text-blue-700",
  kaji_ulang_disetujui: "bg-cyan-100 text-cyan-700",
  penawaran_diterbitkan: "bg-indigo-100 text-indigo-700",
  revision: "bg-orange-100 text-orange-700",
  upload_surat_persetujuan: "bg-amber-100 text-amber-700",
  surat_persetujuan_diproses: "bg-lime-100 text-lime-700",
  persetujuan_disetujui: "bg-emerald-100 text-emerald-700",
  tagihan_diterbitkan: "bg-teal-100 text-teal-700",
  proses_validasi_pembayaran: "bg-sky-100 text-sky-700",
  pembayaran_diterima: "bg-green-100 text-green-700",
  menunggu_penerbitan_spt_jadwal: "bg-violet-100 text-violet-700",
  proses_pengambilan_sampel: "bg-purple-100 text-purple-700",
  sampel_dalam_proses_penyerahan: "bg-fuchsia-100 text-fuchsia-700",
  sampel_telah_dianalisis: "bg-pink-100 text-pink-700",
  sampel_selesai_dianalisis: "bg-rose-100 text-rose-700",
  laporan_diterbitkan: "bg-emerald-100 text-emerald-700",
  completed: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-700",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "kaji_ulang",
  "penawaran_diterbitkan",
  "tagihan_diterbitkan",
  "pembayaran_diterima",
  "menunggu_penerbitan_spt_jadwal",
  "proses_pengambilan_sampel",
  "sampel_selesai_dianalisis",
  "laporan_diterbitkan",
  "completed",
];

export const ORDER_APPROVAL_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;

export type OrderApprovalStatus = (typeof ORDER_APPROVAL_STATUSES)[number];

export const ORDER_APPROVAL_STATUS_LABELS: Record<OrderApprovalStatus, string> =
  {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
  };

export const ORDER_PAYMENT_STATUSES = [
  "unpaid",
  "pending_verification",
  "paid",
  "rejected",
] as const;

export type OrderPaymentStatus = (typeof ORDER_PAYMENT_STATUSES)[number];

export const ORDER_PAYMENT_STATUS_LABELS: Record<OrderPaymentStatus, string> = {
  unpaid: "Unpaid",
  pending_verification: "Pending Verification",
  paid: "Paid",
  rejected: "Rejected",
};

export const ORDER_SEQUENCE_NAME = "order_number_seq";
