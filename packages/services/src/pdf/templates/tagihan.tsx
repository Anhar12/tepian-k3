import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { tw } from "../utils/tw";
import { Letterhead } from "../components/letterhead";
import { LabeledField } from "../components/labeled-field";
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
  billingExpiryDate: string;
  operationalBankAccount?: string;
  operationalBankAccountName?: string;
}

const formatCurrency = (amount: number) =>
  amount.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

export const Tagihan: React.FC<TagihanProps> = ({
  companyName,
  companyRegency: _companyRegency,
  letterNumber,
  referenceNumber,
  referenceDate,
  billingCode,
  billingAmount,
  operationalAmount,
  billingExpiryDate,
  operationalBankAccount = "148-00-2495411-0",
  operationalBankAccountName = "RPL 046 PS Balai K3 SMD Utk Ops",
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
                value="1 (satu) Rangkap"
                labelWidth="w-16"
              />
            </View>
            <Text style={tw("text-[11px]")}>{today}</Text>
          </View>
        </View>

        {/* Recipient */}
        <View style={tw("mb-6")}>
          <Text>Yth. Pimpinan {companyName}</Text>
          <Text>di Tempat</Text>
        </View>

        {/* Body */}
        <Text style={tw("text-justify leading-relaxed mb-2")}>
          Merujuk surat Nomor {referenceNumber} tanggal {refDateFormatted}{" "}
          tentang Penawaran pelaksanaan pada perusahaan saudara, kami sampaikan
          hal-hal sebagai berikut:
        </Text>

        <View style={tw("ml-4 mb-4")}>
          {/* Poin 1 */}
          <View style={tw("flex-row mb-2")}>
            <Text style={tw("w-6")}>1.</Text>
            <Text style={tw("flex-1 text-justify leading-relaxed")}>
              Tagihan Biaya Pengujian dengan Kode Billing{" "}
              <Text style={tw("font-bold")}>{billingCode}</Text> sebesar{" "}
              {formatCurrency(billingAmount)}
            </Text>
          </View>

          {/* Poin 2 */}
          <View style={tw("flex-row mb-2")}>
            <Text style={tw("w-6")}>2.</Text>
            <Text style={tw("flex-1 text-justify leading-relaxed")}>
              Tagihan Biaya Operasional dibayarkan ke nomor rekening Bank
              Mandiri{" "}
              <Text style={tw("font-bold")}>{operationalBankAccount}</Text> an.{" "}
              <Text style={tw("font-bold")}>{operationalBankAccountName}</Text>{" "}
              sebesar {formatCurrency(operationalAmount)}
            </Text>
          </View>

          {/* Poin 3 */}
          <View style={tw("flex-row mb-2")}>
            <Text style={tw("w-6")}>3.</Text>
            <Text style={tw("flex-1 text-justify leading-relaxed")}>
              Pembayaran agar dilakukan sebelum masa kadaluarsa kode billing
              yaitu pada tanggal {expiryFormatted} (Bukti Pembuatan Tagihan PNBP
              Terlampir).
            </Text>
          </View>
        </View>

        {/* Closing */}
        <Text style={tw("mb-6")}>
          Demikian surat ini disampaikan. Atas perhatian dan kerja sama Saudara,
          kami ucapkan terima kasih.
        </Text>

        {/* Signature section */}
        <View style={tw("flex-row justify-end items-start mt-4")}>
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
          <Text style={tw("text-[8px]")}>
            4. Bukti pembayaran dapat dikirimkan melalui email
            bk3samarinda@kemnaker.go.id / ke no Whatsapp Admin pengujian
            0821-2261-9630 dengan mencantumkan nomor tagihan dan nama
            perusahaan/ instansi.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
