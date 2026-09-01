import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import ComboBox from "@/components/ui/combobox";
import { EmptyState } from "@/components/ui/empty-state";
import MultiComboBox from "@/components/ui/multi-combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { globalWarningToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart.stores";
import { useTestingLocationDialogStore } from "@/stores/testing-location-dialog.stores";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { Building2, MapPin, ArrowRight } from "lucide-react";
import { useState } from "react";
import CreateCompanyLocationDialog from "../../dashboard/company/-components/create-company-location-dialog";

const routeApi = getRouteApi("/(core)/pengujian/");

export function LocationSection() {
  const { companyId, locationId } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  const [companyOpen, setCompanyOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(
    companyId || null,
  );
  const [locationOpen, setLocationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string[]>(
    locationId ? [locationId] : [],
  );
  const [currentLocation, setCurrentLocation] = useState<string | null>(
    locationId || null,
  );

  const setCartItems = useCartStore((state) => state.setCartItems);
  const setIsCreateDialogOpen = useTestingLocationDialogStore(
    (state) => state.setIsCreateDialogOpen,
  );

  const { data: company, isLoading: isCompanyLoading } = useQuery(
    trpc.pengujian.userCompany.getAllUserCompaniesByUserId.queryOptions(),
  );

  const { data: testingLocation, isLoading } = useQuery({
    ...trpc.pengujian.userCompanyTestingLocation.getAllUserCompanyTestingLocationsByCompanyIdAndUserId.queryOptions(
      { companyId: selectedCompany || "" },
    ),
    enabled: !!selectedCompany,
  });

  const selectedTestingLocations = testingLocation?.filter((location) =>
    selectedLocation.includes(location.id),
  );

  return (
    <div className="w-full space-y-6">
      {/* dari sini */}

      <div className="block w-full overflow-hidden rounded-2xl border shadow md:flex">
        <div className="space-y-6 bg-primary px-5 py-7 text-white md:w-1/4">
          <p className="">Tepian K3</p>
          <h2 className="text-3xl font-semibold">Order Pengujian</h2>
        </div>

        <div className="space-y-6 bg-white p-4 px-5 py-7 md:w-3/4">
          <div className="flex justify-between">
            <p className="text-primary">Langkah 1</p>

            <div className="flex-end flex flex-col">
              <div></div>
              <p className="text-primary">1/3 selesai</p>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-semibold">Pilih Perusahaan</h2>
              <p className="text-sm text-slate-600">
                Pilih perusahaan atau daftarkan Perusahaan anda.
              </p>
            </div>

            <button className="flex items-center gap-2">
              Lanjut
              <ArrowRight className="size-5"></ArrowRight>
            </button>
          </div>
        </div>
      </div>

      {/* sampe sini */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Building2 className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-800">
              Pilih Perusahaan
            </h3>
            <p className="mt-0.5 text-sm text-slate-500">
              Pilih perusahaan yang akan dilakukan pengujian
            </p>
          </div>
        </div>

        {/* Company Selection */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <ComboBox
            options={company ?? []}
            value={selectedCompany ?? ""}
            onChange={(id: string) => {
              setSelectedCompany(id);
              navigate({
                to: "/pengujian",
                search: (old) => ({ ...old, companyId: id }),
              });
            }}
            placeholder="Pilih perusahaan..."
            searchPlaceholder="Cari perusahaan..."
            emptyMessage="Tidak ada perusahaan yang ditemukan."
            open={companyOpen}
            onOpenChange={setCompanyOpen}
            className="h-10 w-full"
            disabled={isCompanyLoading}
            isLoading={isCompanyLoading}
          />

          <Button
            className="h-10 w-full cursor-pointer"
            onClick={() =>
              navigate({
                from: "/pengujian",
                to: "/dashboard/company/create",
              })
            }
          >
            Tambah Perusahaan
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <MapPin className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-800">
              Lokasi Pengujian
            </h3>
            <p className="mt-0.5 text-sm text-slate-500">
              Masukkan lokasi pengujian sebelum menentukan parameter pengujian
            </p>
          </div>
        </div>

        {/* Location Selection */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <MultiComboBox
            options={testingLocation ?? []}
            value={selectedLocation ?? []}
            onChange={setSelectedLocation}
            placeholder="Pilih lokasi..."
            searchPlaceholder="Cari lokasi..."
            emptyMessage="Tidak ada lokasi yang ditemukan."
            open={locationOpen}
            onOpenChange={setLocationOpen}
            className="h-10 w-full"
            disabled={!selectedCompany || isLoading}
            isLoading={isLoading}
          />

          <Button
            className="h-10 w-full cursor-pointer"
            onClick={() => {
              if (!selectedCompany) {
                globalWarningToast(
                  "Pilih perusahaan terlebih dahulu sebelum menambahkan lokasi pengujian.",
                );
                return;
              }

              setIsCreateDialogOpen(true);
            }}
          >
            Tambah Lokasi Pengujian
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="min-w-65 space-y-4 rounded-3xl border-none bg-white p-4 shadow-md shadow-slate-100 sm:min-w-[320px] sm:p-6"
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
      ) : selectedTestingLocations && selectedTestingLocations.length > 0 ? (
        <div className="flex flex-col items-center justify-center">
          <Carousel className="w-full px-8 sm:w-[calc(100%-6rem)] sm:px-0">
            <CarouselContent
              className="-ml-1"
              wrapperClassName="overflow-visible"
            >
              {selectedTestingLocations.map((area) => (
                <CarouselItem
                  key={area.id}
                  className={cn(
                    "w-70 max-w-[320px] p-2 transition-all duration-250 sm:w-auto",
                    currentLocation === area.id
                      ? "scale-105"
                      : "scale-95 opacity-70",
                  )}
                  onClick={() => {
                    const arrayOfObjects = [
                      { id: area.id, name: area.name, items: [] },
                    ];

                    if (currentLocation === area.id) {
                      setCurrentLocation(null);
                      navigate({
                        to: "/pengujian",
                        search: (old) => ({
                          ...old,
                          companyId: selectedCompany || "",
                          locationId: undefined,
                        }),
                      });
                    } else {
                      setCurrentLocation(area.id);
                      navigate({
                        to: "/pengujian",
                        search: (old) => ({
                          ...old,
                          companyId: selectedCompany || "",
                          locationId: area.id,
                        }),
                      });
                    }

                    setCartItems(arrayOfObjects);
                  }}
                >
                  <Card
                    key={area.id}
                    className={cn(
                      "space-y-4 rounded-3xl border-none bg-white p-6 shadow-md shadow-slate-100",
                      currentLocation === area.id &&
                        "shadow-lg ring-3 shadow-blue-100 ring-blue-500",
                    )}
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
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      ) : (
        <EmptyState
          icon={<MapPin className="h-12 w-12 text-slate-300" />}
          title="Belum ada lokasi pengujian"
          description="Anda belum menambahkan lokasi pengujian. Klik tombol di atas untuk menambahkan lokasi pertama Anda."
        />
      )}
      {selectedCompany && (
        <CreateCompanyLocationDialog companyId={selectedCompany} />
      )}
    </div>
  );
}
