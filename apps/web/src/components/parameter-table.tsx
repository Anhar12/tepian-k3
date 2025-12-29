import {
  ClipboardList,
  Search,
  ChevronDown,
  ShoppingCart,
  Beaker,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const data = [
  {
    id: 1,
    category: "Faktor Fisika",
    parent: "Lingkungan Kerja",
    param: "Temperatur (°C)",
    standard: "SNI 16-7063-2004 Kepmenaker RI",
    price: "Rp 150.000",
    count: 1,
    subtotal: "Rp 150.000",
    color: "text-emerald-500 bg-emerald-50",
  },
  {
    id: 2,
    category: "Kebisingan",
    parent: "Lingkungan Kerja",
    param: "Intensitas (dB)",
    standard: "KEP-48/MEN/VIII/2016 Kepmenaker RI",
    price: "Rp 200.000",
    count: 2,
    subtotal: "Rp 400.000",
    color: "text-orange-500 bg-orange-50",
  },
  {
    id: 3,
    category: "Suhu Ruangan",
    parent: "Lingkungan Kerja",
    param: "Temperatur (°C)",
    standard: "SNI 16-7063-2004 Kepmenaker RI",
    price: "Rp 150.000",
    count: 1,
    subtotal: "Rp 150.000",
    color: "text-emerald-500 bg-emerald-50",
  },
  {
    id: 4,
    category: "Timbal dalam Darah",
    parent: "Biomarker",
    param: "Pb Blood (µg/dL)",
    standard: "ACGIH BEI WHO Guidelines",
    price: "Rp 350.000",
    count: 5,
    subtotal: "Rp 1.750.000",
    color: "text-purple-500 bg-purple-50",
  },
  {
    id: 5,
    category: "Kualitas Air Limbah",
    parent: "Lingkungan Hidup",
    param: "pH, BOD, COD",
    standard: "Permen LH No. 5/2014 Baku Mutu Air Limbah",
    price: "Rp 500.000",
    count: 3,
    subtotal: "Rp 1.750.000",
    color: "text-cyan-500 bg-cyan-50",
  },
];

export function ParameterTable() {
  return (
    <Card className="space-y-8 border-none bg-white p-8 shadow-xl shadow-slate-200/50">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1E40AF]">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Daftar Jenis Pengujian
            </h3>
            <p className="text-sm text-slate-500">
              Kelola parameter dan biaya pengujian
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-11 w-full border-slate-200 bg-transparent px-4 font-semibold text-slate-600 md:w-auto"
          >
            Pilih Kategori <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
          <div className="relative w-full md:w-64">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-11 border-slate-200 bg-slate-50/50 pl-10"
              placeholder="Cari Parameter..."
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="h-14 font-bold text-slate-700">
                kategori Parameter
              </TableHead>
              <TableHead className="h-14 font-bold text-slate-700">
                Parameter
              </TableHead>
              <TableHead className="h-14 font-bold text-slate-700">
                Acuan Standar
              </TableHead>
              <TableHead className="h-14 font-bold text-slate-700">
                Biaya
              </TableHead>
              <TableHead className="h-14 font-bold text-slate-700">
                Jumlah
              </TableHead>
              <TableHead className="h-14 font-bold text-slate-700">
                Subtotal
              </TableHead>
              <TableHead className="h-14"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow
                key={item.id}
                className="group border-slate-100 hover:bg-slate-50/50"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color.split(" ")[1]}`}
                    >
                      <Beaker
                        className={`h-5 w-5 ${item.color.split(" ")[0]}`}
                      />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">
                        {item.category}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-400">
                        {item.parent}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] font-bold ${item.color.replace("bg-", "border-").split(" ")[1]} ${item.color.split(" ")[0]}`}
                  >
                    {item.param}
                  </span>
                </TableCell>
                <TableCell className="max-w-50">
                  <div className="text-[11px] leading-tight font-bold text-slate-700">
                    {item.standard}
                  </div>
                </TableCell>
                <TableCell className="font-bold text-slate-800">
                  {item.price}
                </TableCell>
                <TableCell>
                  <div className="flex h-9 w-12 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-600">
                    {item.count}
                  </div>
                </TableCell>
                <TableCell className="font-bold text-[#1E40AF]">
                  {item.subtotal}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    className="h-9 rounded-lg bg-[#1E40AF] px-4 font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-center gap-2 pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 rounded-lg bg-slate-800 p-0 text-white hover:bg-slate-900"
        >
          1
        </Button>
        {[2, 3].map((p) => (
          <Button
            key={p}
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-lg p-0 text-slate-400 hover:text-slate-800"
          >
            {p}
          </Button>
        ))}
        <span className="px-2 text-slate-300">...</span>
        {[67, 68].map((p) => (
          <Button
            key={p}
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-lg p-0 text-slate-400 hover:text-slate-800"
          >
            {p}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="ml-2 font-bold text-slate-500"
        >
          Next →
        </Button>
      </div>
    </Card>
  );
}
