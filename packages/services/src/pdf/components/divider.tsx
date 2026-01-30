import React from "react";
import { View } from "@react-pdf/renderer";
import { tw } from "../utils/tw";

interface DividerProps {
  /** Orientation of the divider (default: "horizontal") */
  orientation?: "horizontal" | "vertical";
  /** Border thickness (Tailwind class, default: "border" for 1px, use "border-2" for 2px) */
  thickness?: string;
  /** Border color (Tailwind class, default: "border-black") */
  color?: string;
  /** Border style (default: "solid") */
  style?: "solid" | "dashed" | "dotted";
  /** Margin around the divider (Tailwind class, default: "my-4" for horizontal, "mx-4" for vertical) */
  margin?: string;
  /** Length of the divider (Tailwind class, default: "w-full" for horizontal, "h-full" for vertical) */
  length?: string;
  /** Additional className */
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = "horizontal",
  thickness = "border",
  color = "border-black",
  style = "solid",
  margin,
  length,
  className,
}) => {
  const isHorizontal = orientation === "horizontal";

  const defaultMargin = margin || (isHorizontal ? "my-4" : "mx-4");
  const defaultLength = length || (isHorizontal ? "w-full" : "h-full");

  const borderDirection = isHorizontal ? "border-b" : "border-r";
  const borderStyle =
    style === "dashed"
      ? "border-dashed"
      : style === "dotted"
        ? "border-dotted"
        : "";

  return (
    <View
      style={tw(
        borderDirection,
        thickness.replace("border", ""),
        color,
        borderStyle,
        defaultMargin,
        defaultLength,
        className,
      )}
    />
  );
};
