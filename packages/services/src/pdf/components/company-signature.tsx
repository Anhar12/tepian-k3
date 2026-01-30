import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { tw } from "../utils/tw";

interface CompanySignatureProps {
  /** Header text (e.g., "Menyetujui,") */
  header?: string;
  /** Company or entity name */
  companyName: string;
  /** Signatory name (if provided, shows name instead of placeholder line) */
  signatoryName?: string;
  /** Width of the signature block (Tailwind class, default: "w-4/12") */
  width?: string;
  /** Spacing between company name and signature line (default: "mb-12") */
  signatureSpacing?: string;
  /** Font size for text (Tailwind class, default: "text-[10px]") */
  fontSize?: string;
  /** Placeholder line for signature (default: "(_________________________)") */
  placeholder?: string;
  /** Additional className for the container */
  className?: string;
}

export const CompanySignature: React.FC<CompanySignatureProps> = ({
  header = "Menyetujui,",
  companyName,
  signatoryName,
  width = "w-4/12",
  signatureSpacing = "mb-12",
  fontSize = "text-[10px]",
  placeholder = "(_________________________)",
  className,
}) => {
  return (
    <View style={tw("items-center", width, className)}>
      {header && (
        <Text style={tw(fontSize, "font-bold text-center")}>{header}</Text>
      )}
      <Text style={tw(fontSize, "font-bold text-center", signatureSpacing)}>
        {companyName}
      </Text>

      <Text style={tw(fontSize, "text-center")}>
        {signatoryName || placeholder}
      </Text>
    </View>
  );
};
