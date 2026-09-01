import { useEffect, useState } from "react";
import { Building2, Map, MapPinned } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import ComboBox from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";

import type { TestingLocation } from "./testing-location-list";

interface TestingLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  location: TestingLocation | null;

  regency: Array<{
    id: string;
    name: string;
  }>;

  district: Array<{
    id: string;
    name: string;
  }>;

  onRegencyChange: (regencyId: string) => void;

  onSave: (location: TestingLocation) => void;
}

export function TestingLocationDialog({
  open,
  onOpenChange,
  location,
  regency,
  district,
  onRegencyChange,
  onSave,
}: TestingLocationDialogProps) {
  const isEdit = location !== null;

  const [name, setName] = useState("");
  const [regencyId, setRegencyId] = useState("");
  const [districtId, setDistrictId] = useState("");

  const [regencyOpen, setRegencyOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (location) {
      setName(location.name);
      setRegencyId(location.regencyId);
      setDistrictId(location.districtId);

      onRegencyChange(location.regencyId);
    } else {
      setName("");
      setRegencyId("");
      setDistrictId("");

      onRegencyChange("");
    }
  }, [open, location, onRegencyChange]);

  const handleRegencyChange = (value: string) => {
    setRegencyId(value);
    setDistrictId("");
    onRegencyChange(value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !regencyId || !districtId) {
      return;
    }

    const selectedRegency = regency.find((item) => item.id === regencyId);

    const selectedDistrict = district.find((item) => item.id === districtId);

    onSave({
      name: name.trim(),
      regencyId,
      regencyName: selectedRegency?.name ?? "-",
      districtId,
      districtName: selectedDistrict?.name ?? "-",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Lokasi Pengujian" : "Tambah Lokasi Pengujian"}
            </DialogTitle>

            <DialogDescription>
              {isEdit
                ? "Perbarui informasi lokasi pengujian."
                : "Tambahkan lokasi pengujian perusahaan."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-6">
            {/* Nama Lokasi */}
            <Field className="space-y-1">
              <FieldLabel className="ml-1 text-sm font-bold">
                Nama Lokasi
              </FieldLabel>

              <div className="relative">
                <Building2 className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Contoh: Pabrik Utama"
                  className="h-11 pl-9 text-sm"
                />
              </div>
            </Field>

            {/* Kabupaten */}
            <Field className="space-y-1">
              <FieldLabel className="ml-1 text-sm font-bold">
                Kabupaten/Kota
              </FieldLabel>

              <ComboBox
                options={regency}
                value={regencyId}
                onChange={handleRegencyChange}
                placeholder="Pilih kabupaten/kota..."
                searchPlaceholder="Cari kabupaten/kota..."
                emptyMessage="Tidak ada kabupaten/kota yang ditemukan."
                open={regencyOpen}
                onOpenChange={setRegencyOpen}
                icon={Map}
              />
            </Field>

            {/* Kecamatan */}
            <Field className="space-y-1">
              <FieldLabel className="ml-1 text-sm font-bold">
                Kecamatan
              </FieldLabel>

              <ComboBox
                options={district}
                value={districtId}
                onChange={setDistrictId}
                placeholder="Pilih kecamatan..."
                searchPlaceholder="Cari kecamatan..."
                emptyMessage="Tidak ada kecamatan yang ditemukan."
                open={districtOpen}
                onOpenChange={setDistrictOpen}
                disabled={!regencyId}
                icon={MapPinned}
              />
            </Field>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={!name.trim() || !regencyId || !districtId}
            >
              {isEdit ? "Simpan Perubahan" : "Tambah Lokasi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
