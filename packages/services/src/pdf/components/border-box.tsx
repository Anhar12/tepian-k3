import React from "react";
import { View } from "@react-pdf/renderer";
import { tw } from "../utils/tw";

interface BorderBoxProps {
  /** Content to render inside the box */
  children: React.ReactNode;
  /** Border style: "solid", "dashed" (default: "solid") */
  borderStyle?: "solid" | "dashed";
  /** Border color (Tailwind class, default: "border-black") */
  borderColor?: string;
  /** Border width (Tailwind class, default: "border") */
  borderWidth?: string;
  /** Padding inside the box (Tailwind class, default: "p-2") */
  padding?: string;
  /** Margin around the box (Tailwind class, default: none) */
  margin?: string;
  /** Background color (Tailwind class, default: none) */
  backgroundColor?: string;
  /** Additional className for the container */
  className?: string;
}

export const BorderBox: React.FC<BorderBoxProps> = ({
  children,
  borderStyle = "solid",
  borderColor = "border-black",
  borderWidth = "border",
  padding = "p-2",
  margin,
  backgroundColor,
  className,
}) => {
  const borderStyleClass = borderStyle === "dashed" ? "border-dashed" : "";

  return (
    <View
      style={tw(
        borderWidth,
        borderColor,
        borderStyleClass,
        padding,
        margin,
        backgroundColor,
        className,
      )}
    >
      {children}
    </View>
  );
};
