import { MapPin, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { IconAlertCircle, IconFolderCode } from "@tabler/icons-react";

const areas = [
  {
    id: 1,
    name: "Area 1",
    workshop: "Workshop PT.SSB",
    city: "Samarinda",
    sub: "Loa janan",
  },
  {
    id: 2,
    name: "Area 2",
    workshop: "Workshop PT.SSB",
    city: "Samarinda",
    sub: "Loa janan",
  },
  {
    id: 3,
    name: "Area 3",
    workshop: "Workshop PT.SSB",
    city: "Samarinda",
    sub: "Loa janan",
  },
];

export function LocationSection() {
  const { data: me } = useQuery(trpc.auth.me.queryOptions());

  return (
    <div className="space-y-6">
      {me ? (
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex flex-row items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">
                Area lokasi pengujian
              </h3>
              <p className="text-sm text-slate-500">
                Masukkan data lokasi pengujian
              </p>
            </div>
          </div>

          <Button className="flex h-10 w-full items-center gap-2 text-center text-base font-semibold">
            <Plus className="size-6" />
            Tambah Lokasi Pengujian
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconAlertCircle />
              </EmptyMedia>
              <EmptyTitle>
                Anda tidak dapat menambahkan lokasi pengujian
              </EmptyTitle>
              <EmptyDescription>
                Silakan daftar atau masuk untuk menambahkan dan mengelola lokasi
                pengujian Anda.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      )}

      {me && (
        <div className="group relative">
          <div className="scrollbar-hide flex gap-6 overflow-x-auto pb-4">
            {areas.map((area) => (
              <Card
                key={area.id}
                className="min-w-[320px] space-y-4 rounded-3xl border-none bg-white p-6 shadow-md shadow-slate-100"
              >
                <h4 className="border-b border-slate-100 pb-3 text-xl font-bold text-slate-800">
                  {area.name}
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-2xl bg-blue-50/50 p-4">
                    <span className="mb-1 block text-[10px] font-bold text-slate-400 uppercase">
                      Detail area/lokasi
                    </span>
                    <p className="font-bold text-slate-800">{area.workshop}</p>
                  </div>
                  <div className="rounded-2xl bg-blue-50/50 p-4">
                    <span className="mb-1 block text-[10px] font-bold text-slate-400 uppercase">
                      Detail area/lokasi
                    </span>
                    <p className="font-bold text-slate-800">{area.city}</p>
                  </div>
                  <div className="rounded-2xl bg-blue-50/50 p-4">
                    <span className="mb-1 block text-[10px] font-bold text-slate-400 uppercase">
                      Detail area/lokasi
                    </span>
                    <p className="font-bold text-slate-800">{area.sub}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute top-1/2 left-0 -translate-x-4 -translate-y-1/2 rounded-full border-none bg-[#0056B3] text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100 hover:bg-blue-700"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute top-1/2 right-0 translate-x-4 -translate-y-1/2 rounded-full border-none bg-[#0056B3] text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100 hover:bg-blue-700"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
