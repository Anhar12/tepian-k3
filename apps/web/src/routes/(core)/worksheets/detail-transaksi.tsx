import { WorksheetHeaderCard } from "@/components/worksheet-header-card";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Check,
  Users,
  MapPin,
  Calendar,
  Printer,
  Save,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePagination } from "@/lib/pagination";
import { WorksheetDataTable } from "@/components/ui/worksheet-data-table";

export const Route = createFileRoute("/(core)/worksheets/detail-transaksi")({
  component: RouteComponent,
});

const transactionParameterData = [
  {
    id: 1,
    cluster: "Lingkungan Kerja",
    jenisPengujian: "Faktor Fisik",
    parameter: "Kebisingan",
    acuan: "Permenaker 05 Thn 2018",
    jumlah: 20,
    status: "siap",
    biaya: 150000,
  },
  {
    id: 2,
    cluster: "Lingkungan Kerja",
    jenisPengujian: "Faktor Fisik",
    parameter: "Kebisingan Personal",
    acuan: "Permenaker 05 Thn 2018",
    jumlah: 15,
    status: "siap",
    biaya: 150000,
  },
  {
    id: 3,
    cluster: "Lingkungan Kerja",
    jenisPengujian: "Faktor Fisik",
    parameter: "Iklim Kerja",
    acuan: "Permenaker 05 Thn 2018",
    jumlah: 5,
    status: "siap",
    biaya: 150000,
  },
  {
    id: 4,
    cluster: "Lingkungan Kerja",
    jenisPengujian: "Faktor Fisik",
    parameter: "Penerangan Umum",
    acuan: "Permenaker 05 Thn 2018",
    jumlah: 26,
    status: "siap",
    biaya: 150000,
  },
  {
    id: 5,
    cluster: "Lingkungan Kerja",
    jenisPengujian: "Faktor Kimia",
    parameter: "Benzen",
    acuan: "Permenaker 05 Thn 2018",
    jumlah: 5,
    status: "siap",
    biaya: 150000,
  },
  {
    id: 6,
    cluster: "Lingkungan Kerja",
    jenisPengujian: "Faktor Kimia",
    parameter: "Toluen",
    acuan: "Permenaker 05 Thn 2018",
    jumlah: 5,
    status: "siap",
    biaya: 150000,
  },
  {
    id: 7,
    cluster: "Lingkungan Kerja",
    jenisPengujian: "Faktor Kimia",
    parameter: "Xylen",
    acuan: "Permenaker 05 Thn 2018",
    jumlah: 5,
    status: "siap",
    biaya: 150000,
  },
  {
    id: 8,
    cluster: "Lingkungan Kerja",
    jenisPengujian: "Faktor Biologi",
    parameter: "Koloni Jamur",
    acuan: "Permenaker 05 Thn 2018",
    jumlah: 7,
    status: "siap",
    biaya: 150000,
  },
  {
    id: 9,
    cluster: "Lingkungan Kerja",
    jenisPengujian: "Faktor Biologi",
    parameter: "Koloni Bakteri",
    acuan: "Permenaker 05 Thn 2018",
    jumlah: 7,
    status: "siap",
    biaya: 150000,
  },
  {
    id: 10,
    cluster: "Lingkungan Hidup",
    jenisPengujian: "Udara Ambien",
    parameter: "Karbon Monoksida (CO)",
    acuan: "PP 22 Thn 2021",
    jumlah: 4,
    status: "siap",
    biaya: 150000,
  },
  {
    id: 11,
    cluster: "Lingkungan Hidup",
    jenisPengujian: "Udara Ambien",
    parameter: "Natrium Dioksida (NO2)",
    acuan: "PP 22 Thn 2021",
    jumlah: 4,
    status: "siap",
    biaya: 150000,
  },
  {
    id: 12,
    cluster: "Lingkungan Hidup",
    jenisPengujian: "Udara Ambien",
    parameter: "Sulfur Dioksida (SO2)",
    acuan: "PP 22 Thn 2021",
    jumlah: 4,
    status: "siap",
    biaya: 150000,
  },
  {
    id: 13,
    cluster: "Lingkungan Hidup",
    jenisPengujian: "Emisi Tidak Bergerak",
    parameter: "Karbon Monoksida (CO)",
    acuan: "Permen LH 11 Thn 2021",
    jumlah: 3,
    status: "tidak siap",
    biaya: 150000,
  },
  {
    id: 14,
    cluster: "Lingkungan Hidup",
    jenisPengujian: "Emisi Tidak Bergerak",
    parameter: "Natrium Dioksida (NO2)",
    acuan: "Permen LH 11 Thn 2021",
    jumlah: 3,
    status: "tidak siap",
    biaya: 150000,
  },
  {
    id: 15,
    cluster: "Lingkungan Hidup",
    jenisPengujian: "Emisi Tidak Bergerak",
    parameter: "Partikulat",
    acuan: "Permen LH 11 Thn 2021",
    jumlah: 3,
    status: "tidak siap",
    biaya: 150000,
  },
];

const operationalData = [
  {
    id: 1,
    item: "Uang Harian",
    orangUnit: 20,
    hari: 20,
    keterangan: "-",
    biaya: 150000,
  },
  {
    id: 2,
    item: "Transportasi",
    orangUnit: 1,
    hari: 2,
    keterangan: "Disediakan Perusahaan",
    biaya: null,
  },
  {
    id: 3,
    item: "Penginapan",
    orangUnit: 5,
    hari: 5,
    keterangan: "-",
    biaya: 150000,
  },
];

const locations = [
  "Loa Janan Ilir",
  "Loa Janan Ilir",
  "Loa Tebu",
  "Loa Tebu",
  "Loa Duri",
  "Loa Duri",
  "Loa Janan",
  "Loa Janan",
  "Tenggarong Seberang",
  "Tenggarong Seberang",
  "Samarinda Ulu",
  "Samarinda Seberang",
];

const assignedPersonnel = [
  "Ugeng Priyanto, ST",
  "Ahmad Yani, SKM",
  "Hidayatullah, SKM",
  "Moh. Anugerah Ramadhan Arief",
  "Novantio Saputra",
  "Alif",
];

function RouteComponent() {
  const [parameterData] = useState(transactionParameterData);

  const [paramPage, setParamPage] = useState(1);
  const [paramPageSize, setParamPageSize] = useState(10);

  const parameterTotal = parameterData.reduce(
    (sum, item) => sum + item.jumlah * item.biaya,
    0,
  );
  const operationalTotal = operationalData.reduce((sum, item) => {
    if (item.biaya) return sum + item.orangUnit * item.hari * item.biaya;
    return sum;
  }, 0);
  const grandTotal = parameterTotal + operationalTotal;

  const paramPagination = usePagination(
    parameterData,
    paramPageSize,
    paramPage,
  );

  return (
    <div className="space-y-4">
      <WorksheetHeaderCard
        title="Detail Transaksi"
        subtitle="Rincian biaya parameter dan operasional pengujian"
      />

      <Card>
        <CardHeader className="px-3 pb-3 sm:px-6 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MapPin className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            Rincian Permintaan Pengujian
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-500 sm:h-4 sm:w-4" />
                <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                  Lokasi Pengujian (Kecamatan)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:text-sm">
                {locations.map((loc, idx) => (
                  <span key={idx}>
                    {idx + 1}. {loc}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-500 sm:h-4 sm:w-4" />
                <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                  Durasi Pengujian
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold sm:text-2xl">10 Hari</p>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Tanggal
                </p>
                <p className="text-xs font-medium text-primary sm:text-sm">
                  01 Desember - 10 Desember 2025
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-500 sm:h-4 sm:w-4" />
                <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                  Personel
                </span>
              </div>
              <div className="space-y-1 text-xs sm:text-sm">
                {assignedPersonnel.map((person, idx) => (
                  <p key={idx}>
                    {idx + 1}. {person}
                  </p>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-xl bg-primary/5 p-4">
              <Users className="mb-2 h-6 w-6 text-primary sm:h-8 sm:w-8" />
              <p className="text-2xl font-bold text-primary sm:text-3xl">
                {assignedPersonnel.length}
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Total Personel
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-3 pb-3 sm:px-6 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            Rincian Parameter
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold sm:text-sm">
                    Cluster
                  </TableHead>
                  <TableHead className="hidden text-xs font-semibold sm:text-sm md:table-cell">
                    Jenis Pengujian
                  </TableHead>
                  <TableHead className="text-xs font-semibold sm:text-sm">
                    Parameter
                  </TableHead>
                  <TableHead className="hidden text-xs font-semibold sm:text-sm lg:table-cell">
                    Acuan
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold sm:text-sm">
                    Jumlah
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold sm:text-sm">
                    Status
                  </TableHead>
                  <TableHead className="hidden text-right text-xs font-semibold sm:table-cell sm:text-sm">
                    Biaya
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold sm:text-sm">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paramPagination.paginatedData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="text-xs font-medium sm:text-sm">
                      {item.cluster}
                    </TableCell>
                    <TableCell className="hidden text-xs sm:text-sm md:table-cell">
                      {item.jenisPengujian}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {item.parameter}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                      {item.acuan}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="bg-background text-xs"
                      >
                        {item.jumlah}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={`text-xs ${
                          item.status === "siap"
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                            : "bg-red-100 text-red-700 hover:bg-red-100"
                        }`}
                      >
                        {item.status === "siap" ? "Siap" : "Tidak"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-right text-xs sm:table-cell sm:text-sm">
                      {item.biaya
                        ? `${item.biaya.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace("IDR", "Rp")},-`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right text-xs font-medium sm:text-sm">
                      {item.biaya
                        ? `${(item.jumlah * item.biaya).toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace("IDR", "Rp")},-`
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell
                    colSpan={7}
                    className="text-right text-xs sm:text-sm"
                  >
                    TOTAL
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      value={parameterTotal
                        .toLocaleString("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })
                        .replace("IDR", "Rp")}
                      readOnly
                      className="ml-auto w-24 text-right text-xs font-bold sm:w-32 sm:text-sm"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <WorksheetDataTable
            currentPage={paramPagination.currentPage}
            totalPages={paramPagination.totalPages}
            pageSize={paramPageSize}
            totalItems={paramPagination.totalItems}
            onPageChange={setParamPage}
            onPageSizeChange={(size) => {
              setParamPageSize(size);
              setParamPage(1);
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-3 pb-3 sm:px-6 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            Rincian Operasional
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold sm:text-sm">
                    Item
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold sm:text-sm">
                    Orang/Unit
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold sm:text-sm">
                    Hari
                  </TableHead>
                  <TableHead className="hidden text-center text-xs font-semibold sm:text-sm md:table-cell">
                    Keterangan
                  </TableHead>
                  <TableHead className="hidden text-right text-xs font-semibold sm:table-cell sm:text-sm">
                    Biaya
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold sm:text-sm">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operationalData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="text-xs font-medium sm:text-sm">
                      {item.item}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="bg-background text-xs"
                      >
                        {item.orangUnit}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="bg-background text-xs"
                      >
                        {item.hari}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-center text-xs sm:text-sm md:table-cell">
                      {item.keterangan === "Disediakan Perusahaan" ? (
                        <Badge className="bg-amber-100 text-xs text-amber-700 hover:bg-amber-100">
                          {item.keterangan}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-right text-xs sm:table-cell sm:text-sm">
                      {item.biaya
                        ? `${item.biaya.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace("IDR", "Rp")},-`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right text-xs font-medium sm:text-sm">
                      {item.biaya
                        ? `${(item.orangUnit * item.hari * item.biaya).toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace("IDR", "Rp")},-`
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell
                    colSpan={5}
                    className="text-right text-xs sm:text-sm"
                  >
                    TOTAL
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      value={operationalTotal
                        .toLocaleString("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })
                        .replace("IDR", "Rp")}
                      readOnly
                      className="ml-auto w-24 text-right text-xs font-bold sm:w-32 sm:text-sm"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
        <div className="flex items-center justify-center gap-2 sm:justify-start">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 bg-transparent"
          >
            <Printer className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 bg-transparent"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button className="flex-1 gap-2 sm:flex-initial">
            <CheckCircle className="h-4 w-4" />
            SUBMIT
          </Button>
        </div>
        <div className="flex items-center justify-between gap-3 border-t pt-3 sm:justify-end sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
          <span className="text-sm font-semibold text-muted-foreground sm:text-base">
            GRAND TOTAL
          </span>
          <div className="rounded-lg bg-primary/10 px-3 py-2 sm:px-4">
            <span className="text-lg font-bold text-primary sm:text-xl">
              {grandTotal
                .toLocaleString("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
                .replace("IDR", "Rp")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
