import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function LocationSection() {
  return (
    <Card className="space-y-8 border-none bg-white/80 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1E40AF]">
          <MapPin className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">
            Area lokasi pengujian
          </h3>
          <p className="text-sm text-slate-500">
            Masukkan data lokasi pengujian
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-xs font-bold tracking-wider text-slate-700 uppercase">
            Nama Lokasi *
          </Label>
          <Input
            className="h-12 w-full rounded-lg border border-blue-100 bg-white px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            placeholder="masukkan nama lokasi"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold tracking-wider text-slate-700 uppercase">
            Kota/Kabupaten *
          </Label>
          <Input
            className="h-12 w-full rounded-lg border border-blue-100 bg-white px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            placeholder="masukkan kota/kabupaten"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold tracking-wider text-slate-700 uppercase">
            Kecamatan *
          </Label>
          <Input
            className="h-12 w-full rounded-lg border border-blue-100 bg-white px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            placeholder="masukkan kecamatan"
          />
        </div>
      </div>

      <Button
        variant="outline"
        className="h-12 w-full border-2 border-dashed border-blue-200 bg-transparent font-bold text-[#1E40AF] hover:border-blue-300 hover:bg-blue-50"
      >
        <Plus className="mr-2 h-4 w-4" /> Tambah Lokasi Pengujian
      </Button>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="group flex items-start justify-between rounded-2xl border border-slate-100 bg-white p-6 transition-all hover:border-blue-200"
          >
            <div className="flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#1E40AF] transition-transform group-hover:scale-110">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800">Workshop PT. SSB</h4>
                <p className="max-w-md text-sm leading-relaxed text-slate-400">
                  Curabitur faucibus porttitor lectus. Curabitur odio magna,
                  finibus ac ligula scelerisque, efficitur feugiat sem.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-blue-100 bg-transparent px-4 font-semibold text-[#1E40AF] hover:bg-blue-50"
              >
                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-rose-100 bg-transparent px-4 font-semibold text-rose-500 hover:border-rose-200 hover:bg-rose-50"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Hapus
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
