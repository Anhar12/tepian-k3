import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { tw } from "../utils/tw";
import { PAGE_MARGINS } from "../utils/page-styles";
import { Letterhead } from "../components/letterhead";
import { storageService } from "../../storage";
import { differenceInBusinessDays, format } from "date-fns";
import { NumberedList } from "../components/numbered-list";
import { LabeledField } from "../components/labeled-field";
import { SectionHeader } from "../components/section-header";
import { SignatureTable } from "../components/signature-table";
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
}

export const AssignmentLetter: React.FC<AssignmentLetterProps> = ({
  companyName,
  companyRegency,
  orderDate,
  assignmentDateStart,
  assignmentDateEnd,
  letterNumber,
  assignmentLetterNumber,
  financingSource,
  assignees,
}) => {
  const dasarItems = [
    `Surat Permintaan pengujian ${companyName} nomor ${letterNumber} tanggal ${format(
      orderDate,
      "dd MMMM yyyy",
    )}.`,
    `Surat Persetujuan Pelaksanaan Pengujian K3 Nomor ${assignmentLetterNumber} Tanggal ${format(
      new Date(),
      "dd MMMM yyyy",
    )}.`,
  ];

  const untukItems = [
    `Melaksanakan Perjalanan Dinas Dalam Rangka Pengujian K3 pada ${companyName} di ${companyRegency}.`,
    `Dilaksanakan pada tanggal ${format(
      assignmentDateStart,
      "dd MMMM yyyy",
    )} - ${format(assignmentDateEnd, "dd MMMM yyyy")} (${
      differenceInBusinessDays(assignmentDateEnd, assignmentDateStart) + 1
    } hari).`,
    `Melaporkan pelaksanaan kegiatan secara tertulis kepada Kepala Balai K3 Samarinda.`,
    `Melaksanakan perintah ini dengan sebaik-baiknya dan penuh rasa tanggung jawab.`,
  ];

  const columns: TableColumn<WorksheetAssignmentDetail>[] = [
    {
      key: "employee.name",
      label: "Nama",
      width: "w-4/12",
    },
    {
      key: "employee.nip",
      label: "NIP",
      width: "w-4/12",
    },
    {
      key: "employee.type",
      label: "Pangkat/Golongan",
      width: "w-4/12",
    },
    {
      key: "employee.position.name",
      label: "Jabatan",
      width: "w-4/12",
    },
    {
      key: "note",
      label: "Ket",
      width: "w-3/12",
      defaultValue: "",
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
            value="Demi kepentingan dinas dipandang perlu memerintahkan kepada Pegawai Negeri Sipil pada Balai Keselamatan dan Kesehatan Kerja Samarinda untuk melaksanakan pengujian K3 lingkungan kerja."
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
            value={`${financingSource} dibebankan pada RPL 046 PS Balai K3 SMD.`}
          />

          {/* Closing */}
          <Text style={tw("my-5")}>
            Demikian surat tugas ini dibuat untuk dilaksanakan dengan penuh
            tanggung jawab.
          </Text>

          {/* Signature */}
          <View style={tw("flex-row justify-between items-center mt-8")}>
            <View style={tw("flex flex-col items-center w-5/12")}>
              <View style={tw("mb-2 border border-black p-2")}>
                <Text style={tw("text-[10px] font-bold")}>
                  ASN Balai K3 Samarinda tidak menerima gratifikasi dalam
                  pelaksanaan tugas sesuai ketentuan yang berlaku.
                </Text>
              </View>
              <SignatureTable
                rows={[
                  {
                    role: "Pengendali Administrasi (Kasubbag Umum Balai K3 Samarinda)",
                  },
                  {
                    role: "Pengendali Teknis (Sub Koordinator Pengujian Balai K3 Samarinda)",
                  },
                ]}
                className="w-full"
              />
            </View>

            <View style={tw("flex flex-col justify-center items-center p-2")}>
              <View style={tw("flex flex-col items-center justify-center")}>
                <LabeledField
                  label="Dikeluarkan di"
                  value={"Samarinda"}
                  valueWidth="w-4/12"
                />
                <LabeledField
                  label="Pada tanggal"
                  value={format(new Date(), "dd MMMM yyyy")}
                  valueWidth="w-4/12"
                />
              </View>
              <HeadSignature width="w-full" spacing="mb-24" />
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
