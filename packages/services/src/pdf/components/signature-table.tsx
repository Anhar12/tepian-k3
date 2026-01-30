import { Text, View } from "@react-pdf/renderer";
import { tw } from "../utils/tw";
import React from "react";

interface SignatureRow {
  role: string;
  // paraf and tanggal are typically empty for signing
}

interface SignatureTableProps {
  rows: SignatureRow[];
  className?: string;
}

export const SignatureTable: React.FC<SignatureTableProps> = ({
  rows,
  className = "w-5/12",
}) => (
  <View style={tw(`${className} border border-black`)}>
    {/* Header */}
    <View style={tw("flex-row border-b border-black")}>
      <Text
        style={tw("text-[7px] p-2 border-r border-black w-2/3 text-center")}
      >
        Penanggungjawab
      </Text>
      <Text
        style={tw("text-[7px] p-2 border-r border-black w-1/3 text-center")}
      >
        Paraf
      </Text>
      <Text style={tw("text-[7px] p-2 w-1/3 text-center")}>Tanggal</Text>
    </View>

    {/* Rows */}
    {rows.map((row, index) => (
      <View
        key={index}
        style={tw(
          `flex-row ${index < rows.length - 1 ? "border-b border-black" : ""}`.trim(),
        )}
      >
        <View
          style={tw("w-2/3 border-r border-black justify-center items-center")}
        >
          <Text style={tw("text-[7px] p-2 text-center")}>{row.role}</Text>
        </View>
        <View style={tw("w-1/3 border-r border-black h-16")} />
        <View style={tw("w-1/3 h-16")} />
      </View>
    ))}
  </View>
);
