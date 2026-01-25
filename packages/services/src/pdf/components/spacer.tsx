import React from "react";
import { View } from "@react-pdf/renderer";
import { tw } from "../utils/tw";

interface SpacerProps {
  /** Size of the spacer using Tailwind margin classes (e.g., "my-4", "my-8") */
  size?: string;
  /** Fixed height in points (1 point = 1/72 inch). Takes precedence over size. */
  height?: number;
  /** Additional className */
  className?: string;
}

export const Spacer: React.FC<SpacerProps> = ({
  size = "my-4",
  height,
  className,
}) => {
  if (height !== undefined) {
    return <View style={{ height }} />;
  }

  return <View style={tw(size, className)} />;
};

/** Preset spacer sizes for convenience */
export const SpacerSizes = {
  /** Extra small spacer (4px / ~1mm) */
  xs: "my-1",
  /** Small spacer (8px / ~2mm) */
  sm: "my-2",
  /** Medium spacer (16px / ~4mm) */
  md: "my-4",
  /** Large spacer (32px / ~8mm) */
  lg: "my-8",
  /** Extra large spacer (48px / ~12mm) */
  xl: "my-12",
  /** 2x Extra large spacer (64px / ~16mm) */
  "2xl": "my-16",
} as const;
