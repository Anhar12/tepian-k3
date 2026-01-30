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
  <View style={tw("mb-4")}>
    <View style={tw("flex-row items-center border-b-2 border-black pb-2")}>
      {logoUrl && <Image src={logoUrl} style={styles.logo} />}
      <View style={tw("flex-1")}>
        <Text style={tw("text-center text-[12px]")}>
          KEMENTERIAN KETENAGAKERJAAN REPUBLIK INDONESIA
        </Text>
        <Text style={tw("text-center text-[12px]")}>DIREKTORAT JENDERAL</Text>
        <Text style={tw("text-center text-[12px]")}>
          PEMBINAAN PENGAWASAN KETENAGAKERJAAN
        </Text>
        <Text style={tw("text-center text-[12px]")}>
          DAN KESELAMATAN DAN KESEHATAN KERJA
        </Text>
        <Text style={tw("text-center text-[16px]")}>
          BALAI KESELAMATAN DAN KESEHATAN KERJA
        </Text>
        <Text style={tw("text-center text-[9px]")}>
          Jalan Sentosa No. 09 Samarinda Telp./Fax. (0541) 771306, 732941
          Samarinda 75117
        </Text>
        <View style={tw("flex-row justify-center gap-2")}>
          <Text style={tw("text-center text-[9px] italic")}>Laman</Text>
          <Text style={tw("text-center text-[9px] italic")}>:</Text>
          <Text
            style={tw("text-center text-[9px] italic underline text-blue-600")}
          >
            http://bkk3.samarinda.kemnaker.go.id
          </Text>
        </View>
      </View>
    </View>
  </View>
);
