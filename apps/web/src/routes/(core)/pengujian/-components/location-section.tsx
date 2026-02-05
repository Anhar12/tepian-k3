import { MapPin, Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import ComboBox from "@/components/ui/combobox";
import { useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import CreateCompanyLocationDialog from "../../dashboard/company/-components/create-company-location-dialog";
import { useTestingLocationDialogStore } from "@/stores/testing-location-dialog.stores";
import { globalWarningToast } from "@/lib/toast";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import MultiComboBox from "@/components/ui/multi-combobox";
import { useCartStore } from "@/stores/cart.stores";
import { EmptyState } from "@/components/ui/empty-state";

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
    trpc.userCompany.getAllUserCompaniesByUserId.queryOptions(),
  );

  const { data: testingLocation, isLoading } = useQuery({
    ...trpc.userCompanyTestingLocation.getAllUserCompanyTestingLocationsByCompanyIdAndUserId.queryOptions(
      { companyId: selectedCompany || "" },
    ),
    enabled: !!selectedCompany,
  });

  const selectedTestingLocations = testingLocation?.filter((location) =>
    selectedLocation.includes(location.id),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-row items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Pilih Perushaan</h3>
            <p className="text-sm text-slate-500">
              Pilih perusahaan tempat lokasi pengujian berada
            </p>
          </div>
        </div>

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
          className="w-full"
          disabled={isCompanyLoading}
          isLoading={isCompanyLoading}
        />

        <Button
          className="flex h-10 w-full items-center gap-2 text-center text-base font-semibold"
          onClick={() =>
            navigate({
              from: "/pengujian",
              to: "/dashboard/company/create",
            })
          }
        >
          <Plus className="size-6" />
          Tambah Perusahaan
        </Button>
      </div>

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

        <MultiComboBox
          options={testingLocation ?? []}
          value={selectedLocation ?? []}
          onChange={setSelectedLocation}
          placeholder="Pilih lokasi..."
          searchPlaceholder="Cari lokasi..."
          emptyMessage="Tidak ada lokasi yang ditemukan."
          open={locationOpen}
          onOpenChange={setLocationOpen}
          className="w-full"
          disabled={!selectedCompany || isLoading}
          isLoading={isLoading}
        />

        <Button
          className="flex h-10 w-full items-center gap-2 text-center text-base font-semibold"
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
          <Plus className="size-6" />
          Tambah Lokasi Pengujian
        </Button>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="min-w-[260px] space-y-4 rounded-3xl border-none bg-white p-4 shadow-md shadow-slate-100 sm:min-w-[320px] sm:p-6"
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
            <CarouselContent className="-ml-1">
              {selectedTestingLocations.map((area) => (
                <CarouselItem
                  key={area.id}
                  className="w-[280px] max-w-[320px] p-2 sm:w-auto"
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
                        "ring-2 ring-blue-500 *:ring-offset-2",
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
