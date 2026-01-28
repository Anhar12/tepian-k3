import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { tw } from "../utils/tw";
import { Letterhead } from "../components/letterhead";
import { LabeledField } from "../components/labeled-field";
import { SignatureTable } from "../components/signature-table";
import { HeadSignature } from "../components/head-signature";
import { storageService } from "../../storage";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface TagihanProps {
  companyName: string;
  companyRegency: string;
  letterNumber: string;
  referenceNumber: string;
  referenceDate: string;
  billingCode: string;
  billingAmount: number;
  operationalAmount: number;
  operationalBankAccount: string;
  operationalBankAccountName: string;
  billingExpiryDate: string;
  adminEmail: string;
  adminContact: string;
}

const formatCurrency = (amount: number) =>
  amount.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

export const Tagihan: React.FC<TagihanProps> = ({
  companyName,
  companyRegency,
  letterNumber,
  referenceNumber,
  referenceDate,
  billingCode,
  billingAmount,
  operationalAmount,
  operationalBankAccount,
  operationalBankAccountName,
  billingExpiryDate,
  adminEmail,
  adminContact,
}) => {
  const today = format(new Date(), "dd MMMM yyyy", { locale: id });
  const refDateFormatted = format(new Date(referenceDate), "dd MMMM yyyy", {
    locale: id,
  });
  const expiryFormatted = format(
    new Date(billingExpiryDate),
    "dd MMMM yyyy 'waktu' HH:mm:ss",
    { locale: id },
  );

  return (
    <Document>
      <Page size="A4" style={tw("p-10 text-[11px] font-sans")}>
        <Letterhead
          logoUrl={storageService.getAssetUrl("assets/kemnaker.png")}
        />

        {/* Letter Details */}
        <View style={tw("mb-4")}>
          <View style={tw("flex-row")}>
            <View style={tw("flex-1")}>
              <LabeledField
                label="Nomor"
                value={letterNumber}
                labelWidth="w-16"
              />
              <LabeledField label="Sifat" value="Biasa" labelWidth="w-16" />
              <LabeledField
                label="Hal"
                value="Tagihan Biaya Pengujian dan Operasional"
                labelWidth="w-16"
              />
              <LabeledField
                label="Lampiran"
                value="2 (dua) Lembar"
                labelWidth="w-16"
              />
            </View>
            <Text style={tw("text-[11px]")}>{today}</Text>
          </View>
        </View>

        {/* Recipient */}
        <View style={tw("mb-6")}>
          <Text>Yth. Pimpinan</Text>
          <Text>{companyName}</Text>
          <Text>di {companyRegency}</Text>
        </View>

        {/* Body */}
        <Text style={tw("text-justify leading-relaxed mb-4")}>
          Merujuk surat Nomor {referenceNumber} tanggal {refDateFormatted} hal
          Penawaran pelaksanaan dari perusahaan saudara, dengan ini kami
          sampaikan Tagihan Biaya Pengujian dengan Kode Billing{" "}
          <Text style={tw("font-bold")}>{billingCode}</Text> sebesar{" "}
          {formatCurrency(billingAmount)},-. dan untuk biaya operasional ke
          nomor rekening{" "}
          <Text style={tw("font-bold")}>{operationalBankAccount}</Text> an.{" "}
          <Text style={tw("font-bold")}>{operationalBankAccountName}</Text>{" "}
          sebesar {formatCurrency(operationalAmount)},-. Pembayaran agar
          dilakukan sebelum masa kadaluarsa kode billing yaitu pada tanggal{" "}
          {expiryFormatted} (Terlampir)
        </Text>

        {/* Closing */}
        <Text style={tw("text-center mb-6")}>
          Demikian disampaikan atas perhatian dan kerjasamanya diucapkan
          terimakasih.
        </Text>

        {/* Signature section */}
        <View style={tw("flex-row justify-between items-start mt-4")}>
          {/* Signature Table */}
          <SignatureTable
            rows={[
              {
                role: "Pengendali Administrasi (Kasubbag Tata Usaha Balai K3 Samarinda)",
              },
            ]}
            className="w-5/12"
          />

          {/* Head Signature */}
          <HeadSignature width="w-5/12" spacing="mb-16" />
        </View>

        {/* Footer Notes */}
        <View style={tw("mt-8 border-t border-gray-300 pt-4")}>
          <Text style={tw("text-[8px] mb-1")}>Catatan:</Text>
          <Text style={tw("text-[8px] mb-1")}>
            1. Balai K3 Samarinda tidak diwajibkan memungut PPN maupun
            menerbitkan faktur pajak (referensi sesuai surat dari Kantor
            Pelayanan Pajak Pratama No.S-342 G/WPJ.14/KP.0207/2013 )
          </Text>
          <Text style={tw("text-[8px] mb-1")}>
            2. Pembayaran dengan kode billing dapat dilakukan melalui teller
            bank, loket kantor pos, ATM, e-banking.
          </Text>
          <Text style={tw("text-[8px] mb-1")}>
            3. Kode billing hanya berlaku dalam 7 (tujuh) hari apabila dalam
            jangka waktu tersebut belum dilakukan pembayaran maka kode billing
            akan tertutup otomatis dan permintaan pengujian tidak dapat
            diproses.
          </Text>
          {/* <Text style={tw("text-[8px]")}>
            4. Bukti pembayaran dapat dikirimkan melalui email {adminEmail} / ke
            no Whatsapp Admin pengujian {adminContact} dengan mencantumkan nomor
            tagihan dan nama perusahaan/instansi.
          </Text> */}
          <Text style={tw("text-[8px]")}>
            4. Bukti pembayaran dapat dikirimkan melalui email HYPERLINK
            "mailto:bk3samarinda@kemnaker.go.id" bk3samarinda@kemnaker.go.id /
            ke no Whatsapp Admin pengujian 0821-2261-9630 dengan mencantumkan
            nomor tagihan dan nama perusahaan/ instansi.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
