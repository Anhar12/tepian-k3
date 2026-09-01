import { useEffect, useRef, useState } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Map,
  MapPinned,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export type TestingLocation = {
  id?: string;
  name: string;
  regencyId: string;
  regencyName: string;
  districtId: string;
  districtName: string;
  isNew?: boolean;
};

interface TestingLocationListProps {
  locations: TestingLocation[];
  onAdd: () => void;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}

export function TestingLocationList({
  locations,
  onAdd,
  onEdit,
  onRemove,
}: TestingLocationListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    setCanScrollLeft(container.scrollLeft > 0);

    setCanScrollRight(
      container.scrollLeft + container.clientWidth < container.scrollWidth - 1,
    );
  };

  useEffect(() => {
    updateScrollState();

    window.addEventListener("resize", updateScrollState);

    return () => {
      window.removeEventListener("resize", updateScrollState);
    };
  }, [locations.length]);

  const scroll = (direction: "left" | "right") => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.scrollBy({
      left:
        direction === "left" ? -container.clientWidth : container.clientWidth,
      behavior: "smooth",
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h4 className="font-semibold text-slate-800">Lokasi Pengujian</h4>

          <p className="text-sm text-slate-500">
            {locations.length > 0
              ? `${locations.length} lokasi telah ditambahkan.`
              : "Belum ada lokasi pengujian."}
          </p>
        </div>

        <Button type="button" onClick={onAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah Lokasi
        </Button>
      </div>

      {/* Empty */}
      {locations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <Building2 className="mx-auto mb-3 h-9 w-9 text-slate-400" />

          <p className="text-sm font-medium text-slate-700">
            Belum ada lokasi pengujian
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Klik tombol Tambah Lokasi untuk menambahkan lokasi.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Left */}
          {canScrollLeft && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              className="absolute top-1/2 -left-3 z-10 h-9 w-9 -translate-y-1/2 rounded-full bg-white shadow-md"
              aria-label="Geser ke kiri"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}

          <div
            ref={containerRef}
            onScroll={updateScrollState}
            className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2"
          >
            {locations.map((location, index) => (
              <div
                key={`${location.regencyId}-${location.districtId}-${index}`}
                className="w-full shrink-0 snap-start rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]"
              >
                {/* Card header */}
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>

                    <div className="min-w-0">
                      <p
                        className="truncate font-semibold text-slate-800"
                        title={location.name}
                      >
                        {location.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 border-t border-b border-slate-100 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-50">
                      <Map className="h-4 w-4 text-slate-500" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">Kabupaten/Kota</p>

                      <p className="truncate text-sm font-medium text-slate-700">
                        {location.regencyName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-50">
                      <MapPinned className="h-4 w-4 text-slate-500" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">Kecamatan</p>

                      <p className="truncate text-sm font-medium text-slate-700">
                        {location.districtName || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-end gap-1 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(index)}
                    className="h-8 w-8 text-yellow-400 hover:bg-yellow-100 hover:text-yellow-700"
                    aria-label={`Edit ${location.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(index)}
                    className="h-8 w-8 text-red-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Hapus ${location.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Right */}
          {canScrollRight && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              className="absolute top-1/2 -right-3 z-10 h-9 w-9 -translate-y-1/2 rounded-full bg-white shadow-md"
              aria-label="Geser ke kanan"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
