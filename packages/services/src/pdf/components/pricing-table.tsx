import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { tw } from "../utils/tw";
import type { WorksheetTransactionDetail } from "@tepian-k3/types/worksheet.types";

type WorksheetItem = WorksheetTransactionDetail["items"][number];
type OperationalCost = WorksheetTransactionDetail["operationalCosts"][number];

interface PricingTableProps {
  items: WorksheetItem[];
  operationalCosts: OperationalCost[];
  showGrandTotal?: boolean;
}

const formatCurrency = (amount: number) =>
  amount.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

export const PricingTable: React.FC<PricingTableProps> = ({
  items,
  operationalCosts,
  showGrandTotal = true,
}) => {
  const totalServicesCost = items.reduce((total, item) => {
    return (
      total + (item.parameter ? item.parameter.price * (item.value ?? 0) : 0)
    );
  }, 0);

  const totalOperationalCost = operationalCosts.reduce((total, cost) => {
    return (
      total + (cost.unitCost ? cost.unitCost * cost.unitCount * cost.days : 0)
    );
  }, 0);

  return (
    <View>
      {/* Services Table */}
      <View style={tw("mb-6 border border-black")}>
        <View style={tw("flex-row border-b border-black")}>
          <Text style={tw("w-1/12 border-r border-black p-2 text-center")}>
            No.
          </Text>
          <Text style={tw("w-3/12 border-r border-black p-2 text-center")}>
            Jenis
          </Text>
          <View style={tw("w-2/12 border-r border-black p-2 text-center")}>
            <Text>Harga</Text>
            <Text>Parameter</Text>
          </View>
          <View style={tw("w-2/12 border-r border-black p-2 text-center")}>
            <Text>Jumlah</Text>
            <Text>Parameter</Text>
          </View>
          <View style={tw("w-2/12 border-r border-black p-2 text-center")}>
            <Text>Lokasi</Text>
            <Text>Pengujian</Text>
          </View>
          <Text style={tw("w-2/12 border-black p-2 text-center")}>Total</Text>
        </View>
        {/* Section Header */}
        <View style={tw("flex-row border-b border-black bg-gray-100")}>
          <Text style={tw("w-1/12 border-r border-black p-2 text-center")}>
            I
          </Text>
          <Text style={tw("w-11/12 p-2")}>Jasa Pelayanan Pengujian</Text>
        </View>
        {items.map((item, index) => (
          <View
            key={item.id}
            style={tw(
              `flex-row border-black ${
                index === items.length - 1 ? "" : "border-b"
              }`.trim(),
            )}
          >
            <Text style={tw("w-1/12 border-r border-black p-2 text-center")}>
              {index + 1}
            </Text>
            <Text style={tw("w-3/12 border-r border-black p-2")}>
              {item.parameter?.name || "-"}
            </Text>
            <Text style={tw("w-2/12 border-r border-black p-2 text-center")}>
              {item.parameter ? formatCurrency(item.parameter.price) : "-"}
            </Text>
            <Text style={tw("w-2/12 border-r border-black p-2 text-center")}>
              {item.value}
            </Text>
            <Text style={tw("w-2/12 border-r border-black p-2 text-center")}>
              {item.location ? item.location.name : "-"}
            </Text>
            <Text style={tw("w-2/12 border-black p-2 text-center")}>
              {item.value
                ? formatCurrency(item.value * item.parameter.price)
                : "-"}
            </Text>
          </View>
        ))}
        <View style={tw("flex-row border-t border-black")}>
          <Text
            style={tw(
              "w-10/12 border-r border-black p-2 font-bold text-center",
            )}
          >
            Total I
          </Text>
          <Text style={tw("w-2/12 p-2 font-bold text-center")}>
            {formatCurrency(totalServicesCost)}
          </Text>
        </View>
      </View>

      {/* Operational Cost Table */}
      {operationalCosts.length > 0 && (
        <View style={tw("mb-6 border border-black")}>
          <View style={tw("flex-row border-b border-black")}>
            <Text style={tw("w-1/12 border-r border-black p-2 text-center")}>
              No.
            </Text>
            <Text style={tw("w-3/12 border-r border-black p-2 text-center")}>
              Jenis
            </Text>
            <View style={tw("w-2/12 border-r border-black p-2 text-center")}>
              <Text>Harga</Text>
              <Text>Satuan</Text>
            </View>
            <View style={tw("w-2/12 border-r border-black p-2 text-center")}>
              <Text>Jumlah</Text>
              <Text>Orang</Text>
            </View>
            <View style={tw("w-2/12 border-r border-black p-2 text-center")}>
              <Text>Jumlah</Text>
              <Text>Hari</Text>
            </View>
            <Text style={tw("w-2/12 border-black p-2 text-center")}>
              Total
            </Text>
          </View>
          {/* Section Header */}
          <View style={tw("flex-row border-b border-black bg-gray-100")}>
            <Text style={tw("w-1/12 border-r border-black p-2 text-center")}>
              II
            </Text>
            <Text style={tw("w-11/12 p-2")}>Operasional Pengujian</Text>
          </View>
          {operationalCosts.map((cost, index) => (
            <View
              key={cost.id}
              style={tw(
                `flex-row border-black ${
                  index === operationalCosts.length - 1 ? "" : "border-b"
                }`.trim(),
              )}
            >
              <Text
                style={tw("w-1/12 border-r border-black p-2 text-center")}
              >
                {index + 1}
              </Text>
              <Text style={tw("w-3/12 border-r border-black p-2")}>
                {cost.item}
              </Text>
              <Text
                style={tw("w-2/12 border-r border-black p-2 text-center")}
              >
                {cost.unitCost != null ? formatCurrency(cost.unitCost) : "-"}
              </Text>
              <Text
                style={tw("w-2/12 border-r border-black p-2 text-center")}
              >
                {cost.unitCount}
              </Text>
              <Text
                style={tw("w-2/12 border-r border-black p-2 text-center")}
              >
                {cost.days}
              </Text>
              <Text style={tw("w-2/12 p-2 text-center")}>
                {cost.unitCost != null
                  ? formatCurrency(cost.unitCount * cost.unitCost * cost.days)
                  : "-"}
              </Text>
            </View>
          ))}
          <View style={tw("flex-row border-t border-black")}>
            <Text
              style={tw(
                "w-10/12 border-r border-black p-2 font-bold text-center",
              )}
            >
              Total II
            </Text>
            <Text style={tw("w-2/12 p-2 font-bold text-center")}>
              {formatCurrency(totalOperationalCost)}
            </Text>
          </View>
          {showGrandTotal && (
            <View style={tw("flex-row border-t border-black")}>
              <Text
                style={tw(
                  "w-10/12 border-r border-black p-2 font-bold text-center",
                )}
              >
                Grand Total
              </Text>
              <Text style={tw("w-2/12 p-2 font-bold text-center")}>
                {formatCurrency(totalServicesCost + totalOperationalCost)}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};
