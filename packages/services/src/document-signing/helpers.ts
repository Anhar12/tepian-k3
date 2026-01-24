import { env } from "../../env";

export const getDocumentSecret = (documentType: string): string => {
  // Legal/contractual documents
  const legalTypes = [
    "offering_document",
    "offering_user_document",
    "invoice",
    "proof_of_payment",
    "assignment_letter",
  ];

  // Testing/lab documents
  const testingTypes = [
    "testing_report",
    "lab_certificate",
    "sample_analysis",
    "calibration_certificate",
  ];

  // Company documents
  const companyTypes = ["business_license", "company_registration"];

  // Use type-specific secret if available, otherwise fall back to main secret
  if (legalTypes.includes(documentType) && env.JWT_LEGAL_DOCUMENT_SECRET) {
    return env.JWT_LEGAL_DOCUMENT_SECRET;
  }

  if (testingTypes.includes(documentType) && env.JWT_TESTING_DOCUMENT_SECRET) {
    return env.JWT_TESTING_DOCUMENT_SECRET;
  }

  if (companyTypes.includes(documentType) && env.JWT_COMPANY_DOCUMENT_SECRET) {
    return env.JWT_COMPANY_DOCUMENT_SECRET;
  }

  // Default to main document secret
  return env.JWT_DOCUMENT_SECRET;
};
