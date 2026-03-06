export const DOCUMENT_ENTITY_TYPES = [
  "order",
  "testing",
  "user_company",
  "user", // for profile documents, certifications, etc.
  "worksheet_assignment", // for assignment letters, etc.
  "worksheet", // for SPT and other worksheet-level documents
] as const;

export type DocumentEntityType = (typeof DOCUMENT_ENTITY_TYPES)[number];

export const DOCUMENT_ENTITY_TYPE_LABELS: Record<string, string> = {
  order: "Order",
  testing: "Testing",
  user_company: "User Company",
  user: "User",
  worksheet_assignment: "Worksheet Assignment",
  worksheet: "Worksheet",
};

export const DOCUMENT_TYPES = [
  // Order documents
  "offering_document",
  "offering_user_document",
  "approval_letter",
  "approval_letter_user",
  "invoice",
  "cooperation_agreement",
  "cooperation_agreement_user",
  "proof_of_payment",
  "assignment_letter",

  // Testing documents
  "testing_report",
  "lab_certificate",
  "sample_analysis",
  "calibration_certificate",

  // Company documents
  "business_license",
  "company_registration",

  // User documents
  "id_card",
  "certification",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  // Order documents
  offering_document: "Offering Document",
  offering_user_document: "Offering User Document",
  approval_letter: "Approval Letter",
  invoice: "Invoice",
  proof_of_payment: "Proof of Payment",
  cooperation_agreement: "Cooperation Agreement",
  cooperation_agreement_user: "Cooperation Agreement (User)",
  assignment_letter: "Assignment Letter",

  // Testing documents
  testing_report: "Testing Report",
  lab_certificate: "Lab Certificate",
  sample_analysis: "Sample Analysis",
  calibration_certificate: "Calibration Certificate",

  // Company documents
  business_license: "Business License",
  company_registration: "Company Registration",

  // User documents
  id_card: "ID Card",
  certification: "Certification",
};

export const DOCUMENT_STATUS = [
  "draft",
  "pending_signature",
  "signed",
  "verified",
  "rejected",
] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUS)[number];

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: "Draft",
  pending_signature: "Pending Signature",
  signed: "Signed",
  verified: "Verified",
  rejected: "Rejected",
};
