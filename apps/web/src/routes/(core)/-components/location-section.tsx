import { MapPin, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useTestingFormStore } from "@/stores/testing-form.stores";
import { cn } from "@/lib/utils";

export function LocationSection() {
  const currentSelectedCompanyId = useTestingFormStore(
    (state) => state.currentSelectedCompanyId,
  );
  const currentSelectedLocationId = useTestingFormStore(
    (state) => state.currentSelectedLocationId,
  );
  const setStep2Data = useTestingFormStore((state) => state.setStep2Data);

  const { data: testingLocation, isLoading } = useQuery({
    ...trpc.userCompanyTestingLocation.getAllUserCompanyTestingLocationsByCompanyIdAndUserId.queryOptions(
      { companyId: currentSelectedCompanyId || "" },
    ),
    enabled: !!currentSelectedCompanyId,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-row items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Area lokasi pengujian</h3>
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

      {isLoading ? (
        <div className="flex gap-6 overflow-x-auto pb-4">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="min-w-[320px] space-y-4 rounded-3xl border-none bg-white p-6 shadow-md shadow-slate-100"
            >
              <Skeleton className="h-7 w-24" />
              <div className="grid grid-cols-1 gap-4">
                <div className="rounded-2xl bg-blue-50/50 p-4">
                  <Skeleton className="mb-2 h-3 w-32" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <div className="rounded-2xl bg-blue-50/50 p-4">
                  <Skeleton className="mb-2 h-3 w-24" />
                  <Skeleton className="h-5 w-36" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : testingLocation && testingLocation.length > 0 ? (
        <div className="group relative">
          <div className="scrollbar-hide flex gap-6 pb-4">
            {testingLocation.map((area) => (
              <Card
                key={area.id}
                className={cn(
                  "space-y-4 rounded-3xl border-none bg-white p-6 shadow-md shadow-slate-100",
                  currentSelectedLocationId === area.id &&
                    "ring-2 ring-blue-500 *:ring-offset-2",
                )}
                onClick={() => {
                  const arrayOfObjects = [
                    { id: area.id, name: area.name, items: [] },
                  ];

                  setStep2Data(arrayOfObjects);
                }}
              >
                <h4 className="border-b border-slate-100 pb-3 text-xl font-bold text-slate-800">
                  {area.name}
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-2xl bg-blue-50/50 p-4">
                    <span className="mb-1 block text-[10px] font-bold text-slate-400 uppercase">
                      Kota/Kabupaten
                    </span>
                    <p className="font-bold text-slate-800">
                      {area.regency.name}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-blue-50/50 p-4">
                    <span className="mb-1 block text-[10px] font-bold text-slate-400 uppercase">
                      Kecamatan
                    </span>
                    <p className="font-bold text-slate-800">
                      {area.district.name}
                    </p>
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
      ) : (
        <Empty>
          <EmptyMedia>
            <MapPin className="h-12 w-12 text-slate-300" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>Belum ada lokasi pengujian</EmptyTitle>
            <EmptyDescription>
              Anda belum menambahkan lokasi pengujian. Klik tombol di atas untuk
              menambahkan lokasi pertama Anda.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
