import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { tw } from "../utils/tw";
import { PAGE_MARGINS } from "../utils/page-styles";
import { Letterhead } from "../components/letterhead";
import { storageService } from "../../storage";
import { format } from "date-fns";
import { NumberedList } from "../components/numbered-list";
import { LabeledField } from "../components/labeled-field";
import { SectionHeader } from "../components/section-header";
import { HeadSignature } from "../components/head-signature";
import type { WorksheetAssignmentDetail } from "@tepian-k3/types/pengujian/worksheet-assignment.types";
import { Table, type TableColumn } from "../components/table";

interface AssignmentLetterProps {
  companyName: string;
  companyRegency: string;
  orderDate: string;
  assignmentDateStart: string;
  assignmentDateEnd: string;
  letterNumber: string;
  assignmentLetterNumber: string;
  financingSource: string;
  assignees: WorksheetAssignmentDetail[];
  spkNumber?: string;
  spkDate?: string;
  offeringNumber?: string;
  offeringDate?: string;
}

export const AssignmentLetter: React.FC<AssignmentLetterProps> = ({
  companyName,
  companyRegency,
  orderDate,
  assignmentDateStart,
  assignmentDateEnd: _assignmentDateEnd,
  letterNumber,
  assignmentLetterNumber,
  financingSource,
  assignees,
  spkNumber,
  spkDate,
  offeringNumber,
  offeringDate,
}) => {
  const dasarItems = [
    `Permohonan Pengujian Nomor: ${letterNumber} tanggal ${format(
      new Date(orderDate),
      "dd MMMM yyyy",
    )}.`,
    `Surat Perjanjian Kerjasama Pendayagunaan Fasilitas Layanan Balai K3 Samarinda Nomor: ${
      spkNumber || assignmentLetterNumber
    } tanggal ${format(
      spkDate ? new Date(spkDate) : new Date(),
      "dd MMMM yyyy",
    )}.`,
    `Sesuai dengan surat Penawaran Pelaksanaan Kegiatan Nomor ${
      offeringNumber || letterNumber
    } tanggal ${format(
      offeringDate ? new Date(offeringDate) : new Date(orderDate),
      "dd MMMM yyyy",
    )}.`,
  ];

  const untukItems = [
    `Melaksanakan Perjalanan Dinas Dalam Rangka Pengujian K3 pada ${companyName} di ${companyRegency}.`,
    `Dilaksanakan pada Tanggal ${format(
      new Date(assignmentDateStart),
      "dd MMMM yyyy",
    )}.`,
    `Melaporkan pelaksanaan kegiatan secara tertulis kepada Kepala Balai K3 Samarinda.`,
    `Melaksanakan perintah ini dengan sebaik-baiknya dan penuh rasa tanggung jawab.`,
  ];

  const columns: TableColumn<WorksheetAssignmentDetail>[] = [
    {
      key: "employee.name",
      label: "NAMA",
      width: "w-4/12",
    },
    {
      key: "employee.nip",
      label: "NIP",
      width: "w-4/12",
    },
    {
      key: "employee.type",
      label: "PANGKAT/ GOLONGAN",
      width: "w-4/12",
    },
    {
      key: "employee.position.name",
      label: "JABATAN/ PERAN",
      width: "w-4/12",
    },
  ];

  return (
    <Document>
      <Page
        size="A4"
        style={[PAGE_MARGINS.assignmentLetter, tw("text-[11px] font-sans")]}
      >
        {/* First Page */}
        <View>
          <Letterhead
            logoUrl={storageService.getAssetUrl("assets/kemnaker.png")}
          />

          {/* Letter Header */}
          <SectionHeader
            text="SURAT TUGAS"
            underline
            body={assignmentLetterNumber}
          />

          {/* Pertimbangan */}
          <LabeledField
            label="Pertimbangan"
            value="Demi kepentingan dinas dipandang perlu memerintahkan kepada Pegawai Negeri Sipil pada Balai Keselamatan dan Kesehatan Kerja Samarinda untuk melaksanakan pengujian K3."
          />

          {/* Dasar */}
          <View style={tw("flex flex-row mb-4 justify-between gap-4")}>
            <Text style={tw("text-[11px] w-24")}>Dasar</Text>
            <Text style={tw("text-[11px]")}>:</Text>
            {/* Numbered List */}
            <NumberedList items={dasarItems} />
          </View>

          {/* Header */}
          <SectionHeader text="MEMERINTAHKAN/MENUGASKAN :" underline />

          {/* Kepada */}
          <LabeledField label="Kepada" value="Nama-nama terlampir" />

          {/* Untuk */}
          <View style={tw("flex flex-row mb-4 justify-between gap-4")}>
            <Text style={tw("text-[11px] w-24")}>Untuk</Text>
            <Text style={tw("text-[11px]")}>:</Text>
            {/* Numbered List */}
            <NumberedList items={untukItems} />
          </View>

          {/* Pembiayaan */}
          <LabeledField
            label="Pembiayaan"
            value={`${financingSource} dibebankan pada RPL 046 PS Balai K3 SMD, Akomodasi dan Operasional selama Pengujian disediakan dan di tanggung oleh perusahaan.`}
          />

          {/* Closing */}
          <Text style={tw("my-5")}>
            Demikian surat tugas ini dibuat untuk dilaksanakan dengan penuh
            tanggung jawab.
          </Text>

          {/* Signature */}
          <View style={tw("flex-row justify-between items-start mt-8")}>
            <View style={tw("flex flex-col items-center w-5/12")}>
              <View style={tw("border border-black p-2")}>
                <Text style={tw("text-[9px] font-bold text-center")}>
                  ASN Balai K3 Samarinda tidak menerima gratifikasi dalam
                  pelaksanaan tugas sesuai ketentuan yang berlaku.
                </Text>
              </View>
            </View>

            <View style={tw("flex flex-col items-center w-5/12")}>
              <View style={tw("mb-2 w-full")}>
                <LabeledField
                  label="Dikeluarkan di"
                  value="Samarinda"
                  labelWidth="w-24"
                />
                <LabeledField
                  label="Pada tanggal"
                  value={format(new Date(), "dd MMMM yyyy")}
                  labelWidth="w-24"
                />
              </View>
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
        </View>

        {/* Second Page */}
        <View break>
          <View
            style={tw(
              "flex flex-col justify-start items-end mb-4 w-6/12 ml-auto",
            )}
          >
            <View
              style={tw("flex flex-col justify-center items-start w-full mb-1")}
            >
              <Text style={tw("text-[11px]")}>
                Lampiran Surat Tugas Balai Keselamatan dan Kesehatan Kerja
                Samarinda
              </Text>
            </View>
            <View style={tw("flex flex-col justify-center items-start w-full")}>
              <LabeledField
                label="Nomor"
                value={assignmentLetterNumber}
                spacing="mb-1"
                labelWidth="w-14"
                valueWidth="flex"
              />
              <LabeledField
                label="Tanggal"
                value={format(new Date(), "dd MMMM yyyy")}
                labelWidth="w-14"
                valueWidth="flex"
              />
            </View>
          </View>

          <SectionHeader text="DAFTAR NAMA" spacing="mb-2" bold />

          <Table columns={columns} data={assignees} showIndex indexLabel="NO" />

          <View style={tw("flex flex-row justify-end mt-8")}>
            <HeadSignature width="w-5/12" spacing="mb-24" />
          </View>
        </View>
      </Page>
    </Document>
  );
};
