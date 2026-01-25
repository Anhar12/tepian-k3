import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { tw } from "../utils/tw";

interface SectionHeaderProps {
  text: string;
  body?: string;
  underline?: boolean;
  bold?: boolean;
  fontSize?: string;
  spacing?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  text,
  body,
  underline = false,
  bold = false,
  fontSize = "text-[14px]",
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
    {body && <Text style={tw(fontSize)}>{body}</Text>}
  </View>
);
