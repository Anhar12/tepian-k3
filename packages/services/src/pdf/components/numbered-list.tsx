import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { tw } from "../utils/tw";

interface NumberedListProps {
  items: string[];
}

export const NumberedList: React.FC<NumberedListProps> = ({ items }) => {
  return (
    <View style={tw("flex flex-col flex-1")}>
      {items.map((item, index) => (
        <View style={tw("flex flex-row mb-1")} key={index}>
          <Text style={tw("text-[11px] w-5")}>{index + 1}.</Text>
          <Text style={tw("text-[11px] flex-1 text-justify")}>{item}</Text>
        </View>
      ))}
    </View>
  );
};
