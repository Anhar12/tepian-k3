import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import type { WorksheetTransactionDetail } from "@tepian-k3/types/pengujian/worksheet.types";
import { tw } from "../utils/tw";
import { PricingTable } from "../components/pricing-table";

interface OfferingLetterProps {
  worksheet: WorksheetTransactionDetail;
  companyName: string;
  letterNumber: string;
  companyBankName: string;
  companyBankAccount: string;
  companyBankAccountName: string;
  companyRepName?: string;
  companyRepPosition?: string;
}

export const OfferingLetter: React.FC<OfferingLetterProps> = ({
  worksheet,
  companyName,
  letterNumber,
  companyBankName: _companyBankName,
  companyBankAccount: _companyBankAccount,
  companyBankAccountName: _companyBankAccountName,
  companyRepName,
  companyRepPosition,
}) => {
  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={tw("p-4 text-[11px] font-sans")}>
        {/*  Header with letterhead */}
        <View style={tw("mb-4 flex-col justify-between items-center")}>
          <View style={tw("flex-row justify-between items-center gap-2")}>
            <Text style={tw("text-[12px]")}>Lampiran</Text>
            <Text style={tw("text-[12px]")}>:</Text>
            <Text style={tw("text-[12px]")}>{letterNumber}</Text>
          </View>

          <View style={tw("flex-row justify-between items-center gap-2")}>
            <Text style={tw("text-[12px]")}>Tanggal</Text>
            <Text style={tw("text-[12px]")}>:</Text>
            <Text style={tw("text-[12px]")}>{today}</Text>
          </View>
        </View>

        {/* Header */}
        <View style={tw("items-center mb-4")}>
          <Text style={tw("text-[12px] font-bold")}>
            Penawaran harga biaya jasa dan operasional pelaksanaan pengujian K3
            pada
          </Text>
          <Text style={tw("text-[12px] font-bold")}>{companyName}</Text>
        </View>

        {/* Pricing Tables */}
        <PricingTable
          items={worksheet.items}
          operationalCosts={worksheet.operationalCosts}
        />

        {/* Signatures on Lampiran */}
        <View
          style={tw("flex-row justify-between items-start mt-12")}
          wrap={false}
        >
          {/* Company Signature */}
          <View style={tw("items-center w-5/12")}>
            <Text style={tw("text-[10px] font-bold text-center")}>
              Menyetujui,
            </Text>
            <Text style={tw("text-[10px] font-bold text-center mb-16")}>
              {companyName}
            </Text>

            <Text style={tw("text-[10px] text-center underline")}>
              {companyRepName || "(_________________________)"}
            </Text>
            {companyRepPosition && (
              <Text style={tw("text-[10px] text-center")}>
                {companyRepPosition}
              </Text>
            )}
          </View>

          {/* Head Signature */}
          <View style={tw("items-center w-5/12")}>
            <Text style={tw("text-[10px] font-bold text-center mb-16")}>
              Kepala Balai K3 Samarinda,
            </Text>

            <Text style={tw("text-[10px] text-center underline")}>
              dr. Erwin Anjasmara Ichsan, M.K.M.
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
