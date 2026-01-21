import { WorksheetHeaderCard } from "@/components/worksheet-header-card";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Check,
  Users,
  MapPin,
  Calendar,
  Printer,
  Save,
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePagination } from "@/lib/pagination";
import { WorksheetDataTable } from "@/components/ui/worksheet-data-table";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { differenceInDays, format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPublicUrl } from "@/utils/url";
import { ScrollArea } from "@/components/ui/scroll-area";
import { requirePermission } from "@/utils/require-permission";

const searchParamsSchema = z.object({
  worksheetId: z.uuidv7().optional(),
});

export const Route = createFileRoute("/(core)/worksheets/detail-transaksi")({
  validateSearch: searchParamsSchema,
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "worksheets.read" }),
  component: RouteComponent,
});

interface OperationalCostItem {
  id?: string;
  item: string;
  unitCount: number;
  days: number;
  unitCost: number | null;
  note: string | null;
  sortOrder: number;
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return `${value.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace("IDR", "Rp")},-`;
}

function calculateDuration(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): number {
  if (!startDate || !endDate) return 0;
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return Math.abs(differenceInDays(end, start)) + 1;
}

function formatDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): string {
  if (!startDate || !endDate) return "-";
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const dateFormat = "dd MMMM yyyy";
  return `${format(start, dateFormat, { locale: id })} - ${format(end, dateFormat, { locale: id })}`;
}

function RouteComponent() {
  const navigate = useNavigate();
  const { worksheetId } = Route.useSearch();

  const [paramPage, setParamPage] = useState(1);
  const [paramPageSize, setParamPageSize] = useState(10);
  const [operationalCosts, setOperationalCosts] = useState<
    OperationalCostItem[]
  >([]);
  const [isDirty, setIsDirty] = useState(false);

  const {
    data: worksheet,
    isLoading,
    error,
    refetch,
  } = useQuery(
    trpc.worksheet.getTransactionDetail.queryOptions(
      { worksheetId: worksheetId! },
      { enabled: !!worksheetId },
    ),
  );

  const saveOperationalCostsMutation = useMutation(
    trpc.worksheet.saveOperationalCosts.mutationOptions({
      onSuccess: () => {
        toast.success("Biaya operasional berhasil disimpan");
        setIsDirty(false);
        refetch();
      },
      onError: (error: { message?: string }) => {
        toast.error(error.message || "Gagal menyimpan biaya operasional");
      },
    }),
  );

  useEffect(() => {
    if (worksheet?.operationalCosts) {
      setOperationalCosts(
        worksheet.operationalCosts.map((cost) => ({
          id: cost.id,
          item: cost.item,
          unitCount: cost.unitCount,
          days: cost.days,
          unitCost: cost.unitCost,
          note: cost.note,
          sortOrder: cost.sortOrder,
        })),
      );
    } else if (worksheet && worksheet.operationalCosts?.length === 0) {
      const defaultCosts: OperationalCostItem[] = [
        {
          item: "Uang Harian",
          unitCount: 1,
          days: 1,
          unitCost: 0,
          note: null,
          sortOrder: 0,
        },
      ];

      if (worksheet.coverTransportationIncluded === false) {
        defaultCosts.push({
          item: "Transportasi",
          unitCount: 1,
          days: 1,
          unitCost: null,
          note: "Disediakan Perusahaan",
          sortOrder: 1,
        });
      } else {
        defaultCosts.push({
          item: "Transportasi",
          unitCount: 1,
          days: 1,
          unitCost: 0,
          note: null,
          sortOrder: 1,
        });
      }

      if (worksheet.coverAccommodationIncluded === false) {
        defaultCosts.push({
          item: "Penginapan",
          unitCount: 1,
          days: 1,
          unitCost: null,
          note: "Disediakan Perusahaan",
          sortOrder: 2,
        });
      } else {
        defaultCosts.push({
          item: "Penginapan",
          unitCount: 1,
          days: 1,
          unitCost: 0,
          note: null,
          sortOrder: 2,
        });
      }

      setOperationalCosts(defaultCosts);
    }
  }, [worksheet]);

  const readyItems = useMemo(() => {
    if (!worksheet?.items) return [];
    return worksheet.items.filter((item) => item.isReady);
  }, [worksheet?.items]);

  // Check if worksheet is editable (only draft or revision status)
  const isEditable = useMemo(() => {
    if (!worksheet?.status) return false;
    return ["draft", "revision"].includes(worksheet.status);
  }, [worksheet?.status]);

  // Check if operational costs should be shown
  // Only show if at least one of transportation or accommodation is covered by K3 Lab (value = true)
  const showOperationalCosts = useMemo(() => {
    if (!worksheet) return false;
    return (
      worksheet.coverTransportationIncluded === true ||
      worksheet.coverAccommodationIncluded === true
    );
  }, [worksheet]);

  const locations: {
    regencyName: string;
    districtName: string;
  }[] = useMemo(() => {
    if (!worksheet?.items) return [];
    const uniqueLocations: { regencyName: string; districtName: string }[] = [];
    worksheet.items.forEach((item) => {
      if (
        !uniqueLocations.find(
          (loc) => loc.districtName === item.location.district.name,
        )
      ) {
        uniqueLocations.push({
          regencyName: item.location.regency.name,
          districtName: item.location.district.name,
        });
      }
    });
    return uniqueLocations;
  }, [worksheet?.items]);

  const assignedPersonnel: {
    name: string;
    position: string;
    avatar: string | null;
  }[] = useMemo(() => {
    if (!worksheet?.assignments) return [];
    const uniquePersonnel: {
      name: string;
      position: string;
      avatar: string | null;
    }[] = [];
    worksheet.assignments.forEach((assignment) => {
      if (
        !uniquePersonnel.find(
          (person) => person.name === assignment.employee.user.name,
        )
      ) {
        uniquePersonnel.push({
          name: assignment.employee.user.name,
          position: assignment.employee.position.name,
          avatar: assignment.employee.user.profilePictureUrl,
        });
      }
    });
    return uniquePersonnel;
  }, [worksheet?.assignments]);

  const parameterData = useMemo(() => {
    return readyItems.map((item) => ({
      id: item.id,
      cluster: item.parameter?.category?.cluster?.name || "-",
      jenisPengujian: item.parameter?.category?.name || "-",
      parameter: item.parameter?.name || "-",
      acuan: item.parameter?.reference || "-",
      jumlah: item.quantity,
      status: item.isReady ? "siap" : "tidak siap",
      biaya: item.parameter?.price || 0,
    }));
  }, [readyItems]);

  const paramPagination = usePagination(
    parameterData,
    paramPageSize,
    paramPage,
  );

  const parameterTotal = useMemo(() => {
    return parameterData.reduce(
      (sum, item) => sum + item.jumlah * item.biaya,
      0,
    );
  }, [parameterData]);

  const operationalTotal = useMemo(() => {
    return operationalCosts.reduce((sum, item) => {
      if (item.unitCost !== null && item.unitCost > 0) {
        return sum + item.unitCount * item.days * item.unitCost;
      }
      return sum;
    }, 0);
  }, [operationalCosts]);

  const grandTotal =
    parameterTotal + (showOperationalCosts ? operationalTotal : 0);

  const handleAddOperationalCost = useCallback(() => {
    setOperationalCosts((prev) => [
      ...prev,
      {
        item: "",
        unitCount: 1,
        days: 1,
        unitCost: 0,
        note: null,
        sortOrder: prev.length,
      },
    ]);
    setIsDirty(true);
  }, []);

  const handleRemoveOperationalCost = useCallback((index: number) => {
    setOperationalCosts((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  }, []);

  const handleUpdateOperationalCost = useCallback(
    (index: number, field: keyof OperationalCostItem, value: unknown) => {
      setOperationalCosts((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, [field]: value } : item,
        ),
      );
      setIsDirty(true);
    },
    [],
  );

  const handleSave = useCallback(() => {
    if (!worksheetId) return;

    const validCosts = operationalCosts.filter(
      (cost) => cost.item.trim() !== "",
    );

    saveOperationalCostsMutation.mutate({
      worksheetId,
      costs: validCosts.map((cost, index) => ({
        ...cost,
        sortOrder: index,
      })),
    });
  }, [worksheetId, operationalCosts, saveOperationalCostsMutation]);

  if (!worksheetId) {
    return (
      <div className="space-y-4">
        <WorksheetHeaderCard
          title="Detail Transaksi"
          subtitle="Rincian biaya parameter dan operasional pengujian"
          actionButton={[
            {
              label: "Simpan",
              icon: <Save />,
              variant: "default",
              size: "default",
              onClick: () => {},
            },
            {
              label: "Cetak",
              icon: <Printer />,
              variant: "outline",
              size: "default",
              onClick: () => {},
            },
          ]}
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              Worksheet ID tidak ditemukan. Silakan pilih worksheet dari daftar.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() =>
                navigate({
                  to: "/back-office/worksheets",
                  search: { page: 1, perPage: 10 },
                })
              }
            >
              Kembali ke Daftar Worksheet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <WorksheetHeaderCard
          title="Detail Transaksi"
          subtitle="Rincian biaya parameter dan operasional pengujian"
          actionButton={[
            {
              label: "Simpan",
              icon: <Save />,
              variant: "default",
              size: "default",
              onClick: () => {},
            },
            {
              label: "Cetak",
              icon: <Printer />,
              variant: "outline",
              size: "default",
              onClick: () => {},
            },
          ]}
        />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !worksheet) {
    return (
      <div className="space-y-4">
        <WorksheetHeaderCard
          title="Detail Transaksi"
          subtitle="Rincian biaya parameter dan operasional pengujian"
          actionButton={[
            {
              label: "Simpan",
              icon: <Save />,
              variant: "default",
              size: "default",
              onClick: () => {},
            },
            {
              label: "Cetak",
              icon: <Printer />,
              variant: "outline",
              size: "default",
              onClick: () => {},
            },
          ]}
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive">
              {error?.message || "Gagal memuat data worksheet"}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => refetch()}
            >
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const duration = calculateDuration(worksheet.startDate, worksheet.endDate);
  const dateRange = formatDateRange(worksheet.startDate, worksheet.endDate);

  return (
    <div className="space-y-4">
      <WorksheetHeaderCard
        title="Detail Transaksi"
        subtitle="Rincian biaya parameter dan operasional pengujian"
        actionButton={[
          {
            label: "Simpan",
            icon: <Save />,
            variant: "default",
            size: "default",
            onClick: () => {},
          },
          {
            label: "Cetak",
            icon: <Printer />,
            variant: "outline",
            size: "default",
            onClick: () => {},
          },
        ]}
      />

      <Card>
        <CardHeader className="px-3 pb-3 sm:px-6 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MapPin className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            Rincian Permintaan Pengujian
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
            <div className="flex flex-col overflow-hidden rounded-xl border border-muted/50">
              <div className="border-b bg-primary/40 p-4 sm:px-6">
                <h2 className="text-base font-semibold text-primary sm:text-lg">
                  List Personel
                </h2>
              </div>
              <ScrollArea className="h-50 sm:h-60">
                <div className="flex flex-col space-y-3 p-4 sm:p-6">
                  {assignedPersonnel.length > 0 ? (
                    assignedPersonnel.map((person, idx) => (
                      <div className="flex flex-row gap-3" key={idx}>
                        <Avatar className="size-10 shrink-0 sm:size-8">
                          <AvatarImage
                            src={
                              person.avatar
                                ? getPublicUrl(person.avatar)
                                : undefined
                            }
                            alt={person.name}
                          />
                          <AvatarFallback className="bg-primary/40 text-sm font-semibold text-primary">
                            {person.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-col gap-1">
                          <p className="truncate text-sm font-medium sm:text-base">
                            {person.name}
                          </p>
                          <p className="text-xs text-muted-foreground sm:text-sm">
                            {person.position}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Belum ada personel
                    </span>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="space-y-2 rounded-xl border border-muted/50">
              <div className="flex flex-1 flex-col justify-center rounded-t-xl border-b bg-primary/40 p-3 sm:px-6 sm:pb-4">
                <h2 className="text-xl font-semibold text-primary sm:text-base">
                  Area Pengujian
                </h2>
              </div>
              <ScrollArea className="h-50 sm:h-60">
                <div className="flex flex-col space-y-1 p-3 sm:px-3 sm:pt-4">
                  {locations.length > 0 ? (
                    locations.map((loc, idx) => (
                      <div className="flex flex-row gap-4" key={idx}>
                        <p className="flex size-8 items-center justify-center rounded-full bg-primary/40 font-semibold text-primary sm:h-6 sm:w-6 sm:text-sm">
                          {idx + 1}
                        </p>
                        <p className="text-base font-medium text-ellipsis sm:text-sm">
                          {loc.regencyName}, {loc.districtName}
                        </p>
                      </div>
                    ))
                  ) : (
                    <span className="text-muted-foreground">
                      Belum ada lokasi
                    </span>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="flex flex-col overflow-hidden rounded-xl border border-muted/50">
              <div className="border-b bg-primary/40 p-4 sm:px-6">
                <h2 className="text-base font-semibold text-primary sm:text-lg">
                  Durasi Pengujian
                </h2>
              </div>
              <div className="flex flex-1 flex-col justify-between p-4 sm:p-6">
                <p className="text-3xl font-bold sm:text-4xl">
                  {duration > 0 ? `${duration} Hari` : "-"}
                </p>
                <div className="mt-6 flex flex-col gap-1.5 pt-4">
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Tanggal
                  </p>
                  <p className="text-sm font-medium wrap-break-word text-primary">
                    {dateRange}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-muted/50">
              <div className="flex flex-1 flex-col justify-center rounded-t-xl border-b bg-primary/40 p-3 sm:px-6 sm:pb-4">
                <h2 className="text-xl font-semibold text-primary sm:text-base">
                  Total Personel
                </h2>
              </div>
              <div className="flex flex-col space-y-1 p-3 sm:px-3 sm:pt-4">
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold sm:text-4xl">
                    {assignedPersonnel.length} Orang
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-3 pb-3 sm:px-6 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            Rincian Parameter (Siap)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold sm:text-sm">
                    Cluster
                  </TableHead>
                  <TableHead className="hidden text-xs font-semibold sm:text-sm md:table-cell">
                    Jenis Pengujian
                  </TableHead>
                  <TableHead className="text-xs font-semibold sm:text-sm">
                    Parameter
                  </TableHead>
                  <TableHead className="hidden text-xs font-semibold sm:text-sm lg:table-cell">
                    Acuan
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold sm:text-sm">
                    Jumlah
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold sm:text-sm">
                    Status
                  </TableHead>
                  <TableHead className="hidden text-right text-xs font-semibold sm:table-cell sm:text-sm">
                    Biaya
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold sm:text-sm">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paramPagination.paginatedData.length > 0 ? (
                  paramPagination.paginatedData.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-medium sm:text-sm">
                        {item.cluster}
                      </TableCell>
                      <TableCell className="hidden text-xs sm:text-sm md:table-cell">
                        {item.jenisPengujian}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {item.parameter}
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                        {item.acuan}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="bg-background text-xs"
                        >
                          {item.jumlah}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-emerald-100 text-xs text-emerald-700 hover:bg-emerald-100">
                          Siap
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-right text-xs sm:table-cell sm:text-sm">
                        {formatCurrency(item.biaya)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium sm:text-sm">
                        {formatCurrency(item.jumlah * item.biaya)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Belum ada parameter yang siap
                    </TableCell>
                  </TableRow>
                )}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell
                    colSpan={7}
                    className="text-right text-xs sm:text-sm"
                  >
                    TOTAL
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      value={formatCurrency(parameterTotal)}
                      readOnly
                      className="ml-auto w-24 text-right text-xs font-bold sm:w-32 sm:text-sm"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          {parameterData.length > 0 && (
            <WorksheetDataTable
              currentPage={paramPagination.currentPage}
              totalPages={paramPagination.totalPages}
              pageSize={paramPageSize}
              totalItems={paramPagination.totalItems}
              onPageChange={setParamPage}
              onPageSizeChange={(size) => {
                setParamPageSize(size);
                setParamPage(1);
              }}
            />
          )}
        </CardContent>
      </Card>

      {showOperationalCosts && (
        <Card>
          <CardHeader className="px-3 pb-3 sm:px-6 sm:pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                Rincian Operasional
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddOperationalCost}
                disabled={!isEditable}
              >
                <Plus className="mr-1 h-4 w-4" />
                Tambah Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-semibold sm:text-sm">
                      Item
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold sm:text-sm">
                      Orang/Unit
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold sm:text-sm">
                      Hari
                    </TableHead>
                    <TableHead className="hidden text-center text-xs font-semibold sm:text-sm md:table-cell">
                      Keterangan
                    </TableHead>
                    <TableHead className="hidden text-right text-xs font-semibold sm:table-cell sm:text-sm">
                      Biaya/Unit
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold sm:text-sm">
                      Total
                    </TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operationalCosts.map((item, index) => {
                    const itemTotal =
                      item.unitCost !== null && item.unitCost > 0
                        ? item.unitCount * item.days * item.unitCost
                        : null;

                    return (
                      <TableRow key={index} className="hover:bg-muted/30">
                        <TableCell className="text-xs sm:text-sm">
                          <Input
                            value={item.item}
                            onChange={(e) =>
                              handleUpdateOperationalCost(
                                index,
                                "item",
                                e.target.value,
                              )
                            }
                            placeholder="Nama item"
                            className="h-8 w-full min-w-30 text-xs sm:text-sm"
                            disabled={!isEditable}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min={0}
                            value={item.unitCount}
                            onChange={(e) =>
                              handleUpdateOperationalCost(
                                index,
                                "unitCount",
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="h-8 w-16 text-center text-xs sm:text-sm"
                            disabled={!isEditable}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min={0}
                            value={item.days}
                            onChange={(e) =>
                              handleUpdateOperationalCost(
                                index,
                                "days",
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="h-8 w-16 text-center text-xs sm:text-sm"
                            disabled={!isEditable}
                          />
                        </TableCell>
                        <TableCell className="hidden text-center text-xs sm:text-sm md:table-cell">
                          <Input
                            value={item.note || ""}
                            onChange={(e) =>
                              handleUpdateOperationalCost(
                                index,
                                "note",
                                e.target.value || null,
                              )
                            }
                            placeholder="-"
                            className="h-8 w-full min-w-25 text-center text-xs sm:text-sm"
                            disabled={!isEditable}
                          />
                        </TableCell>
                        <TableCell className="hidden text-right text-xs sm:table-cell sm:text-sm">
                          <Input
                            type="number"
                            min={0}
                            value={item.unitCost ?? ""}
                            onChange={(e) =>
                              handleUpdateOperationalCost(
                                index,
                                "unitCost",
                                e.target.value === ""
                                  ? null
                                  : parseInt(e.target.value) || 0,
                              )
                            }
                            placeholder="-"
                            className="h-8 w-24 text-right text-xs sm:text-sm"
                            disabled={!isEditable}
                          />
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium sm:text-sm">
                          {itemTotal !== null ? formatCurrency(itemTotal) : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleRemoveOperationalCost(index)}
                            disabled={!isEditable}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {operationalCosts.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-8 text-center text-muted-foreground"
                      >
                        Belum ada biaya operasional. Klik &quot;Tambah
                        Item&quot; untuk menambahkan.
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell
                      colSpan={5}
                      className="text-right text-xs sm:text-sm"
                    >
                      TOTAL
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        value={formatCurrency(operationalTotal)}
                        readOnly
                        className="ml-auto w-24 text-right text-xs font-bold sm:w-32 sm:text-sm"
                      />
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
        <div className="flex items-center justify-center gap-2 sm:justify-start">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 bg-transparent"
          >
            <Printer className="h-4 w-4" />
          </Button>
          {showOperationalCosts && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 bg-transparent"
                onClick={handleSave}
                disabled={
                  !isEditable ||
                  !isDirty ||
                  saveOperationalCostsMutation.isPending
                }
              >
                {saveOperationalCostsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
              <Button
                className="flex-1 gap-2 sm:flex-initial"
                onClick={handleSave}
                disabled={
                  !isEditable ||
                  !isDirty ||
                  saveOperationalCostsMutation.isPending
                }
              >
                {saveOperationalCostsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                SIMPAN
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t pt-3 sm:justify-end sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
          <span className="text-sm font-semibold text-muted-foreground sm:text-base">
            GRAND TOTAL
          </span>
          <div className="rounded-lg bg-primary/10 px-3 py-2 sm:px-4">
            <span className="text-lg font-bold text-primary sm:text-xl">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
