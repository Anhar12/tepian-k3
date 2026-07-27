import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { tw } from "../utils/tw";

export const TteSrikandi: React.FC = () => {
  return (
    <View style={tw("mt-4 p-2 w-5/12")}>
      <Text style={tw("text-[8px] text-justify text-gray-800 leading-normal")}>
        Dokumen ini telah ditandatangani secara elektronik yang diterbitkan oleh
        Balai Sertifikasi Elektronik (BSrE), BSSN.
      </Text>
    </View>
  );
};
