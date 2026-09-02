import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { Building2, Check, MapPin, Plus } from "lucide-react";

import ImageWithFallback from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

import { globalWarningToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useTestingLocationDialogStore } from "@/stores/testing-location-dialog.stores";
import { trpc } from "@/utils/trpc";

import CreateCompanyLocationDialog from "../../dashboard/company/-components/create-company-location-dialog";

const routeApi = getRouteApi("/(core)/pengujian/");

interface LocationSectionProps {
  mode?: "company" | "location";
  companyId?: string;
  selectedLocationIds?: string[];
  onCompanyChange?: (id: string) => void;
  onLocationChange?: (ids: string[]) => void;
  onLocationNamesChange?: (locations: { id: string; name: string }[]) => void;
}

/**
 * Memilih perusahaan atau beberapa lokasi untuk order pengujian.
 */
export function LocationSection({
  mode = "location",
  companyId: controlledCompanyId,
  selectedLocationIds,
  onCompanyChange,
  onLocationChange,
  onLocationNamesChange,
}: LocationSectionProps) {
  const { companyId, locationId } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  const [selectedCompany, setSelectedCompany] = useState<string | null>(
    controlledCompanyId || companyId || null,
  );

  const [selectedLocation, setSelectedLocation] = useState<string[]>(
    selectedLocationIds ?? (locationId ? [locationId] : []),
  );

  const [currentLocation, setCurrentLocation] = useState<string | null>(
    locationId || null,
  );

  const setIsCreateDialogOpen = useTestingLocationDialogStore(
    (state) => state.setIsCreateDialogOpen,
  );

  const { data: company, isLoading: isCompanyLoading } = useQuery(
    trpc.pengujian.userCompany.getAllUserCompaniesByUserId.queryOptions(),
  );

  const { data: testingLocation, isLoading } = useQuery({
    ...trpc.pengujian.userCompanyTestingLocation.getAllUserCompanyTestingLocationsByCompanyIdAndUserId.queryOptions(
      {
        companyId: selectedCompany || "",
      },
    ),
    enabled: Boolean(selectedCompany),
  });

  const selectedTestingLocations = testingLocation;
  useEffect(() => {
    if (testingLocation?.length)
      onLocationNamesChange?.(
        testingLocation.map((location) => ({
          id: location.id,
          name: `${locationDisplayName(location.name)}\n${location.regency?.name ?? "-"}, ${location.district?.name ?? "-"}`,
        })),
      );
  }, [testingLocation]);
  const locationDisplayName = (name: string) =>
    name.replace(/^Lokasi Pengujian\s*\d+\s*[-—]\s*/i, "");

  const handleCompanySelect = (id: string) => {
    setSelectedCompany(id);
    onCompanyChange?.(id);

    navigate({
      to: "/pengujian",
      search: (old) => ({
        ...old,
        companyId: id,
        locationId: undefined,
      }),
      resetScroll: false,
    });
  };

  const handleCreateLocation = () => {
    if (!selectedCompany) {
      globalWarningToast(
        "Pilih perusahaan terlebih dahulu sebelum menambahkan lokasi pengujian.",
      );

      return;
    }

    setIsCreateDialogOpen(true);
  };

  const handleLocationCardClick = (locationId: string) => {
    const isCurrentLocation = currentLocation === locationId;

    if (isCurrentLocation) {
      setCurrentLocation(null);

      navigate({
        to: "/pengujian",
        search: (old) => ({
          ...old,
          companyId: selectedCompany || "",
          locationId: undefined,
        }),
        resetScroll: false,
      });
    } else {
      setCurrentLocation(locationId);

      navigate({
        to: "/pengujian",
        search: (old) => ({
          ...old,
          companyId: selectedCompany || "",
          locationId,
        }),
        resetScroll: false,
      });
    }

    const nextLocations = selectedLocation.includes(locationId)
      ? selectedLocation.filter((id) => id !== locationId)
      : [...selectedLocation, locationId];

    setSelectedLocation(nextLocations);
    onLocationChange?.(nextLocations);
  };

  return (
    <div className="w-full space-y-6">
      {/* Company Selection */}
      <div className={cn(mode !== "company" && "hidden")}>
        {/* Company Header */}
        <div className="mb-5 flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-primary">
              <Building2 className="size-5" />
            </div>

            <div>
              <h3 className="font-bold text-slate-800">Pilih perusahaan</h3>

              <p className="text-sm text-slate-500">
                Pilih perusahaan yang akan dilakukan pengujian.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="flex h-10 gap-2"
            onClick={() =>
              navigate({
                from: "/pengujian",
                to: "/dashboard/company/create",
              })
            }
          >
            <Plus className="size-4" />
            Tambah Perusahaan
          </Button>
        </div>

        {/* Company List */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {isCompanyLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <Card
                  key={index}
                  className="space-y-5 rounded-3xl border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <Skeleton className="size-12 rounded-xl" />
                    <Skeleton className="h-4 w-20 rounded-full" />
                  </div>

                  <Skeleton className="h-7 w-3/4" />

                  <div className="space-y-3 border-t pt-4">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-28" />
                    </div>

                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </Card>
              ))
            : company?.map((item) => {
                const isSelected = selectedCompany === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleCompanySelect(item.id)}
                    className={cn(
                      "group relative rounded-3xl border bg-white p-5 text-left shadow-sm transition-all duration-200",
                      "hover:-translate-y-1 hover:border-primary hover:shadow-lg",
                      "focus-visible:ring-2 focus-visible:outline-none",
                      "focus-visible:ring-primary focus-visible:ring-offset-2",
                      isSelected
                        ? "border-primary bg-blue-50/30 shadow-md ring-2 ring-primary"
                        : "border-slate-200",
                    )}
                  >
                    {isSelected && (
                      <span className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-full bg-primary text-white">
                        <Check className="size-4" />
                      </span>
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={cn(
                          "flex size-12 items-center justify-center overflow-hidden rounded-xl",
                          isSelected ? "bg-primary/10" : "bg-slate-100",
                        )}
                      >
                        <ImageWithFallback
                          src={item.companyPictureUrl ?? ""}
                          alt={`Logo ${item.name}`}
                          className="h-full w-full object-cover"
                          fallbackIcon={Building2}
                          fallbackClassName="text-slate-500"
                        />
                      </span>

                      <span className="text-xs font-semibold text-slate-500">
                        Perusahaan
                      </span>
                    </div>

                    <h4 className="mt-5 text-xl font-bold text-slate-800">
                      {item.name}
                    </h4>

                    <div className="mt-4 space-y-2 border-t pt-4 text-sm">
                      <p className="flex justify-between gap-3">
                        <span className="text-slate-500">Provinsi</span>

                        <span className="text-right font-medium">
                          {item.province?.name ?? "-"}
                        </span>
                      </p>

                      <p className="flex justify-between gap-3">
                        <span className="text-slate-500">Kabupaten/Kota</span>

                        <span className="text-right font-medium">
                          {item.regency?.name ?? "-"}
                        </span>
                      </p>
                    </div>
                  </button>
                );
              })}
        </div>
      </div>

      {/* Testing Location Selection */}
      <div
        className={cn(
          "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm",
          mode !== "location" && "hidden",
        )}
      >
        {/* Location Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-primary">
              <MapPin className="size-5" />
            </div>

            <div>
              <h3 className="font-bold text-slate-800">
                Pilih lokasi pengujian
              </h3>

              <p className="text-sm text-slate-500">
                Pilih semua lokasi yang ingin dimasukkan ke pesanan.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={handleCreateLocation}
          >
            <Plus className="size-4" />
            Tambah Lokasi Pengujian
          </Button>
        </div>

        {/* Location Selection Info */}
        <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <span className="text-slate-500">
            Klik card untuk memilih atau membatalkan lokasi.
          </span>

          <span className="font-semibold text-primary">
            {selectedLocation.length} lokasi dipilih
          </span>
        </div>
      </div>

      {/* Location Preview */}
      {mode === "location" &&
        (isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card
                key={index}
                className="space-y-5 rounded-3xl border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <Skeleton className="size-12 rounded-xl" />
                  <Skeleton className="size-7 rounded-full" />
                </div>

                <Skeleton className="h-7 w-3/4" />

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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {selectedTestingLocations.map((area, index) => {
              const isSelected = selectedLocation.includes(area.id);

              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => handleLocationCardClick(area.id)}
                  className={cn(
                    "group relative w-full rounded-3xl border bg-white p-5 text-left shadow-sm transition-all duration-200",
                    "hover:-translate-y-1 hover:border-primary hover:shadow-lg",
                    "focus-visible:ring-2 focus-visible:outline-none",
                    "focus-visible:ring-primary focus-visible:ring-offset-2",
                    isSelected
                      ? "border-primary bg-blue-50/30 shadow-md ring-2 ring-primary"
                      : "border-slate-200",
                  )}
                >
                  <Card className="m-0 gap-1 border-none bg-transparent p-0 shadow-none">
                    <div className="flex items-start gap-4">
                      <span
                        className={cn(
                          "flex size-12 items-center justify-center rounded-xl p-0",
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "bg-slate-100 text-slate-500",
                        )}
                      >
                        <MapPin className="size-6" />
                      </span>

                      {isSelected && (
                        <span className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-full bg-primary text-white">
                          <Check className="size-4" />
                        </span>
                      )}

                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-400">
                          Lokasi {index + 1}
                        </p>
                        <h4 className="text-xl font-bold break-words text-slate-800">
                          {locationDisplayName(area.name)}
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-2 border-t pt-4 text-sm">
                      <p className="flex justify-between gap-3">
                        <span className="text-slate-500">Kota/Kabupaten</span>

                        <span className="text-right font-medium">
                          {area.regency?.name ?? "-"}
                        </span>
                      </p>

                      <p className="flex justify-between gap-3">
                        <span className="text-slate-500">Kecamatan</span>

                        <span className="text-right font-medium">
                          {area.district?.name ?? "-"}
                        </span>
                      </p>
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<MapPin className="h-12 w-12 text-slate-300" />}
            title="Belum ada lokasi pengujian"
            description="Anda belum menambahkan lokasi pengujian. Klik tombol di atas untuk menambahkan lokasi pertama Anda."
          />
        ))}

      {/* Create Location Dialog */}
      {selectedCompany && (
        <CreateCompanyLocationDialog companyId={selectedCompany} />
      )}
    </div>
  );
}
