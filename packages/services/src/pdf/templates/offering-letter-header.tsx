import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { Letterhead } from "../components/letterhead";
import { storageService } from "../../storage";
import { registerLiberationSans } from "../fonts/register-liberation-sans";
import { tw } from "../utils/tw";
import { format } from "date-fns";

registerLiberationSans();

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: "Liberation Sans",
  },
  section: {
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    marginBottom: 0,
  },
  label: {
    width: 80,
  },
  colon: {
    width: 20,
  },
  value: {
    flex: 1,
  },
  recipient: {
    marginTop: 20,
    marginBottom: 20,
  },
  bodyText: {
    textAlign: "justify",
    lineHeight: 0,
    marginBottom: 10,
  },
  numberedList: {
    marginLeft: 20,
    marginBottom: 10,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 2,
    textAlign: "justify",
  },
  listNumber: {
    width: 25,
  },
  listContent: {
    flex: 1,
    lineHeight: 0,
  },
  closing: {
    marginTop: 20,
    marginBottom: 20,
  },
  signatureContainer: {
    flexDirection: "row",
  },
  signatureTable: {
    width: "50%",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#000",
  },
  signatureRowHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  signatureRow: {
    flexDirection: "row",
    // borderBottomWidth: 1,
    // borderBottomColor: "#000",
  },
  signatureCell: {
    flex: 1,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#000",
    textAlign: "center",
    fontSize: 10,
  },
  signatureCellLast: {
    borderRightWidth: 0,
  },
  signatureSpace: {
    height: 60,
  },
});

interface OfferingLetterHeaderProps {
  companyName: string;
  regencyName: string;
  letterNumber: string;
  referenceNumber: string;
  referenceDate: string;
  adminEmail: string;
  adminContact: string;
  companyRepName?: string;
  companyRepPosition?: string;
  logoUrl?: string;
}

export const OfferingLetterHeader: React.FC<OfferingLetterHeaderProps> = ({
  companyName,
  regencyName: _regencyName,
  letterNumber,
  referenceNumber,
  referenceDate,
  adminEmail,
  adminContact,
  companyRepName: _companyRepName,
  companyRepPosition: _companyRepPosition,
  logoUrl,
}) => {
  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Letterhead
          logoUrl={
            logoUrl
              ? logoUrl
              : storageService.getAssetUrl("assets/kemnaker.png")
          }
        />

        {/* Letter Details */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Nomor</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{letterNumber}</Text>
            <Text>{today}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Sifat</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>Biasa</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Lampiran</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>1 (satu) Rangkap</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Hal</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>Penawaran Pelaksanaan</Text>
          </View>
        </View>

        {/* Recipient */}
        <View style={styles.recipient}>
          <Text>Yth. Pimpinan</Text>
          <Text>{companyName}</Text>
          <Text>di Tempat</Text>
        </View>

        {/* Body */}
        <Text style={styles.bodyText}>
          Sesuai dengan permohonan saudara nomor {referenceNumber} tanggal{" "}
          {referenceDate
            ? format(new Date(referenceDate), "dd MMMM yyyy")
            : "-"}{" "}
          perihal Permohonan Pengujian K3, pada prinsipnya Balai Keselamatan dan
          Kesehatan Kerja Samarinda bersedia untuk melakukan pengujian tersebut
          dengan hal-hal sebagai berikut:
        </Text>

        {/* Numbered List */}
        <View style={styles.numberedList}>
          <View style={styles.listItem}>
            <Text style={styles.listNumber}>1.</Text>
            <Text style={styles.listContent}>
              Pihak perusahaan menyetujui penawaran biaya pelaksanaan pengujian
              dan ditandatangani kemudian dibuatkan Surat Perjanjian Kerjasama
              (SPK) dan ditandatangani kedua belah pihak dikirimkan melalui
              email: {adminEmail}
              (format SPK terlampir).
            </Text>
          </View>

          <View style={styles.listItem}>
            <Text style={styles.listNumber}>2.</Text>
            <Text style={styles.listContent}>
              Balai Keselamatan dan Kesehatan Kerja Samarinda akan menerbitkan
              tagihan dan kode billing pembayaran pengujian yang disetujui oleh
              perusahaan, serta SPK untuk ditandatangani kedua belah pihak
              sebelum pelaksanaan pengujian. (Peraturan Menteri Keuangan Nomor
              6/PMK.02/2023, Tentang Jenis dan Tarif Penerimaan Negara Bukan
              Pajak yang Bersifat Volatil yang Berlaku pada Kementerian
              Ketenagakerjaan).
            </Text>
          </View>

          <View style={styles.listItem}>
            <Text style={styles.listNumber}>3.</Text>
            <Text style={styles.listContent}>
              Penjadwalan dan penunjukan petugas pengujian akan dilakukan oleh
              Petugas Penjadwalan setelah dilakukan pembayaran penuh oleh
              perusahaan. (Surat Ditjen Binwasnaker dan K3
              No.329/BINWASK3/X/2016, Tgl. 14 Oktober 2016, Tentang Pelaksanaan
              Kegiatan PNBP).
            </Text>
          </View>

          <View style={styles.listItem}>
            <Text style={styles.listNumber}>4.</Text>
            <Text style={styles.listContent}>
              Untuk konfirmasi pembayaran atau informasi lebih lanjut
              disampaikan melalui email {adminEmail} atau Nomor Whatsapp Admin
              Pengujian {adminContact}.
            </Text>
          </View>

          <View style={styles.listItem}>
            <Text style={styles.listNumber}>5.</Text>
            <Text style={styles.listContent}>
              Biaya operasional akan ditransfer kembali apabila terdapat sisa
              dana setelah pengujian dilaksanakan. Mohon perusahaan dapat
              menyampaikan nomor rekening pengembalian pada lembar lampiran
              biaya dan akan dibuatkan Berita Acara Pengembalian Biaya.
            </Text>
          </View>

          <View style={styles.listItem}>
            <Text style={styles.listNumber}>6.</Text>
            <Text style={styles.listContent}>
              Balai Keselamatan dan Kesehatan Kerja Samarinda akan melakukan
              pengujian sesuai dengan standar, prosedur dan ketentuan yang
              berlaku dan berkomitmen mewujudkan wilayah bebas dari korupsi
              dengan menjaga integritas semua petugas dalam memberikan pelayanan
              yang optimal dan profesional.
            </Text>
          </View>
        </View>

        {/* Closing */}
        <Text style={tw("my-5")}>
          Atas perhatian dan kerja sama yang baik, diucapkan terima kasih.
        </Text>

        {/* Signature  */}
        <View style={tw("flex-row justify-end items-start mt-8")}>
          {/* Head Signature */}
          <View style={tw("items-center w-5/12")}>
            <Text style={tw("text-[10px] font-bold text-center")}>
              Kepala Balai
            </Text>
            <Text style={tw("text-[10px] font-bold text-center mb-16")}>
              Keselamatan dan Kesehatan Kerja Samarinda,
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
