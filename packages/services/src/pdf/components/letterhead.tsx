import React from "react";
import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { tw } from "../utils/tw";

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    paddingBottom: 10,
    marginBottom: 10,
  },
  logo: {
    width: 64, // 0.96875 inches * 96 DPI = 93 pixels
    height: 64, // 1.2083333333333333 inches * 96 DPI = 116 pixels
    marginRight: 15,
  },
  headerText: {
    flex: 1,
  },
  ministry: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  department: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 2,
  },
  office: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 2,
  },
  address: {
    fontSize: 9,
    textAlign: "center",
    marginTop: 8,
  },
  website: {
    fontSize: 9,
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 4,
  },
});

interface LetterheadProps {
  logoUrl?: string;
}

export const Letterhead: React.FC<LetterheadProps> = ({ logoUrl }) => (
  <View style={tw("mb-4 flex-row items-center border-b border-gray-300 pb-3")}>
    {/* Left Logo + Text */}
    <View style={tw("items-center pr-3 border-r-2 border-[#1E3A8A]")}>
      {logoUrl && <Image src={logoUrl} style={{ width: 56, height: 56 }} />}
      <Text
        style={tw("text-[9px] font-bold text-[#1E3A8A] mt-1 tracking-wider")}
      >
        KEMNAKER
      </Text>
    </View>

    {/* Right Header Information */}
    <View style={tw("flex-1 pl-3")}>
      <Text style={tw("text-[10px] font-bold text-black tracking-tight")}>
        KEMENTERIAN KETENAGAKERJAAN REPUBLIK INDONESIA
      </Text>
      <Text style={tw("text-[11px] font-bold text-black tracking-tight")}>
        DIREKTORAT JENDERAL PEMBINAAN PENGAWASAN KETENAGAKERJAAN
      </Text>
      <Text style={tw("text-[11px] font-bold text-black tracking-tight")}>
        DAN KESELAMATAN DAN KESEHATAN KERJA
      </Text>
      <Text
        style={tw("text-[13px] font-bold text-[#1E3A8A] tracking-tight mb-1")}
      >
        BALAI KESELAMATAN DAN KESEHATAN KERJA
      </Text>
      <Text style={tw("text-[8px] text-gray-800 mb-1")}>
        Jl.Sentosa No.09 Samarinda 75117
      </Text>
      <View style={tw("flex-row items-center gap-3")}>
        <Text style={tw("text-[8px] text-gray-800")}>
          http://balaik3samarinda.kemnaker.go.id
        </Text>
        <Text style={tw("text-[8px] text-gray-800")}>
          bk3samarinda@kemnaker.go.id
        </Text>
        <Text style={tw("text-[8px] text-gray-800")}>(0541) 771306</Text>
      </View>
    </View>
  </View>
);
