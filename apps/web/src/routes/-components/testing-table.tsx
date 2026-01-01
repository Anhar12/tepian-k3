import {
  ClipboardList,
  Search,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  TestTube2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useSuspenseQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { Route } from "../transaksi";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";

const data = [
  {
    id: 1,
    cat: "Faktor Fisika",
    sub: "Lingkungan Kerja",
    param: "Temperatur (°C)",
    standard: "SNI 16-7063-2004",
    price: 150000,
    color: "text-emerald-500 bg-emerald-50",
  },
  {
    id: 2,
    cat: "Kebisingan",
    sub: "Lingkungan Kerja",
    param: "Intensitas (dB)",
    standard: "KEP-48/MEN/VIII/2016",
    price: 200000,
    color: "text-orange-500 bg-orange-50",
  },
  {
    id: 3,
    cat: "Suhu Ruangan",
    sub: "Lingkungan Kerja",
    param: "Temperatur (°C)",
    standard: "SNI 16-7063-2004",
    price: 150000,
    color: "text-emerald-500 bg-emerald-50",
  },
  {
    id: 4,
    cat: "Suhu Ruangan",
    sub: "Lingkungan Kerja",
    param: "Temperatur (°C)",
    standard: "SNI 16-7063-2004",
    price: 150000,
    color: "text-emerald-500 bg-emerald-50",
  },
  {
    id: 5,
    cat: "Suhu Ruangan",
    sub: "Lingkungan Kerja",
    param: "Temperatur (°C)",
    standard: "SNI 16-7063-2004",
    price: 150000,
    color: "text-emerald-500 bg-emerald-50",
  },
  {
    id: 6,
    cat: "Timbal dalam Darah",
    sub: "Biomarker",
    param: "Pb Blood (μg/dL)",
    standard: "ACGIH BEI",
    price: 350000,
    color: "text-violet-500 bg-violet-50",
  },
  {
    id: 7,
    cat: "Kualitas Air Limbah",
    sub: "Lingkungan Hidup",
    param: "pH, BOD, COD",
    standard: "Permen LH No. 5/2014",
    price: 500000,
    color: "text-emerald-400 bg-emerald-50/50",
  },
];

interface TestingTableProps extends React.HTMLAttributes<HTMLDivElement> {
  ref: React.Ref<HTMLDivElement>;
}

export function TestingTable(props: TestingTableProps) {
  const params = Route.useSearch();
  const navigate = useNavigate();

  const { data: parameters } = useSuspenseQuery(
    trpc.parameter.getOffsetPaginatedParametersByClusterIdAndCategoryId.queryOptions(
      params,
    ),
  );

  const goToPage = (page: number) => {
    navigate({
      to: "/transaksi",
      search: { ...params, page },
    });
  };

  return (
    <div
      className="space-y-8 rounded-4xl border border-slate-100 bg-white p-10 shadow-sm"
      {...props}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <ClipboardList className="h-5 w-5" />
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

      <div className="flex flex-col gap-4 md:flex-row">
        <Select>
          <SelectTrigger className="h-11 w-full rounded-full border-slate-200 bg-slate-50/50 md:w-60">
            <SelectValue placeholder="Pilih kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fisika">Faktor Fisika</SelectItem>
            <SelectItem value="kimia">Faktor Kimia</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="h-11 w-full rounded-full border-slate-200 bg-slate-50/50 pl-11"
            placeholder="Cari Parameter..."
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="font-bold text-slate-600">
                kategori Parameter
              </TableHead>
              <TableHead className="font-bold text-slate-600">
                Parameter
              </TableHead>
              <TableHead className="font-bold text-slate-600">
                Acuan Standar
              </TableHead>
              <TableHead className="font-bold text-slate-600">Biaya</TableHead>
              <TableHead className="font-bold text-slate-600">Jumlah</TableHead>
              <TableHead className="font-bold text-slate-600">
                Subtotal
              </TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parameters.data.map((row) => (
              <TableRow key={row.id} className="group border-slate-100">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg`,
                      )}
                    >
                      <TestTube2 className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">
                        {row.category.name}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {row.cluster.name}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="rounded-full border-none bg-blue-50 px-3 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-100"
                  >
                    {row.name}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-35 text-[10px] font-medium text-slate-500">
                  <div className="font-bold text-slate-700">
                    {row.reference?.split(" ")[0]}{" "}
                    {row.reference?.split(" ")[1]}
                  </div>
                  <div>{row.reference?.split(" ").slice(2).join(" ")}</div>
                </TableCell>
                <TableCell className="text-sm font-bold text-slate-800">
                  Rp {row.price.toLocaleString("id-ID")}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    defaultValue={1}
                    className="h-10 w-16 rounded-xl border-slate-200 bg-slate-50/50 text-center font-bold"
                  />
                </TableCell>
                <TableCell className="text-sm font-bold text-[#0056B3]">
                  Rp {row.price.toLocaleString("id-ID")}
                </TableCell>
                <TableCell className="text-right">
                  <Button className="h-10 gap-2 rounded-xl bg-[#4285F4] px-4 text-[10px] font-bold text-white transition-all hover:bg-blue-600 hover:shadow-lg">
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-slate-400"
          disabled={params.page === 1}
          onClick={() => goToPage(params.page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* First page */}
        {params.page > 2 && (
          <Button
            variant="ghost"
            className="h-8 w-8 rounded-lg p-0 text-xs font-bold text-slate-500"
            onClick={() => goToPage(1)}
          >
            1
          </Button>
        )}

        {/* Ellipsis before current page */}
        {params.page > 3 && (
          <span className="px-2 text-xs text-slate-400">...</span>
        )}

        {/* Previous page */}
        {params.page > 1 && (
          <Button
            variant="ghost"
            className="h-8 w-8 rounded-lg p-0 text-xs font-bold text-slate-500"
            onClick={() => goToPage(params.page - 1)}
          >
            {params.page - 1}
          </Button>
        )}

        {/* Current page */}
        <Button
          variant="secondary"
          className="h-8 w-8 rounded-lg bg-[#333] p-0 text-xs font-bold text-white hover:bg-slate-800"
        >
          {params.page}
        </Button>

        {/* Next page */}
        {params.page < parameters.pageCount && (
          <Button
            variant="ghost"
            className="h-8 w-8 rounded-lg p-0 text-xs font-bold text-slate-500"
            onClick={() => goToPage(params.page + 1)}
          >
            {params.page + 1}
          </Button>
        )}

        {/* Ellipsis after current page */}
        {params.page < parameters.pageCount - 2 && (
          <span className="px-2 text-xs text-slate-400">...</span>
        )}

        {/* Last page */}
        {params.page < parameters.pageCount - 1 && (
          <Button
            variant="ghost"
            className="h-8 w-8 rounded-lg p-0 text-xs font-bold text-slate-500"
            onClick={() => goToPage(parameters.pageCount)}
          >
            {parameters.pageCount}
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-slate-500 transition-colors hover:text-slate-900"
          disabled={params.page === parameters.pageCount}
          onClick={() => goToPage(params.page + 1)}
        >
          <span className="text-xs font-bold">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
