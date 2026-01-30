import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { tw } from "../utils/tw";

interface SummaryRowProps {
  /** Label for the summary row (e.g., "Total I", "Grand Total") */
  label: string;
  /** Value to display (can be pre-formatted string or number) */
  value: string | number;
  /** Width of the label column (Tailwind class, default: "w-10/12") */
  labelWidth?: string;
  /** Width of the value column (Tailwind class, default: "w-2/12") */
  valueWidth?: string;
  /** Whether to show bold text (default: true) */
  bold?: boolean;
  /** Whether to show top border (default: true) */
  showTopBorder?: boolean;
  /** Whether to show border between label and value (default: true) */
  showDivider?: boolean;
  /** Border color (Tailwind class, default: "border-black") */
  borderColor?: string;
  /** Padding (Tailwind class, default: "p-2") */
  padding?: string;
  /** Font size (Tailwind class, default: none - inherits from parent) */
  fontSize?: string;
  /** Text alignment for value (default: "center") */
  valueAlign?: "left" | "center" | "right";
  /** Additional className for the container */
  className?: string;
}

export const SummaryRow: React.FC<SummaryRowProps> = ({
  label,
  value,
  labelWidth = "w-10/12",
  valueWidth = "w-2/12",
  bold = true,
  showTopBorder = true,
  showDivider = true,
  borderColor = "border-black",
  padding = "p-2",
  fontSize,
  valueAlign = "center",
  className,
}) => {
  const fontWeight = bold ? "font-bold" : "";
  const topBorder = showTopBorder ? `border-t ${borderColor}` : "";
  const dividerBorder = showDivider ? `border-r ${borderColor}` : "";

  const getAlignClass = (align: string) => {
    switch (align) {
      case "left":
        return "text-left";
      case "right":
        return "text-right";
      case "center":
      default:
        return "text-center";
    }
  };

  return (
    <View style={tw("flex-row", topBorder, className)}>
      <Text
        style={tw(
          labelWidth,
          dividerBorder,
          padding,
          fontWeight,
          fontSize,
          "text-center",
        )}
      >
        {label}
      </Text>
      <Text
        style={tw(
          valueWidth,
          padding,
          fontWeight,
          fontSize,
          getAlignClass(valueAlign),
        )}
      >
        {typeof value === "number"
          ? value.toLocaleString("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            })
          : value}
      </Text>
    </View>
  );
};
