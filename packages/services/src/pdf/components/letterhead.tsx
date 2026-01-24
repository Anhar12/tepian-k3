import React from "react";
import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";

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
  <View style={styles.container}>
    <View style={styles.header}>
      {logoUrl && <Image src={logoUrl} style={styles.logo} />}
      <View style={styles.headerText}>
        <Text style={styles.ministry}>
          KEMENTERIAN KETENAGAKERJAAN REPUBLIK INDONESIA
        </Text>
        <Text style={styles.department}>DIREKTORAT JENDERAL</Text>
        <Text style={styles.department}>
          PEMBINAAN PENGAWASAN KETENAGAKERJAAN
        </Text>
        <Text style={styles.department}>
          DAN KESELAMATAN DAN KESEHATAN KERJA
        </Text>
        <Text style={styles.office}>BALAI KESELAMATAN DAN KESEHATAN KERJA</Text>
      </View>
    </View>
    <Text style={styles.address}>
      Jalan Sentosa No. 09 Samarinda Telp./Fax. (0541) 771306, 732941 Samarinda
      75117
    </Text>
    <Text style={styles.website}>
      Laman: https://balaik3samarinda.kemnaker.go.id
    </Text>
  </View>
);
