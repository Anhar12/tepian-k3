import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { tw } from "../utils/tw";

interface SignatureBlockProps {
  /** Title lines displayed above the signature (e.g., ["Kepala Balai", "Keselamatan dan Kesehatan Kerja"]) */
  title: string | string[];
  /** Name of the signatory (displayed with underline) */
  name: string;
  /** Optional NIP/ID number (displayed below name) */
  nip?: string;
  /** Width of the signature block (Tailwind class, default: "w-4/12") */
  width?: string;
  /** Spacing between title and name for signature space (default: "mb-12") */
  signatureSpacing?: string;
  /** Font size for text (Tailwind class, default: "text-[10px]") */
  fontSize?: string;
  /** Whether to show underline on name (default: true) */
  showUnderline?: boolean;
  /** Additional className for the container */
  className?: string;
}

export const SignatureBlock: React.FC<SignatureBlockProps> = ({
  title,
  name,
  nip,
  width = "w-4/12",
  signatureSpacing = "mb-12",
  fontSize = "text-[10px]",
  showUnderline = true,
  className,
}) => {
  const titleLines = Array.isArray(title) ? title : [title];

  return (
    <View style={tw(`items-center ${width}`, className)}>
      {titleLines.map((line, index) => (
        <Text
          key={index}
          style={tw(
            `${fontSize} font-bold text-center`,
            index === titleLines.length - 1 && signatureSpacing,
          )}
        >
          {line}
        </Text>
      ))}

      <Text style={tw(`${fontSize} text-center`, showUnderline && "underline")}>
        {name}
      </Text>

      {nip && <Text style={tw(`${fontSize} text-center`)}>NIP. {nip}</Text>}
    </View>
  );
};
