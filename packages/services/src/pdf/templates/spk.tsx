import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import type { WorksheetTransactionDetail } from "@tepian-k3/types/pengujian/worksheet.types";
import { tw } from "../utils/tw";
import { Letterhead } from "../components/letterhead";
import { SectionHeader } from "../components/section-header";
import { LabeledField } from "../components/labeled-field";
import { PricingTable } from "../components/pricing-table";
import { storageService } from "../../storage";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface SpkProps {
  worksheet: WorksheetTransactionDetail;
  companyName: string;
  letterNumber: string;
  agreementDate: string;
  companyRepName: string;
  companyRepPosition: string;
  companyRepAddress: string;
  companyBankName: string;
  companyBankAccount: string;
  companyBankAccountName: string;
  operationalBankName: string;
  operationalBankAccount: string;
  operationalBankAccountName: string;
}

const formatDateSpelled = (dateStr: string) => {
  const date = new Date(dateStr);
  return format(date, "EEEE", { locale: id });
};

const formatDateFull = (dateStr: string) => {
  const date = new Date(dateStr);
  return format(date, "dd MMMM yyyy", { locale: id });
};

export const Spk: React.FC<SpkProps> = ({
  worksheet,
  companyName,
  letterNumber,
  agreementDate,
  companyRepName,
  companyRepPosition,
  companyRepAddress,
  companyBankName,
  companyBankAccount,
  companyBankAccountName,
  operationalBankName,
  operationalBankAccount,
  operationalBankAccountName,
}) => {
  const dayName = formatDateSpelled(agreementDate);
  const dateFull = formatDateFull(agreementDate);

  return (
    <Document>
      {/* Page 1: Header + Parties + Legal Basis */}
      <Page size="A4" style={tw("p-10 text-[11px] font-sans")}>
        <Letterhead
          logoUrl={storageService.getAssetUrl("assets/kemnaker.png")}
        />

        <SectionHeader
          text="SURAT PERJANJIAN KERJA SAMA"
          fontSize="text-[12px]"
          bold
          body="PENDAYAGUNAAN FASILITAS LAYANAN BALAI K3 SAMARINDA"
          bodyBold
          bodyUnderline
          spacing="mb-0"
        />
        <View style={tw("items-center mb-4")}>
          <Text style={tw("text-[11px] font-bold")}>
            NOMOR : {letterNumber}
          </Text>
        </View>

        {/* Opening paragraph */}
        <Text style={tw("text-justify mb-4 leading-relaxed")}>
          Pada hari {dayName} Tanggal {dateFull}, kami yang bertanda tangan
          dibawah ini :
        </Text>

        {/* Party I - Pihak Pertama (static) */}
        <View style={tw("mb-4 ml-4")}>
          <View style={tw("flex-row mb-2 w-full")}>
            <Text style={tw("font-bold")}>I.</Text>
            <View style={tw("ml-6")}>
              <LabeledField
                label="Nama"
                value="dr. Erwin Anjasmara Ichsan, M.K.M"
                labelWidth="w-28"
                valueWidth="w-full"
              />
              <LabeledField
                label="Jabatan"
                value="Kepala Balai Keselamatan dan Kesehatan Kerja Samarinda"
                labelWidth="w-28"
                valueWidth="w-full"
              />
              <LabeledField
                label="Alamat Kantor"
                value="Jl. Sentosa No. 09 Samarinda"
                labelWidth="w-28"
                valueWidth="w-full"
              />
            </View>
          </View>
          <Text style={tw("mt-2 text-justify leading-relaxed ml-6")}>
            Dalam hal ini bertindak atas nama/mewakili Balai Keselamatan dan
            Kesehatan Kerja Samarinda, yang selanjutnya disebut PIHAK PERTAMA,
          </Text>
        </View>

        {/* Party II - Pihak Kedua (dynamic) */}
        <View style={tw("mb-4 ml-4")}>
          <View style={tw("flex-row mb-2 w-full")}>
            <Text style={tw("font-bold mb-2")}>II.</Text>
            <View style={tw("ml-6")}>
              <LabeledField
                label="Nama"
                value={companyRepName}
                labelWidth="w-28"
                valueWidth="w-full"
              />
              <LabeledField
                label="Jabatan"
                value={companyRepPosition}
                labelWidth="w-28"
                valueWidth="w-full"
              />
              <LabeledField
                label="Alamat"
                value={companyRepAddress}
                labelWidth="w-28"
                valueWidth="w-full"
              />
            </View>
          </View>
          <Text style={tw("mt-2 text-justify leading-relaxed ml-6")}>
            Dalam hal ini bertindak atas nama/mewakili {companyName} selanjutnya
            disebut PIHAK KEDUA,
          </Text>
          <Text style={tw("mt-2 text-justify leading-relaxed ml-6")}>
            PIHAK PERTAMA dan PIHAK KEDUA bertindak secara bersama-sama disebut
            "PARA PIHAK" dan bertindak secara sendiri-sendiri disebut sebagai
            "PIHAK".
          </Text>
        </View>

        {/* Legal basis paragraph */}
        <Text style={tw("text-justify leading-relaxed mb-4")}>
          Berdasarkan{" "}
          <Text style={tw("font-bold")}>
            Peraturan Menteri Keuangan Nomor 6/PMK.02/2023
          </Text>{" "}
          Tentang Jenis dan Tarif Atas Jenis Penerimaan Negara Bukan Pajak yang
          Bersifat Volatil Yang Berlaku di Lingkungan Kemnaker dan{" "}
          <Text style={tw("font-bold")}>
            Peraturan Menteri Keuangan Republik Indonesia Nomor 32 Tahun 2025
          </Text>{" "}
          tentang Standar Biaya Masukan Tahun Anggaran 2026, sepakat mengikat
          dalam Perjanjian Kerja sama tentang Pendayagunaan Fasilitas Balai
          Keselamatan dan Kesehatan Kerja Samarinda.
        </Text>
      </Page>

      {/* Page 2: Pasal 1 to Pasal 8 + Signatures */}
      <Page size="A4" style={tw("p-10 text-[11px] font-sans")}>
        {/* Pasal 1 */}
        <SectionHeader text="Pasal 1" underline bold />
        <SectionHeader text="Ruang Lingkup Pekerjaan" bold spacing="mb-2" />
        <Text style={tw("mb-2")}>Ruang lingkup pekerjaan ini meliputi :</Text>
        <View style={tw("ml-4 mb-4")}>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            a. Pelaksanaan kegiatan pengujian dan/atau pengambilan sampel di
            lokasi kerja PIHAK KEDUA.
          </Text>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            b. Pengujian meliputi jumlah titik dan parameter sebagaimana
            tercantum dalam lampiran penawaran biaya jasa dan operasional
            pengujian K3.
          </Text>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            c. Penyusunan laporan hasil pengujian sesuai dengan prosedur dan
            standar Balai K3 Samarinda.
          </Text>
        </View>

        {/* Pasal 2 */}
        <SectionHeader text="Pasal 2" underline bold />
        <SectionHeader text="Hak dan Kewajiban" bold spacing="mb-2" />

        <Text style={tw("font-bold mb-2")}>
          a. Hak dan Kewajiban PIHAK PERTAMA
        </Text>
        <View style={tw("ml-4 mb-4")}>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            - Menerima pembayaran biaya jasa dan operasional sesuai dengan
            peraturan yang berlaku.
          </Text>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            - Menerbitkan tagihan biaya uji apabila terjadi penambahan
            parameter/jumlah titik pengujian pada saat pelaksanaan pengujian.
          </Text>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            - Menentukan jadwal pelaksanaan kegiatan pengujian.
          </Text>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            - Melaksanakan kegiatan pengujian sesuai dengan standar dan metode
            yang telah ditetapkan serta peraturan perundang-undangan yang
            berlaku.
          </Text>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            - Menjaga kerahasian segala informasi dan data PIHAK KEDUA.
          </Text>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            - Menyampaikan laporan hasil pengujian kepada PIHAK KEDUA dalam
            jangka 30 (tiga puluh) hari kerja setelah pelaksanaan pengujian.
          </Text>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            - apabila terdapat sisa dana dari pelaksanaan kegiatan kepada PIHAK
            KEDUA paling lambat 14 hari kerja setelah dilakukan rekonsiliasi
            biaya.
          </Text>
        </View>

        <Text style={tw("font-bold mb-2")}>
          b. Hak dan Kewajiban PIHAK KEDUA
        </Text>
        <View style={tw("ml-4 mb-4")}>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            - Melakukan pembayaran biaya jasa pengujian melalui e-billing
            (SIMPONI) dan biaya operasional ke Rekening Penampungan Lainnya.
          </Text>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            - Mendapatkan pelayanan pengujian.
          </Text>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            - Mendapatkan laporan hasil uji dari PIHAK PERTAMA.
          </Text>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            - Menerima pengembalian kelebihan dana operasional apabila terdapat
            sisa dana operasional dari pelaksanaan kegiatan dari PIHAK PERTAMA
            pada nomor rekening :
          </Text>
          <View style={tw("ml-6 mb-2")}>
            <View style={tw("flex-row mb-1")}>
              <Text style={tw("w-28")}>Nama Bank</Text>
              <Text style={tw("mx-2")}>:</Text>
              <Text style={tw("font-bold")}>{companyBankName}</Text>
            </View>
            <View style={tw("flex-row mb-1")}>
              <Text style={tw("w-28")}>No. Rekening</Text>
              <Text style={tw("mx-2")}>:</Text>
              <Text style={tw("font-bold")}>{companyBankAccount}</Text>
            </View>
            <View style={tw("flex-row mb-1")}>
              <Text style={tw("w-28")}>Nama Rekening</Text>
              <Text style={tw("mx-2")}>:</Text>
              <Text style={tw("font-bold")}>{companyBankAccountName}</Text>
            </View>
          </View>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            - Memastikan lokasi/titik pengujian siap untuk dilakukan pengambilan
            sampel uji.
          </Text>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            - Menyediakan akomodasi selama pelaksanaan kegiatan pengujian.
          </Text>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            - Membayar biaya penambahan parameter/titik lokasi pengujian kepada
            PIHAK PERTAMA apabila terjadi penambahan parameter/titik pengujian
            sesuai dengan kesepakatan Para Pihak dan dituangkan dalam berita
            acara pengambilan sampel.
          </Text>
        </View>

        <SectionHeader text="Pasal 3" underline bold />
        <SectionHeader text="Biaya dan Pembayaran" bold spacing="mb-2" />

        <View style={tw("ml-4 mb-4")}>
          <Text style={tw("mb-2 text-justify leading-relaxed")}>
            a. Biaya pengujian dibayarkan melalui kode billing yang telah
            diterbitkan.
          </Text>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            b. Biaya operasional pengujian dibayarkan ke rekening :
          </Text>
          <View style={tw("ml-6 mb-2")}>
            <View style={tw("flex-row mb-1")}>
              <Text style={tw("w-28")}>Nama Bank</Text>
              <Text style={tw("mx-2")}>:</Text>
              <Text style={tw("font-bold")}>{operationalBankName}</Text>
            </View>
            <View style={tw("flex-row mb-1")}>
              <Text style={tw("w-28")}>No. Rekening</Text>
              <Text style={tw("mx-2")}>:</Text>
              <Text style={tw("font-bold")}>{operationalBankAccount}</Text>
            </View>
            <View style={tw("flex-row mb-1")}>
              <Text style={tw("w-28")}>Nama Rekening</Text>
              <Text style={tw("mx-2")}>:</Text>
              <Text style={tw("font-bold")}>{operationalBankAccountName}</Text>
            </View>
          </View>
          <Text style={tw("mb-2 text-justify leading-relaxed")}>
            c. Pembayaran biaya pengujian dan operasional dilakukan tidak lebih
            dari 7 (tujuh) hari selama masa berlaku kode billing.
          </Text>
          <Text style={tw("mb-2 text-justify leading-relaxed")}>
            d. Apabila biaya pengujian sudah dibayarkan oleh PIHAK KEDUA maka
            kegiatan pengujian tidak dapat dibatalkan.
          </Text>
          <Text style={tw("mb-2")}>e. Rincian Biaya Pengujian :</Text>
        </View>

        {/* Pricing Tables (reused from offering letter) */}
        <PricingTable
          items={worksheet.items}
          operationalCosts={worksheet.operationalCosts}
        />

        {/* Pasal 4 */}
        <SectionHeader text="Pasal 4" underline bold />
        <SectionHeader text="Jangka Waktu" bold spacing="mb-2" />
        <View style={tw("ml-4 mb-4")}>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            a. Kesepakatan kerja ini berlaku selama 1 (satu) kali kegiatan
            pengujian terhitung sejak ditandatangani oleh PARA PIHAK.
          </Text>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            b. PIHAK PERTAMA menetapkan jadwal/waktu Pengujian maksimal 5 (lima)
            hari kerja setelah menerima konfirmasi pembayaran biaya uji dari
            PIHAK KEDUA
          </Text>
        </View>

        {/* Pasal 5 */}
        <SectionHeader text="Pasal 5" underline bold />
        <SectionHeader text="Sanksi dan Denda" bold spacing="mb-2" />
        <View style={tw("ml-4 mb-4")}>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            a. Jika PIHAK KEDUA melakukan pembatalan kegiatan pengujian maka
            PIHAK KEDUA tidak dapat menarik kembali seluruh biaya pengujian yang
            telah dibayarkan.
          </Text>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            b. Jika PIHAK PERTAMA tidak dapat menyelesaikan laporan hasil uji
            dalam jangka waktu yang sudah ditetapkan maka PIHAK KEDUA berhak
            mendapatkan layanan konsultasi hasil pengujian secara gratis.
          </Text>
        </View>

        {/* Pasal 6 */}
        <SectionHeader text="Pasal 6" underline bold />
        <SectionHeader
          text="Keadaan Memaksa (Force Majore)"
          bold
          spacing="mb-2"
        />
        <View style={tw("ml-4 mb-4")}>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            a. Jika hal-hal diluar kemampuan (force majore) yang mempengaruhi
            kontrak kerjasama ini, maka PIHAK PERTAMA segera melaporkan hal
            tersebut kepada PIHAK KEDUA dalam jangka waktu 2 x 24 jam setelah
            kejadian dengan pengesahan pejabat setempat yang berwenang.
          </Text>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            b. Yang dimaksud (force majore), adalah:
          </Text>
          <View style={tw("ml-4")}>
            <Text style={tw("mb-1")}>
              - Bencana alam seperti gempa bumi, angin topan, banjir dan
              lain-lain;
            </Text>
            <Text style={tw("mb-1")}>
              - Kebakaran, perang, huru hara, epidemi;
            </Text>
            <Text style={tw("mb-1")}>
              - Adanya Peraturan Pemerintah di bidang moneter yang secara
              langsung mempengaruhi kontrak kerjasama ini;
            </Text>
          </View>
        </View>

        {/* Pasal 7 */}
        <SectionHeader text="Pasal 7" underline bold />
        <SectionHeader text="Penyelesaian Perselisihan" bold spacing="mb-2" />
        <Text style={tw("text-justify leading-relaxed mb-4")}>
          Jika terjadi perselisihan antara kedua belah pihak, maka akan
          diselesaikan secara musyawarah dan mufakat. Apabila musyawarah dan
          mufakat tidak tercapai, maka akan diselesaikan berdasarkan hukum dan
          peraturan perundang-undangan yang berlaku di Negara Republik
          Indonesia.
        </Text>

        {/* Pasal 8 */}
        <SectionHeader text="Pasal 8" underline bold />
        <SectionHeader text="Penutup" bold spacing="mb-2" />
        <View style={tw("ml-4 mb-4")}>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            1. Surat Perjanjian Kerja sama Pendayagunaan Fasilitas Layanan Balai
            K3 Samarinda ini ditandatangani oleh kedua belah pihak di Samarinda
            pada hari dan tanggal tersebut diatas.
          </Text>
          <Text style={tw("mb-1 text-justify leading-relaxed")}>
            2. Perjanjian Kerjasama dinyatakan berlaku sejak di tandatangani dan
            berakhir setelah PIHAK PERTAMA dan PIHAK KEDUA menyelesaikan
            kewajiban masing-masing.
          </Text>
        </View>

        {/* Dual Signature */}
        <View style={tw("flex-row justify-between items-start mt-8")}>
          {/* PIHAK KEDUA */}
          <View style={tw("items-center w-5/12")}>
            <Text style={tw("font-bold text-center")}>PIHAK KEDUA</Text>
            <Text style={tw("text-center mb-16")}>{companyName}</Text>
            <Text style={tw("text-center underline")}>{companyRepName}</Text>
            <Text style={tw("text-center")}>{companyRepPosition}</Text>
          </View>

          {/* PIHAK PERTAMA */}
          <View style={tw("items-center w-5/12")}>
            <Text style={tw("font-bold text-center")}>PIHAK PERTAMA</Text>
            <Text style={tw("text-center")}>Kepala Balai Keselamatan dan</Text>
            <Text style={tw("text-center mb-16")}>
              Kesehatan Kerja Samarinda
            </Text>
            <Text style={tw("text-center underline")}>
              dr. Erwin Anjasmara Ichsan, M.K.M.
            </Text>
            <Text style={tw("text-center")}>NIP. 19760718 200312 1 001</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
