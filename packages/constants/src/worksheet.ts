export const WORKSHEET_STATUS = [
  "draft",
  "pending_verification",
  "revision",
  "verified",
  "ready",
  "in_progress",
  "completed",
  "rejected",
] as const;

export type WorksheetStatus = (typeof WORKSHEET_STATUS)[number];

export const WORKSHEET_STATUS_LABELS: Record<WorksheetStatus, string> = {
  draft: "Draft",
  pending_verification: "Pending Verification",
  revision: "Revision",
  verified: "Verified",
  ready: "Ready",
  in_progress: "In Progress",
  completed: "Completed",
  rejected: "Rejected",
};

export const WORKSHEET_STATUS_COLORS: Record<WorksheetStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending_verification: "bg-yellow-100 text-yellow-700",
  revision: "bg-orange-100 text-orange-700",
  verified: "bg-blue-100 text-blue-700",
  ready: "bg-indigo-100 text-indigo-700",
  in_progress: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

/**
 * Daily-allowance operational cost line. Always seeded on the worksheet and
 * always permitted — it applies even when the applicant covers all transport
 * and accommodation (i.e. no `cover*` flag is set).
 */
export const WORKSHEET_DAILY_ALLOWANCE_ITEM = "Uang Harian";

/**
 * Fixed, no-charge operational cost statement shown as the last row. Declares
 * that transport/field operations are provided by the applicant company, so it
 * is always permitted regardless of the `cover*` flags.
 */
export const WORKSHEET_FIELD_OPERATIONAL_ITEM =
  "Transportasi dan operasional lapangan selama kegiatan pengujian disediakan oleh perusahaan";

/**
 * Operational cost items that are always allowed on a worksheet even when the
 * applicant bears all transport/accommodation. Used to gate the "biaya
 * operasional tidak dapat ditambahkan" rejection.
 */
export const WORKSHEET_ALWAYS_ALLOWED_OPERATIONAL_ITEMS: readonly string[] = [
  WORKSHEET_DAILY_ALLOWANCE_ITEM,
  WORKSHEET_FIELD_OPERATIONAL_ITEM,
];

export const WORKSHEET_NOTE_STATUS = [
  "info",
  "warning",
  "danger",
  "success",
  "important",
  "question",
  "urgent",
  "unknown",
] as const;

export type WorksheetNoteStatus = (typeof WORKSHEET_NOTE_STATUS)[number];

export const WORKSHEET_NOTE_STATUS_LABELS: Record<WorksheetNoteStatus, string> =
  {
    info: "Info",
    warning: "Warning",
    danger: "Danger",
    success: "Success",
    important: "Important",
    question: "Question",
    urgent: "Urgent",
    unknown: "Unknown",
  };

export const WORKSHEET_NOTE_STATUS_COLORS: Record<WorksheetNoteStatus, string> =
  {
    info: "bg-blue-100 text-blue-700",
    warning: "bg-yellow-100 text-yellow-700",
    danger: "bg-red-100 text-red-700",
    success: "bg-green-100 text-green-700",
    important: "bg-purple-100 text-purple-700",
    question: "bg-indigo-100 text-indigo-700",
    urgent: "bg-pink-100 text-pink-700",
    unknown: "bg-gray-100 text-gray-700",
  };

export const OPERATIONAL_COST_VERIFICATION_STATUS = [
  "draft",
  "submitted",
  "verified",
  "revised",
] as const;

export type OperationalCostVerificationStatus =
  (typeof OPERATIONAL_COST_VERIFICATION_STATUS)[number];

export const OPERATIONAL_COST_VERIFICATION_STATUS_LABELS: Record<
  OperationalCostVerificationStatus,
  string
> = {
  draft: "Draft",
  submitted: "Diajukan",
  verified: "Terverifikasi",
  revised: "Direvisi",
};

export const OPERATIONAL_COST_VERIFICATION_STATUS_COLORS: Record<
  OperationalCostVerificationStatus,
  string
> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-yellow-100 text-yellow-700",
  verified: "bg-green-100 text-green-700",
  revised: "bg-orange-100 text-orange-700",
};

export const WORKSHEET_PROPOSED_DATE_STATUS = [
  "pending",
  "approved",
  "rejected",
] as const;

export type WorksheetProposedDateStatus =
  (typeof WORKSHEET_PROPOSED_DATE_STATUS)[number];
