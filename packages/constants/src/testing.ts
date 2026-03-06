export const TESTING_SEQUENCE_NAME = "testing_number_seq";

export const TESTING_STATUSES = [
  "start_testing",
  "sample_submission",
  "sample_analysis",
  "report_generation",
  "report_publishing",
  "completed",
] as const;

export type TestingStatus = (typeof TESTING_STATUSES)[number];

export const TESTING_STATUS_LABELS: Record<TestingStatus, string> = {
  start_testing: "Start Testing",
  sample_submission: "Sample Submission",
  sample_analysis: "Sample Analysis",
  report_generation: "Report Generation",
  report_publishing: "Report Publishing",
  completed: "Completed",
};

export const TESTING_STATUS_COLORS: Record<TestingStatus, string> = {
  start_testing: "bg-blue-100 text-blue-700",
  sample_submission: "bg-indigo-100 text-indigo-700",
  sample_analysis: "bg-purple-100 text-purple-700",
  report_generation: "bg-amber-100 text-amber-700",
  report_publishing: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
};

export const TESTING_DOCUMENT_TYPES = [
  { value: "testing_report", label: "Laporan Pengujian" },
  { value: "lab_certificate", label: "Sertifikat Lab" },
  { value: "sample_analysis", label: "Analisis Sampel" },
  { value: "calibration_certificate", label: "Sertifikat Kalibrasi" },
] as const;

export type TestingDocumentType =
  (typeof TESTING_DOCUMENT_TYPES)[number]["value"];
