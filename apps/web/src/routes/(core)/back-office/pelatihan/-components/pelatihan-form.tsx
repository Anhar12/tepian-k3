import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { trpc, queryClient } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import pelatihanSchema from "@tepian-k3/schema/pelatihan/pelatihan.schema";
import type z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

type CreatePelatihanValues = z.infer<
  typeof pelatihanSchema.createPelatihanSchema
>;
type UpdatePelatihanValues = z.infer<
  typeof pelatihanSchema.updatePelatihanSchema
>;

interface PelatihanFormProps {
  initialData?: UpdatePelatihanValues;
  isEdit?: boolean;
}

export function PelatihanForm({ initialData, isEdit }: PelatihanFormProps) {
  const router = useRouter();

  const { data: categories, isLoading: categoriesLoading } = useQuery(
    trpc.pelatihan.base.getAllCategories.queryOptions(),
  );

  const form = useForm<CreatePelatihanValues>({
    resolver: zodResolver(pelatihanSchema.createPelatihanSchema) as any,
    defaultValues: initialData
      ? {
          title: initialData.title || "",
          slug: initialData.slug || "",
          description: initialData.description || "",
          shortDescription: initialData.shortDescription || "",
          level: initialData.level || "beginner",
          type: (initialData as any).type || "elearning",
          duration: initialData.duration || 0,
          capacity: initialData.capacity || 0,
          price: initialData.price || 0,
          discountPrice: initialData.discountPrice || 0,
          minimumScore: initialData.minimumScore || 70,
          status: initialData.status || "draft",
          thumbnailUrl: initialData.thumbnailUrl || "",
          instructorName: initialData.instructorName || "",
          instructorBio: initialData.instructorBio || "",
          categoryId: initialData.categoryId || null,
          startDate: initialData.startDate || null,
          endDate: initialData.endDate || null,
          location: initialData.location || "",
          facilities: initialData.facilities || [],
          requirements: initialData.requirements || "",
          dynamicRequirements: (initialData as any).dynamicRequirements || {},
          attendanceRequired:
            (initialData as any).attendanceRequired !== undefined
              ? !!(initialData as any).attendanceRequired
              : true,
          minAttendancePercentage:
            (initialData as any).minAttendancePercentage !== undefined
              ? Number((initialData as any).minAttendancePercentage)
              : 85,
        }
      : {
          title: "",
          slug: "",
          description: "",
          shortDescription: "",
          level: "beginner",
          type: "elearning",
          duration: 0,
          capacity: 0,
          price: 0,
          discountPrice: 0,
          minimumScore: 70,
          status: "draft",
          thumbnailUrl: "",
          instructorName: "",
          instructorBio: "",
          categoryId: null,
          startDate: null,
          endDate: null,
          location: "",
          facilities: [],
          requirements: "",
          dynamicRequirements: {},
          attendanceRequired: true,
          minAttendancePercentage: 85,
        },
  });

  const createMutation = useMutation(
    trpc.pelatihan.base.createPelatihan.mutationOptions({
      onSuccess: () => {
        globalSuccessToast("Pelatihan berhasil ditambahkan");
        queryClient.invalidateQueries(
          trpc.pelatihan.base.getAllPelatihan.queryOptions({}),
        );
        router.history.back();
      },
      onError: (error) => {
        globalErrorToast(`Gagal: ${error.message}`);
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.pelatihan.base.updatePelatihan.mutationOptions({
      onSuccess: () => {
        globalSuccessToast("Pelatihan berhasil diperbarui");
        queryClient.invalidateQueries(
          trpc.pelatihan.base.getAllPelatihan.queryOptions({}),
        );
        router.history.back();
      },
      onError: (error) => {
        globalErrorToast(`Gagal: ${error.message}`);
      },
    }),
  );

  function onSubmit(data: CreatePelatihanValues) {
    if (isEdit && initialData?.id) {
      updateMutation.mutate({ ...data, id: initialData.id });
    } else {
      createMutation.mutate(data);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Pelatihan</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan judul pelatihan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="url-pelatihan-slug" {...field} />
                  </FormControl>
                  <FormDescription>
                    URL-friendly string, unik. Format: huruf kecil & strip.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi Singkat</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ringkasan pelatihan..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi Lengkap</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detail pelatihan..."
                      className="min-h-[120px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">
                          Intermediate
                        </SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Layanan</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis layanan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="elearning">E-Learning</SelectItem>
                      <SelectItem value="bimtek">Bimtek</SelectItem>
                      <SelectItem value="webinar">Webinar</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            categoriesLoading ? "Memuat..." : "Pilih Kategori"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga (Rp)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga Diskon (Opsional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durasi (Hari)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kapasitas Peserta</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="minimumScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nilai Kelulusan Minimum</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instructorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Instruktur</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nama Instruktur..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Thumbnail</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Mulai</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={field.value ? field.value.slice(0, 16) : ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? new Date(e.target.value).toISOString()
                              : null,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Selesai</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={field.value ? field.value.slice(0, 16) : ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? new Date(e.target.value).toISOString()
                              : null,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lokasi Pelaksanaan</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Lokasi / Platform..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="facilities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fasilitas (Dipisahkan koma)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Modul, Makan Siang, Sertifikat"
                      value={field.value ? field.value.join(", ") : ""}
                      onChange={(e) => {
                        const arr = e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        field.onChange(arr);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Persyaratan Pendaftaran (Deskripsi Teks)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tuliskan persyaratan pendaftaran secara umum..."
                      className="min-h-[120px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Konfigurasi Absensi */}
            <div className="space-y-4 rounded-xl border bg-slate-50/50 p-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Konfigurasi Absensi & Kehadiran
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Atur apakah absensi kehadiran wajib dipenuhi untuk pelatihan
                  ini dan persentase minimumnya.
                </p>
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="attendanceRequired"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border bg-background p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer font-semibold select-none">
                          Absensi Kehadiran Wajib
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Centang jika peserta wajib melakukan presensi
                          kehadiran pada jadwal yang ditentukan.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("attendanceRequired") && (
                  <FormField
                    control={form.control}
                    name="minAttendancePercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Persentase Kehadiran Minimum (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Contoh: 85"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Persentase kehadiran minimum untuk kelayakan
                          penerbitan sertifikat.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Dynamic Requirements Section */}
            <div className="space-y-4 rounded-xl border bg-slate-50/50 p-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Persyaratan Pendaftaran Dinamis
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Centang data dan berkas yang wajib dilengkapi oleh peserta
                  saat mendaftar kelas ini.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-medium tracking-wider text-slate-700 uppercase">
                  Data Diri Peserta
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "participantNik", label: "NIK (16 Digit)" },
                    { id: "participantBirthPlace", label: "Tempat Lahir" },
                    { id: "participantBirthDate", label: "Tanggal Lahir" },
                    { id: "participantPhone", label: "Nomor WhatsApp/HP" },
                    { id: "participantAddress", label: "Alamat Lengkap" },
                    { id: "participantBloodType", label: "Golongan Darah" },
                  ].map((field) => (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`dynamicRequirements.${field.id}` as any}
                      render={({ field: f }) => (
                        <FormItem className="flex flex-row items-center space-y-0 space-x-2 rounded-md border bg-background p-3">
                          <FormControl>
                            <Checkbox
                              checked={!!f.value}
                              onCheckedChange={f.onChange}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer text-xs leading-none font-normal select-none">
                            {field.label}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-medium tracking-wider text-slate-700 uppercase">
                  Data Perusahaan (Sponsor)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "companyName", label: "Nama Perusahaan" },
                    { id: "companyAddress", label: "Alamat Perusahaan" },
                    { id: "companyProvinceId", label: "Provinsi Perusahaan" },
                    {
                      id: "companyRegencyId",
                      label: "Kota/Kabupaten Perusahaan",
                    },
                    { id: "companyDistrictId", label: "Kecamatan Perusahaan" },
                    { id: "companyKbli", label: "KBLI Bidang Usaha" },
                  ].map((field) => (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`dynamicRequirements.${field.id}` as any}
                      render={({ field: f }) => (
                        <FormItem className="flex flex-row items-center space-y-0 space-x-2 rounded-md border bg-background p-3">
                          <FormControl>
                            <Checkbox
                              checked={!!f.value}
                              onCheckedChange={f.onChange}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer text-xs leading-none font-normal select-none">
                            {field.label}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-medium tracking-wider text-slate-700 uppercase">
                  Dokumen Yang Wajib Diupload
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "ktpDoc", label: "Scan KTP (Kartu Identitas)" },
                    { id: "employmentLetter", label: "Surat Keterangan Kerja" },
                    {
                      id: "consentLetter",
                      label: "Surat Pernyataan Kesediaan",
                    },
                    { id: "diploma", label: "Ijazah Terakhir" },
                  ].map((field) => (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`dynamicRequirements.${field.id}` as any}
                      render={({ field: f }) => (
                        <FormItem className="flex flex-row items-center space-y-0 space-x-2 rounded-md border bg-background p-3">
                          <FormControl>
                            <Checkbox
                              checked={!!f.value}
                              onCheckedChange={f.onChange}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer text-xs leading-none font-normal select-none">
                            {field.label}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 border-t border-neutral-100 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.history.back()}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Menyimpan..."
              : "Simpan Pelatihan"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
