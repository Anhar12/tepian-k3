import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { tw } from "../utils/tw";

interface HeadSignatureProps {
  width?: string;
  spacing?: string;
}

export const HeadSignature: React.FC<HeadSignatureProps> = ({
  width = "w-4/12",
  spacing = "mb-12",
}) => {
  return (
    <View style={tw(`items-center ${width}`)}>
      <Text style={tw("text-[10px] font-bold text-center")}>Kepala Balai</Text>
      <Text style={tw("text-[10px] font-bold text-center")}>
        Keselamatan dan Kesehatan Kerja
      </Text>
      <Text style={tw(`text-[10px] font-bold text-center ${spacing}`)}>
        Samarinda
      </Text>

      <Text style={tw("text-[10px] text-center underline")}>
        dr. Erwin Anjasmara lchsan, M.K.M.
      </Text>
      <Text style={tw("text-[10px] text-center")}>
        NIP. 19760718 200312 1 001
      </Text>
    </View>
  );
};
