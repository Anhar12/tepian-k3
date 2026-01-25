import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { Letterhead } from "../components/letterhead";
import type { OrderWithCompanyAndItems } from "@tepian-k3/types/order.types";
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
  logoUrl?: string;
}

export const OfferingLetterHeader: React.FC<OfferingLetterHeaderProps> = ({
  companyName,
  regencyName,
  letterNumber,
  referenceNumber,
  referenceDate,
  adminEmail,
  adminContact,
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
            <Text style={styles.value}>2 (dua) lembar</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Hal</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>Penawaran Pelaksanaan</Text>
          </View>
        </View>

        {/* Recipient */}
        <View style={styles.recipient}>
          <Text>Yth. Pimpinan Perusahaan</Text>
          <Text>{companyName}</Text>
          <Text>{regencyName}</Text>
        </View>

        {/* Body */}
        <Text style={styles.bodyText}>
          Sesuai dengan surat saudara nomor {referenceNumber} tanggal{" "}
          {format(new Date(referenceDate), "dd MMMM yyyy")} perihal Permohonan
          Pengajuan K3 Lingkungan Kerja, pada prinsipnya Balai Keselamatan dan
          Kesehatan Kerja Samarinda bersedia untuk melakukan pengujian
          keselamatan dan kesehatan kerja dengan hal-hal sebagai berikut:
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
        <View style={tw("flex-row justify-between items-start mt-8")}>
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
            <View style={tw("flex-row")}>
              <View style={tw("w-2/3 border-r border-black")}>
                <Text style={tw("text-[7px] p-2 text-center")}>
                  Pengendali Administrasi (Kasubbag Umum Balai K3 Samarinda)
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
      </Page>
    </Document>
  );
};
