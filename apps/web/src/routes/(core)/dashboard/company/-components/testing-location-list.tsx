import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";

import ComboBox from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { trpc } from "@/utils/trpc";

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
  regency?: Array<{
    id: string;
    name: string;
  }>;
  onAdd: () => void;
  onChange?: (index: number, location: TestingLocation) => void;
  onRegencyChange?: (index: number, regencyId: string) => void;
  onEdit?: (index: number) => void;
  onRemove: (index: number) => void;
}

/**
 * Menampilkan daftar lokasi pengujian.
 * Jika data regency tersedia, lokasi dapat diedit langsung.
 */
export function TestingLocationList({
  locations,
  regency,
  onAdd,
  onChange,
  onRegencyChange,
  onEdit,
  onRemove,
}: TestingLocationListProps) {
  const [openRegencyIndex, setOpenRegencyIndex] = useState<number | null>(null);

  const [openDistrictIndex, setOpenDistrictIndex] = useState<number | null>(
    null,
  );

  const districtQueries = useQueries({
    queries: locations.map((location) => ({
      ...trpc.platform.district.getAllDistrictsByRegencyId.queryOptions({
        regencyId: location.regencyId,
      }),
      enabled: !!location.regencyId,
    })),
  });

  const isEditable = Boolean(regency);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-slate-800">Lokasi Pengujian</h4>

        <p className="text-sm text-slate-500">
          Tambahkan dan lengkapi lokasi pengujian perusahaan.
        </p>
      </div>

      {locations.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
          Belum ada lokasi pengujian. Klik kartu{" "}
          <span className="font-semibold text-primary">Tambah</span> untuk
          menambahkan lokasi.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {locations.map((location, index) => (
          <div
            key={location.id ?? `location-${index}`}
            className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm"
          >
            <div className="mb-5 flex items-center justify-between">
              <h5 className="font-semibold text-slate-800">Data Lokasi</h5>

              <div className="flex gap-1">
                {onEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(index)}
                    aria-label="Edit lokasi"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(index)}
                  className="h-9 w-9 text-destructive hover:bg-destructive/10"
                  aria-label="Hapus lokasi"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {isEditable ? (
              <div className="space-y-4">
                <Field>
                  <FieldLabel>
                    Nama Lokasi Pengujian
                    <span className="text-destructive">*</span>
                  </FieldLabel>

                  <Input
                    value={location.name}
                    placeholder="cth: Workshop"
                    onChange={(event) =>
                      onChange?.(index, {
                        ...location,
                        name: event.target.value,
                      })
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel>
                    Kabupaten/Kota
                    <span className="text-destructive">*</span>
                  </FieldLabel>

                  <ComboBox
                    options={regency ?? []}
                    value={location.regencyId}
                    onChange={(value) => onRegencyChange?.(index, value)}
                    placeholder="Pilih kabupaten/kota"
                    searchPlaceholder="Cari kabupaten/kota"
                    emptyMessage="Kabupaten/kota tidak ditemukan."
                    open={openRegencyIndex === index}
                    onOpenChange={(open) =>
                      setOpenRegencyIndex(open ? index : null)
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel>
                    Kecamatan
                    <span className="text-destructive">*</span>
                  </FieldLabel>

                  <ComboBox
                    options={districtQueries[index]?.data ?? []}
                    value={location.districtId}
                    onChange={(value) => {
                      const selectedDistrict = districtQueries[
                        index
                      ]?.data?.find((item) => item.id === value);

                      onChange?.(index, {
                        ...location,
                        districtId: value,
                        districtName: selectedDistrict?.name ?? "",
                      });
                    }}
                    placeholder="Pilih kecamatan"
                    searchPlaceholder="Cari kecamatan"
                    emptyMessage="Kecamatan tidak ditemukan."
                    disabled={!location.regencyId}
                    open={openDistrictIndex === index}
                    onOpenChange={(open) =>
                      setOpenDistrictIndex(open ? index : null)
                    }
                  />
                </Field>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-slate-600">
                <p className="font-medium">{location.name}</p>

                <p>{location.regencyName}</p>

                <p>{location.districtName}</p>
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={onAdd}
          className="flex min-h-[300px] flex-col items-center justify-center rounded-xl bg-primary/5 text-primary transition-colors hover:bg-primary/10"
        >
          <Plus className="mb-2 h-8 w-8" />

          <span className="text-lg font-semibold">Tambah</span>
        </button>
      </div>
    </div>
  );
}
