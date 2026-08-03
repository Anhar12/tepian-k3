import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import type { WorksheetTransactionDetail } from "@tepian-k3/types/pengujian/worksheet.types";
import { tw } from "../utils/tw";
import { Letterhead } from "../components/letterhead";
import { SectionHeader } from "../components/section-header";
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

interface ListItemProps {
  prefix: string;
  children: React.ReactNode;
  prefixWidth?: string;
  spacing?: string;
  wrap?: boolean;
}

const ListItem: React.FC<ListItemProps> = ({
  prefix,
  children,
  prefixWidth = "w-6",
  spacing = "mb-1.5",
  wrap = false,
}) => (
  <View style={tw(`flex-row ${spacing} w-full`)} wrap={wrap}>
    <Text style={tw(`${prefixWidth} font-sans`)}>{prefix}</Text>
    <View style={tw("flex-1")}>
      {typeof children === "string" ? (
        <Text style={tw("font-sans leading-normal")}>{children}</Text>
      ) : (
        children
      )}
    </View>
  </View>
);

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
      <Page size="A4" style={tw("px-10 py-8 text-[10.5px] font-sans")}>
        <Letterhead
          logoUrl={storageService.getAssetUrl("assets/kemnaker.png")}
        />

        {/* Document Title */}
        <SectionHeader
          text="PERJANJIAN KERJA SAMA"
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

        {/* Pembukaan */}
        <Text style={tw("mb-3 leading-normal")}>
          Pada hari {dayName} Tanggal {dateFull}, kami yang bertanda tangan
          dibawah ini :
        </Text>

        {/* PIHAK PERTAMA */}
        <View style={tw("mb-3 ml-2")}>
          <View style={tw("flex-row mb-1")}>
            <Text style={tw("w-6 font-bold")}>I.</Text>
            <View style={tw("flex-1")}>
              <View style={tw("flex-row mb-0.5")}>
                <Text style={tw("w-36")}>Nama</Text>
                <Text style={tw("w-4")}>:</Text>
                <Text style={tw("flex-1")}>
                  dr. Erwin Anjasmara Ichsan, M.K.M
                </Text>
              </View>
              <View style={tw("flex-row mb-0.5")}>
                <Text style={tw("w-36")}>Jabatan</Text>
                <Text style={tw("w-4")}>:</Text>
                <Text style={tw("flex-1")}>
                  Kepala Balai Keselamatan dan Kesehatan Kerja Samarinda
                </Text>
              </View>
              <View style={tw("flex-row mb-0.5")}>
                <Text style={tw("w-36")}>Alamat Kantor</Text>
                <Text style={tw("w-4")}>:</Text>
                <Text style={tw("flex-1")}>Jl. Sentosa No. 09 Samarinda</Text>
              </View>
            </View>
          </View>
          <Text style={tw("mt-1.5 leading-normal")}>
            dalam hal ini bertindak atas nama/mewakili Balai Keselamatan dan
            Kesehatan Kerja Samarinda, yang selanjutnya disebut PIHAK PERTAMA,
          </Text>
        </View>

        {/* PIHAK KEDUA */}
        <View style={tw("mb-3 ml-2")}>
          <View style={tw("flex-row mb-1")}>
            <Text style={tw("w-6 font-bold")}>II.</Text>
            <View style={tw("flex-1")}>
              <View style={tw("flex-row mb-0.5")}>
                <Text style={tw("w-36")}>Nama</Text>
                <Text style={tw("w-4")}>:</Text>
                <Text style={tw("flex-1")}>{companyRepName || "-"}</Text>
              </View>
              <View style={tw("flex-row mb-0.5")}>
                <Text style={tw("w-36")}>Jabatan</Text>
                <Text style={tw("w-4")}>:</Text>
                <Text style={tw("flex-1")}>{companyRepPosition || "-"}</Text>
              </View>
              <View style={tw("flex-row mb-0.5")}>
                <Text style={tw("w-36")}>Alamat</Text>
                <Text style={tw("w-4")}>:</Text>
                <Text style={tw("flex-1")}>{companyRepAddress || "-"}</Text>
              </View>
            </View>
          </View>
          <Text style={tw("mt-1.5 leading-normal")}>
            dalam hal ini bertindak atas nama/mewakili {companyName},
            selanjutnya disebut PIHAK KEDUA,
          </Text>
          <Text style={tw("mt-2 leading-normal")}>
            PIHAK PERTAMA dan PIHAK KEDUA bertindak secara bersama-sama disebut
            "PARA PIHAK" dan bertindak secara sendiri-sendiri disebut sebagai
            "PIHAK".
          </Text>
        </View>

        {/* Dasar Hukum */}
        <Text style={tw("leading-normal mb-4")}>
          berdasarkan{" "}
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

        {/* Pasal 1 */}
        <SectionHeader text="Pasal 1" bold spacing="mb-1" />
        <SectionHeader text="Ruang Lingkup Pekerjaan" bold spacing="mb-2" />
        <Text style={tw("mb-2")}>Ruang lingkup pekerjaan ini meliputi :</Text>
        <View style={tw("ml-2 mb-4")}>
          <ListItem prefix="a.">
            Pelaksanaan kegiatan pengujian dan/atau pengambilan sampel di lokasi
            kerja PIHAK KEDUA.
          </ListItem>
          <ListItem prefix="b.">
            Pengujian meliputi jumlah titik dan parameter sebagaimana tercantum
            dalam lampiran penawaran biaya jasa dan operasional pengujian K3.
          </ListItem>
          <ListItem prefix="c.">
            Penyusunan laporan hasil pengujian sesuai dengan prosedur dan
            standar Balai K3 Samarinda.
          </ListItem>
        </View>

        {/* Pasal 2 */}
        <SectionHeader text="Pasal 2" bold spacing="mb-1" />
        <SectionHeader text="Hak dan Kewajiban" bold spacing="mb-2" />

        <Text style={tw("font-bold mb-1.5")}>
          a. Hak dan Kewajiban PIHAK PERTAMA
        </Text>
        <View style={tw("ml-4 mb-3")}>
          <ListItem prefix="1)">
            Menerima pembayaran biaya jasa dan operasional sesuai dengan
            peraturan yang berlaku.
          </ListItem>
          <ListItem prefix="2)">
            Menerbitkan tagihan biaya uji apabila terjadi penambahan
            parameter/jumlah titik pengujian pada saat pelaksanaan pengujian.
          </ListItem>
          <ListItem prefix="3)">
            Menentukan jadwal pelaksanaan kegiatan pengujian.
          </ListItem>
          <ListItem prefix="4)">
            Melaksanakan kegiatan pengujian sesuai dengan standar dan metode
            yang telah ditetapkan serta peraturan perundang-undangan yang
            berlaku.
          </ListItem>
          <ListItem prefix="5)">
            Menjaga kerahasian segala informasi dan data PIHAK KEDUA.
          </ListItem>
          <ListItem prefix="6)">
            Menyampaikan laporan hasil pengujian kepada PIHAK KEDUA dalam jangka
            30 (tiga puluh) hari kerja setelah pelaksanaan pengujian.
          </ListItem>
          <ListItem prefix="7)">
            Apabila terdapat sisa dana dari pelaksanaan kegiatan kepada PIHAK
            KEDUA, pengembalian dana dari PIHAK PERTAMA kepada PIHAK KEDUA
            paling lambat 14 hari kerja setelah dilakukan rekonsiliasi biaya.
          </ListItem>
        </View>

        <Text style={tw("font-bold mb-1.5")}>
          b. Hak dan Kewajiban PIHAK KEDUA
        </Text>
        <View style={tw("ml-4 mb-3")}>
          <ListItem prefix="1)">
            Melakukan pembayaran biaya jasa pengujian melalui e-billing
            (SIMPONI) dan biaya operasional ke Rekening Penampungan Lainnya.
          </ListItem>
          <ListItem prefix="2)">Mendapatkan pelayanan pengujian .</ListItem>
          <ListItem prefix="3)">
            Mendapatkan laporan hasil uji dari PIHAK PERTAMA yang akan diterima
            oleh PIHAK KEDUA dalam jangka waktu 30 (tiga puluh) hari kerja
            setelah pelaksanaan pengujian.
          </ListItem>
          <ListItem prefix="4)">
            <Text style={tw("font-sans leading-normal mb-1")}>
              Menerima pengembalian kelebihan dana operasional apabila terdapat
              sisa dana operasional dari pelaksanaan kegiatan dari PIHAK PERTAMA
              pada nomor rekening :
            </Text>
            <View style={tw("ml-2 mt-0.5 mb-1")}>
              <View style={tw("flex-row mb-0.5")}>
                <Text style={tw("w-36 font-bold")}>a) Nama Bank</Text>
                <Text style={tw("w-4 font-bold")}>:</Text>
                <Text style={tw("font-bold flex-1")}>
                  {companyBankName || "-"}
                </Text>
              </View>
              <View style={tw("flex-row mb-0.5")}>
                <Text style={tw("w-36 font-bold")}>b) No. Rekening</Text>
                <Text style={tw("w-4 font-bold")}>:</Text>
                <Text style={tw("font-bold flex-1")}>
                  {companyBankAccount || "-"}
                </Text>
              </View>
              <View style={tw("flex-row mb-0.5")}>
                <Text style={tw("w-36 font-bold")}>c) Nama Rekening</Text>
                <Text style={tw("w-4 font-bold")}>:</Text>
                <Text style={tw("font-bold flex-1")}>
                  {companyBankAccountName || "-"}
                </Text>
              </View>
            </View>
          </ListItem>
          <ListItem prefix="5)">
            Memastikan lokasi/titik pengujian siap untuk dilakukan pengambilan
            sampel uji.
          </ListItem>
          <ListItem prefix="6)">
            Membayar biaya penambahan parameter/titik lokasi pengujian kepada
            PIHAK PERTAMA apabila terjadi penambahan parameter/titik pengujian
            sesuai dengan kesepakatan Para Pihak dan dituangkan dalam berita
            acara pengambilan sampel.
          </ListItem>
        </View>

        {/* Pasal 3 */}
        <SectionHeader text="Pasal 3" bold spacing="mb-1" />
        <SectionHeader text="Biaya dan Pembayaran" bold spacing="mb-2" />

        <View style={tw("ml-2 mb-3")}>
          <ListItem prefix="a.">
            Biaya pengujian dibayarkan melalui kode e-billing (SIMPONI) yang
            telah diterbitkan.
          </ListItem>
          <ListItem prefix="b.">
            <Text style={tw("font-sans leading-normal mb-1")}>
              Biaya operasional pengujian dibayarkan ke rekening :
            </Text>
            <View style={tw("ml-2 mt-0.5 mb-1")}>
              <View style={tw("flex-row mb-0.5")}>
                <Text style={tw("w-36 font-bold")}>1) NamaBank</Text>
                <Text style={tw("w-4 font-bold")}>:</Text>
                <Text style={tw("font-bold flex-1")}>
                  {operationalBankName || "Mandiri"}
                </Text>
              </View>
              <View style={tw("flex-row mb-0.5")}>
                <Text style={tw("w-36 font-bold")}>2) No. Rekening</Text>
                <Text style={tw("w-4 font-bold")}>:</Text>
                <Text style={tw("font-bold flex-1")}>
                  {operationalBankAccount || "-"}
                </Text>
              </View>
              <View style={tw("flex-row mb-0.5")}>
                <Text style={tw("w-36 font-bold")}>3) Nama Rekening</Text>
                <Text style={tw("w-4 font-bold")}>:</Text>
                <Text style={tw("font-bold flex-1")}>
                  {operationalBankAccountName || "-"}
                </Text>
              </View>
            </View>
          </ListItem>
          <ListItem prefix="c.">
            Pembayaran biaya pengujian dan operasional dilakukan tidak lebih
            dari 7 (tujuh) hari selama masa berlaku kode billing.
          </ListItem>
          <ListItem prefix="d.">
            Apabila biaya pengujian sudah dibayarkan oleh PIHAK KEDUA maka
            kegiatan pengujian tidak dapat dibatalkan.
          </ListItem>
          <ListItem prefix="e.">Rincian Biaya Pengujian :</ListItem>
        </View>

        {/* Pricing Tables */}
        <PricingTable
          items={worksheet.items}
          operationalCosts={worksheet.operationalCosts}
        />

        {/* Pasal 4 */}
        <SectionHeader text="Pasal 4" bold spacing="mb-1" />
        <SectionHeader text="Jangka Waktu" bold spacing="mb-2" />
        <View style={tw("ml-2 mb-3")}>
          <ListItem prefix="a.">
            Kesepakatan kerja ini berlaku selama 1 (satu) kali kegiatan
            pengujian terhitung sejak ditandatangani oleh PARA PIHAK.
          </ListItem>
          <ListItem prefix="b.">
            PIHAK PERTAMA menetapkan jadwal/waktu Pengujian maksimal 5 (lima)
            hari kerja setelah menerima konfirmasi pembayaran biaya uji dari
            PIHAK KEDUA.
          </ListItem>
        </View>

        {/* Pasal 5 */}
        <SectionHeader text="Pasal 5" bold spacing="mb-1" />
        <SectionHeader text="Sanksi dan Denda" bold spacing="mb-2" />
        <View style={tw("ml-2 mb-3")}>
          <ListItem prefix="a.">
            Jika PIHAK KEDUA melakukan pembatalan kegiatan pengujian maka PIHAK
            KEDUA tidak dapat menarik kembali seluruh biaya pengujian yang telah
            dibayarkan.
          </ListItem>
          <ListItem prefix="b.">
            Jika PIHAK PERTAMA tidak dapat menyelesaikan laporan hasil uji dalam
            jangka waktu yang sudah ditetapkan maka PIHAK KEDUA berhak
            mendapatkan layanan konsultasi hasil pengujian secara gratis.
          </ListItem>
        </View>

        {/* Pasal 6 */}
        <SectionHeader text="Pasal 6" bold spacing="mb-1" />
        <SectionHeader
          text="Keadaan Memaksa (Force Majore)"
          bold
          spacing="mb-2"
        />
        <View style={tw("ml-2 mb-3")}>
          <ListItem prefix="a.">
            Jika hal-hal diluar kemampuan (force majore) yang mempengaruhi
            kontrak kerjasama ini, maka PIHAK PERTAMA segera melaporkan hal
            tersebut kepada PIHAK KEDUA dalam jangka waktu 2 x 24 jam setelah
            kejadian dengan pengesahan pejabat setempat yang berwenang.
          </ListItem>
          <ListItem prefix="b.">
            Yang dimaksud (force majore), adalah:
            <View style={tw("ml-2 mt-1")}>
              <Text style={tw("mb-0.5")}>
                - Bencana alam seperti gempa bumi, angin topan, banjir dan
                lain-lain;
              </Text>
              <Text style={tw("mb-0.5")}>
                - Kebakaran, perang, huru hara, epidemi;
              </Text>
              <Text style={tw("mb-0.5")}>
                - Adanya Peraturan Pemerintah di bidang moneter yang secara
                langsung mempengaruhi kontrak kerjasama ini;
              </Text>
            </View>
          </ListItem>
        </View>

        {/* Pasal 7 */}
        <SectionHeader text="Pasal 7" bold spacing="mb-1" />
        <SectionHeader text="Penyelesaian Perselisihan" bold spacing="mb-2" />
        <Text style={tw("leading-normal mb-4")}>
          Jika terjadi perselisihan antara kedua belah pihak, maka akan
          diselesaikan secara musyawarah dan mufakat. Apabila musyawarah dan
          mufakat tidak tercapai, maka akan diselesaikan berdasarkan hukum dan
          peraturan perundang-undangan yang berlaku di Negara Republik
          Indonesia.
        </Text>

        {/* Pasal 8 */}
        <SectionHeader text="Pasal 8" bold spacing="mb-1" />
        <SectionHeader text="Penutup" bold spacing="mb-2" />
        <View style={tw("ml-2 mb-4")}>
          <ListItem prefix="a.">
            Perjanjian Kerja sama Pendayagunaan Fasilitas Layanan Balai K3
            Samarinda ini ditandatangani oleh kedua belah pihak di Samarinda
            pada hari dan tanggal tersebut diatas.
          </ListItem>
          <ListItem prefix="b.">
            Perjanjian Kerjasama dinyatakan berlaku sejak di tandatangani dan
            berakhir setelah PIHAK PERTAMA dan PIHAK KEDUA menyelesaikan
            kewajiban masing-masing.
          </ListItem>
        </View>

        {/* Dual Signature Block */}
        <View
          style={tw("flex-row justify-between items-start mt-6")}
          wrap={false}
        >
          {/* PIHAK KEDUA */}
          <View style={tw("items-center w-5/12")}>
            <Text style={tw("font-bold text-center")}>PIHAK KEDUA</Text>
            <Text style={tw("text-center mb-14")}>{companyName},</Text>
            <Text style={tw("text-center underline font-bold")}>
              {companyRepName || "{Nama_Pimpinan}"}
            </Text>
            <Text style={tw("text-center underline")}>
              {companyRepPosition || "{Jabatan_Pimpinan}"}
            </Text>
          </View>

          {/* PIHAK PERTAMA */}
          <View style={tw("items-center w-5/12")}>
            <Text style={tw("font-bold text-center")}>PIHAK PERTAMA</Text>
            <Text style={tw("text-center mb-14")}>
              Kepala Balai K3 Samarinda,
            </Text>
            <Text style={tw("text-center underline font-bold")}>
              dr. Erwin Anjasmara Ichsan, M.K.M.
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
