import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { tw } from "../utils/tw";

interface LabeledFieldProps {
  label: string;
  value: string;
  spacing?: string;
  labelWidth?: string;
  valueWidth?: string;
}

export const LabeledField: React.FC<LabeledFieldProps> = ({
  label,
  value,
  spacing = "mb-4",
  labelWidth = "w-24",
  valueWidth = "flex-1",
}) => (
  <View style={tw(`flex flex-row ${spacing} justify-between gap-4`)}>
    <Text style={tw(`text-[11px] ${labelWidth}`)}>{label}</Text>
    <Text style={tw("text-[11px]")}>:</Text>
    <Text style={tw(`text-[11px] ${valueWidth} text-justify`)}>{value}</Text>
  </View>
);
