import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { tw } from "../utils/tw";

interface BlankFieldProps {
  /** Label for the field (e.g., "Nama Bank") */
  label: string;
  /** Value to display (if empty, shows placeholder line) */
  value?: string;
  /** Width of the label (Tailwind class, default: "w-32") */
  labelWidth?: string;
  /** Placeholder line to show when value is empty (default: "________________________") */
  placeholder?: string;
  /** Separator between label and value (default: ":") */
  separator?: string;
  /** Spacing between rows (Tailwind class, default: "mb-1") */
  spacing?: string;
  /** Font size (Tailwind class, default: "text-[10px]") */
  fontSize?: string;
  /** Additional className for the container */
  className?: string;
}

export const BlankField: React.FC<BlankFieldProps> = ({
  label,
  value,
  labelWidth = "w-32",
  placeholder = "________________________",
  separator = ":",
  spacing = "mb-1",
  fontSize = "text-[10px]",
  className,
}) => {
  return (
    <View style={tw("flex-row items-center", spacing, className)}>
      <Text style={tw(fontSize, labelWidth)}>{label}</Text>
      <Text style={tw(fontSize, "mx-2")}>{separator}</Text>
      <Text style={tw(fontSize)}>{value || placeholder}</Text>
    </View>
  );
};
