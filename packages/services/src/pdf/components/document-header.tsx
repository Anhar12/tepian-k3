import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { tw } from "../utils/tw";

interface DocumentHeaderField {
  /** Label for the field (e.g., "Lampiran", "Tanggal") */
  label: string;
  /** Value for the field */
  value: string;
}

interface DocumentHeaderProps {
  /** Fields to display in the header */
  fields: DocumentHeaderField[];
  /** Alignment of the header content (default: "center") */
  align?: "left" | "center" | "right";
  /** Font size (Tailwind class, default: "text-[12px]") */
  fontSize?: string;
  /** Spacing below the header (Tailwind class, default: "mb-4") */
  spacing?: string;
  /** Gap between label and value (Tailwind class, default: "gap-2") */
  gap?: string;
  /** Additional className for the container */
  className?: string;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  fields,
  align = "center",
  fontSize = "text-[12px]",
  spacing = "mb-4",
  gap = "gap-2",
  className,
}) => {
  const getAlignClass = (alignment: string) => {
    switch (alignment) {
      case "left":
        return "items-start";
      case "right":
        return "items-end";
      case "center":
      default:
        return "items-center";
    }
  };

  return (
    <View
      style={tw(
        "flex-col justify-between",
        getAlignClass(align),
        spacing,
        className,
      )}
    >
      {fields.map((field, index) => (
        <View
          key={index}
          style={tw("flex-row justify-between items-center", gap)}
        >
          <Text style={tw(fontSize)}>{field.label}</Text>
          <Text style={tw(fontSize)}>:</Text>
          <Text style={tw(fontSize)}>{field.value}</Text>
        </View>
      ))}
    </View>
  );
};
