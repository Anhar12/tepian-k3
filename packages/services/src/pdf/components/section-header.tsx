import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { tw } from "../utils/tw";

interface SectionHeaderProps {
  text: string;
  body?: string;
  underline?: boolean;
  bodyUnderline?: boolean;
  bold?: boolean;
  bodyBold?: boolean;
  fontSize?: string;
  bodyFontSize?: string;
  spacing?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  text,
  body,
  underline = false,
  bodyUnderline = false,
  bold = false,
  bodyBold = false,
  fontSize = "text-[14px]",
  bodyFontSize = "text-[12px]",
  spacing = "mb-4",
}) => (
  <View style={tw(`flex flex-col ${spacing} justify-center items-center`)}>
    <Text
      style={tw(
        `${fontSize} ${underline ? "underline" : ""} ${bold ? "font-bold" : ""}`,
      )}
    >
      {text}
    </Text>
    {body && (
      <Text
        style={tw(
          `${bodyFontSize} ${bodyUnderline ? "underline" : ""} ${bodyBold ? "font-bold" : ""}`,
        )}
      >
        {body}
      </Text>
    )}
  </View>
);
