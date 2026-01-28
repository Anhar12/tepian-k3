import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import type { WorksheetTransactionDetail } from "@tepian-k3/types/worksheet.types";
import { tw } from "../utils/tw";
import { PricingTable } from "../components/pricing-table";

interface OfferingLetterProps {
  worksheet: WorksheetTransactionDetail;
  companyName: string;
  letterNumber: string;
}

export const OfferingLetter: React.FC<OfferingLetterProps> = ({
  worksheet,
  companyName,
  letterNumber,
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
            <Text style={tw("text-[12px]")}>
              Surat Kepala Balai K3 Nomor {letterNumber}
            </Text>
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

        {/* Signature  */}
        <View style={tw("flex-row justify-between items-start mt-8")}>
          {/* Company Signature */}
          <View style={tw("items-center w-4/12")}>
            <Text style={tw("text-[10px] font-bold text-center")}>
              Menyetujui,
            </Text>
            <Text style={tw("text-[10px] font-bold text-center mb-12")}>
              {companyName}
            </Text>

            <Text style={tw("text-[10px] text-center")}>
              (_________________________)
            </Text>
          </View>

          {/* Signature Table */}
          <View style={tw("w-5/12 border border-black")}>
            <View style={tw("flex-row border-b border-black")}>
              <Text
                style={tw(
                  "text-[7px] p-2 border-r border-black w-2/3 text-center",
                )}
              >
                Penanggungjawab
              </Text>
              <Text
                style={tw(
                  "text-[7px] p-2 border-r border-black w-1/3 text-center",
                )}
              >
                Paraf
              </Text>
              <Text style={tw("text-[7px] p-2 w-1/3 text-center")}>
                Tanggal
              </Text>
            </View>
            <View style={tw("flex-row border-b border-black")}>
              <View style={tw("w-2/3 border-r border-black p-2")}>
                <Text style={tw("text-[7px] text-center")}>Pengendali</Text>
                <Text style={tw("text-[7px] text-center")}>Administrasi</Text>
                <Text style={tw("text-[7px] text-center")}>
                  (Kasubbag Umum Balai K3 Samarinda)
                </Text>
              </View>
              <View style={tw("w-1/3 border-r border-black h-16")} />
              <View style={tw("w-1/3 h-16")} />
            </View>
            <View style={tw("flex-row")}>
              <View style={tw("w-2/3 border-r border-black p-2")}>
                <Text style={tw("text-[7px] text-center")}>Pengendali</Text>
                <Text style={tw("text-[7px] text-center")}>Teknis</Text>
                <Text style={tw("text-[7px] text-center")}>
                  (Sub Koordinator Pengujian Balai K3 Samarinda)
                </Text>
              </View>
              <View style={tw("w-1/3 border-r border-black h-16")} />
              <View style={tw("w-1/3 h-16")} />
            </View>
          </View>

          {/* Head Signature */}
          <View style={tw("items-center w-4/12")}>
            <Text style={tw("text-[10px] font-bold text-center")}>
              Kepala Balai
            </Text>
            <Text style={tw("text-[10px] font-bold text-center")}>
              Keselamatan dan Kesehatan Kerja
            </Text>
            <Text style={tw("text-[10px] font-bold text-center mb-12")}>
              Samarinda
            </Text>

            <Text style={tw("text-[10px] text-center underline")}>
              dr. Erwin Anjasmara lchsan, M.K.M.
            </Text>
            <Text style={tw("text-[10px] text-center")}>
              NIP. 19760718 200312 1 001
            </Text>
          </View>
        </View>

        {/* Refund Bank Info */}
        <View style={tw("mt-8")}>
          <Text style={tw("text-[10px] mb-2")}>
            * Nomor rekening pengembalian sisa dana operasional
          </Text>
          <View style={tw("flex-row items-center mb-1")}>
            <Text style={tw("text-[10px] w-32")}>Nama Bank</Text>
            <Text style={tw("text-[10px] mx-2")}>:</Text>
            <Text style={tw("text-[10px]")}>________________________</Text>
          </View>
          <View style={tw("flex-row items-center mb-1")}>
            <Text style={tw("text-[10px] w-32")}>Nomor Rekening</Text>
            <Text style={tw("text-[10px] mx-2")}>:</Text>
            <Text style={tw("text-[10px]")}>________________________</Text>
          </View>
          <View style={tw("flex-row items-center mb-1")}>
            <Text style={tw("text-[10px] w-32")}>Atas Nama</Text>
            <Text style={tw("text-[10px] mx-2")}>:</Text>
            <Text style={tw("text-[10px]")}>________________________</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
