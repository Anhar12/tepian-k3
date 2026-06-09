export const ORDER_STATUS = [
  // Initial state
  "pending",
  // Kaji ulang phase
  "kaji_ulang",
  "kaji_ulang_disetujui",
  // Penawaran phase
  "penawaran_review", // Awaiting Kepala Balai approval before admin can cetak
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
  penawaran_review: "Menunggu Persetujuan Penawaran",
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
  penawaran_review: "bg-amber-100 text-amber-700",
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

/**
 * Maps every granular {@link OrderStatus} to the milestone it currently sits on
 * within the condensed {@link ORDER_STATUS_FLOW} shown on the customer timeline.
 *
 * `ORDER_STATUS_FLOW` only lists the visible milestones, but an order's actual
 * status is frequently an in-between value (e.g. `kaji_ulang_disetujui`) that is
 * not itself a milestone. This map resolves such a status to the milestone the
 * order is *currently working toward* so the timeline can mark the prior
 * milestone complete (green check) and the active milestone current (blue).
 *
 * Returns `null` for statuses that have no place in the linear flow
 * (`revision`, `rejected`, `cancelled`); callers handle those separately.
 */
export const ORDER_STATUS_FLOW_MILESTONE: Record<
  OrderStatus,
  OrderStatus | null
> = {
  pending: "pending",
  kaji_ulang: "kaji_ulang",
  // Kaji ulang approved → the offer is the next visible step.
  kaji_ulang_disetujui: "penawaran_diterbitkan",
  // Awaiting head approval still works toward the offer being issued.
  penawaran_review: "penawaran_diterbitkan",
  penawaran_diterbitkan: "penawaran_diterbitkan",
  revision: null,
  // Persetujuan phase works toward the invoice being issued.
  upload_surat_persetujuan: "tagihan_diterbitkan",
  surat_persetujuan_diproses: "tagihan_diterbitkan",
  persetujuan_disetujui: "tagihan_diterbitkan",
  tagihan_diterbitkan: "tagihan_diterbitkan",
  // Payment validation works toward payment being received.
  proses_validasi_pembayaran: "pembayaran_diterima",
  pembayaran_diterima: "pembayaran_diterima",
  menunggu_penerbitan_spt_jadwal: "menunggu_penerbitan_spt_jadwal",
  proses_pengambilan_sampel: "proses_pengambilan_sampel",
  // Sample handling/analysis works toward analysis being finished.
  sampel_dalam_proses_penyerahan: "sampel_selesai_dianalisis",
  sampel_telah_dianalisis: "sampel_selesai_dianalisis",
  sampel_selesai_dianalisis: "sampel_selesai_dianalisis",
  laporan_diterbitkan: "laporan_diterbitkan",
  completed: "completed",
  rejected: null,
  cancelled: null,
};

/**
 * Resolves the active {@link ORDER_STATUS_FLOW} index for a given order status,
 * accounting for granular in-between statuses via {@link ORDER_STATUS_FLOW_MILESTONE}.
 *
 * @param status - The order's current status
 * @param flow - The flow to index into (defaults to {@link ORDER_STATUS_FLOW})
 * @returns The index of the active milestone, or `-1` when the status has no
 *   place in the linear flow (e.g. `revision`, `rejected`, `cancelled`)
 */
export function resolveOrderStatusFlowIndex(
  status: OrderStatus,
  flow: OrderStatus[] = ORDER_STATUS_FLOW,
): number {
  const milestone = ORDER_STATUS_FLOW_MILESTONE[status];
  return milestone ? flow.indexOf(milestone) : -1;
}

export const ORDER_APPROVAL_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "revision",
  "request_review",
] as const;

export type OrderApprovalStatus = (typeof ORDER_APPROVAL_STATUSES)[number];

export const ORDER_APPROVAL_STATUS_LABELS: Record<OrderApprovalStatus, string> =
  {
    pending: "Pending",
    approved: "Disetujui",
    rejected: "Ditolak",
    revision: "Perlu Koreksi Data",
    request_review: "Menunggu Konfirmasi Admin",
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
