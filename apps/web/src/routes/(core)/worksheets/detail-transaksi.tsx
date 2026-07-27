import { PermissionGate } from "@/components/permission-gate";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WorksheetDataTable } from "@/components/ui/worksheet-data-table";
import {
  WorksheetHeaderCard,
  WorksheetHeaderCardSkeleton,
} from "@/components/worksheet-header-card";
import useDialogs from "@/hooks/use-dialog";
import { usePagination } from "@/lib/pagination";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { usePermissions } from "@/hooks/use-permissions";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { getPublicUrl } from "@/utils/url";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ORDER_STATUS,
  type OrderStatus,
  WORKSHEET_DAILY_ALLOWANCE_ITEM,
  WORKSHEET_FIELD_OPERATIONAL_ITEM,
  OPERATIONAL_COST_VERIFICATION_STATUS_LABELS,
  OPERATIONAL_COST_VERIFICATION_STATUS_COLORS,
  OPERATIONAL_COST_VERIFICATION_STATUS,
} from "@tepian-k3/constants";
import {
  addBusinessDays,
  differenceInBusinessDays,
  format,
  isWeekend,
  nextMonday,
  parseISO,
} from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Calendar,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Printer,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import EditEstimateDialog from "./-components/edit-estimate-dialog";

const searchParamsSchema = z.object({
  worksheetId: z.uuidv7().optional(),
});

export const Route = createFileRoute("/(core)/worksheets/detail-transaksi")({
  validateSearch: searchParamsSchema,
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "worksheets.read" }),
  component: RouteComponent,
  head: () => pageHead("Lembar Kerja - Detail Transaksi"),
});

interface OperationalCostItem {
  id?: string;
  item: string;
  unitCount: number;
  days: number;
  unitCost: number | null;
  note: string | null;
  sortOrder: number;
  sbmYear?: number | null;
  verificationStatus?: "draft" | "submitted" | "verified" | "revised";
  verificationNote?: string | null;
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
  return Math.abs(differenceInBusinessDays(end, start)) + 1;
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

function InfoCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  /** Optional control rendered on the right of the header (e.g. an edit button). */
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-muted/50">
      <div className="flex items-center justify-between gap-2 border-b bg-primary/40 p-4 sm:px-6">
        <h2 className="text-base font-semibold text-primary sm:text-lg">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function RouteComponent() {
  const navigate = useNavigate();
  const { worksheetId } = Route.useSearch();

  const dialogs = useDialogs({
    editEstimate: null,
  });

  const [paramPage, setParamPage] = useState(1);
  const [paramPageSize, setParamPageSize] = useState(10);
  const [notReadyParamPage, setNotReadyParamPage] = useState(1);
  const [notReadyParamPageSize, setNotReadyParamPageSize] = useState(10);
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
    trpc.pengujian.worksheet.getTransactionDetail.queryOptions(
      { worksheetId: worksheetId! },
      { enabled: !!worksheetId },
    ),
  );

  const saveOperationalCostsMutation = useMutation(
    trpc.pengujian.worksheet.saveOperationalCosts.mutationOptions({
      onSuccess: () => {
        globalSuccessToast("Biaya operasional berhasil disimpan");
        setIsDirty(false);
        refetch();
      },
      onError: (error: { message?: string }) => {
        globalErrorToast(
          `Gagal menyimpan biaya operasional: ${error.message ?? "Silahkan coba lagi."}`,
        );
      },
    }),
  );

  const publishOfferingMutation = useMutation(
    trpc.pengujian.worksheet.publishOffering.mutationOptions({
      onSuccess: () => {
        globalSuccessToast(
          "Penawaran berhasil diterbitkan. Admin dapat mencetak dokumen penawaran.",
        );
        refetch();
      },
      onError: (error: { message?: string }) => {
        globalErrorToast(
          `Gagal menerbitkan penawaran: ${error.message ?? "Silahkan coba lagi."}`,
        );
      },
    }),
  );

  const verifyOperationalCostsMutation = useMutation(
    trpc.pengujian.worksheet.verifyOperationalCosts.mutationOptions({
      onSuccess: () => {
        globalSuccessToast("Status verifikasi berhasil diperbarui.");
        refetch();
      },
      onError: (error: { message?: string }) => {
        globalErrorToast(
          `Gagal memperbarui verifikasi: ${error.message ?? "Silahkan coba lagi."}`,
        );
      },
    }),
  );

  // Reset state when switching worksheets so stale data doesn't linger during loading
  useEffect(() => {
    setOperationalCosts([]);
    setIsDirty(false);
  }, [worksheetId]);

  useEffect(() => {
    // Don't overwrite unsaved edits from background refetches
    if (isDirty) return;

    if (worksheet && worksheet.operationalCosts.length > 0) {
      setOperationalCosts(
        worksheet.operationalCosts.map((cost) => ({
          id: cost.id,
          item: cost.item,
          unitCount: cost.unitCount,
          days: cost.days,
          unitCost: cost.unitCost,
          note: cost.note,
          sortOrder: cost.sortOrder,
          sbmYear: cost.sbmYear,
          verificationStatus: cost.verificationStatus,
          verificationNote: cost.verificationNote,
        })),
      );
    } else if (worksheet && worksheet.operationalCosts?.length === 0) {
      const defaultCosts: OperationalCostItem[] = [
        {
          item: WORKSHEET_DAILY_ALLOWANCE_ITEM,
          unitCount:
            worksheet.estimatedAmountOfMembers > 0
              ? worksheet.estimatedAmountOfMembers
              : 1,
          days:
            worksheet.estimatedAmountOfDays > 0
              ? worksheet.estimatedAmountOfDays
              : 1,
          unitCost: 0,
          note: null,
          sortOrder: 0,
          verificationStatus: "draft",
        },
      ];

      if (worksheet.coverFlightIncluded) {
        defaultCosts.push({
          item: "Transportasi Udara (PP)",
          unitCount:
            worksheet.estimatedAmountOfMembers > 0
              ? worksheet.estimatedAmountOfMembers
              : 1,
          days:
            worksheet.estimatedAmountOfDays > 0
              ? worksheet.estimatedAmountOfDays
              : 1,
          unitCost: 0,
          note: null,
          sortOrder: defaultCosts.length,
          verificationStatus: "draft",
        });
      }

      if (worksheet.coverBaggageIncluded) {
        defaultCosts.push({
          item: "Bagasi Pesawat (PP)",
          unitCount:
            worksheet.estimatedAmountOfMembers > 0
              ? worksheet.estimatedAmountOfMembers
              : 1,
          days: 1, // Usually baggage is per trip/person, not per day
          unitCost: 0,
          note: null,
          sortOrder: defaultCosts.length,
          verificationStatus: "draft",
        });
      }

      if (worksheet.coverWaterTransportationIncluded) {
        defaultCosts.push({
          item: "Transportasi Laut/Sungai (PP)",
          unitCount:
            worksheet.estimatedAmountOfMembers > 0
              ? worksheet.estimatedAmountOfMembers
              : 1,
          days:
            worksheet.estimatedAmountOfDays > 0
              ? worksheet.estimatedAmountOfDays
              : 1,
          unitCost: 0,
          note: null,
          sortOrder: defaultCosts.length,
          verificationStatus: "draft",
        });
      }

      if (worksheet.coverGroundTransportationToAirportOrHarbour) {
        defaultCosts.push({
          item: "Transportasi Darat ke Bandara/Pelabuhan (PP)",
          unitCount:
            worksheet.estimatedAmountOfMembers > 0
              ? worksheet.estimatedAmountOfMembers
              : 1,
          days:
            worksheet.estimatedAmountOfDays > 0
              ? worksheet.estimatedAmountOfDays
              : 1,
          unitCost: 0,
          note: null,
          sortOrder: defaultCosts.length,
          verificationStatus: "draft",
        });
      }

      if (worksheet.coverGroundTransportationIncluded) {
        defaultCosts.push({
          item: "Transportasi Darat (PP)",
          unitCount:
            worksheet.estimatedAmountOfMembers > 0
              ? worksheet.estimatedAmountOfMembers
              : 1,
          days:
            worksheet.estimatedAmountOfDays > 0
              ? worksheet.estimatedAmountOfDays
              : 1,
          unitCost: 0,
          note: null,
          sortOrder: defaultCosts.length,
          verificationStatus: "draft",
        });
      }

      if (worksheet.coverLodgingIncluded) {
        defaultCosts.push({
          item: "Penginapan",
          unitCount:
            worksheet.estimatedAmountOfMembers > 0
              ? worksheet.estimatedAmountOfMembers
              : 1,
          days:
            worksheet.estimatedAmountOfDays > 0
              ? worksheet.estimatedAmountOfDays
              : 1,
          unitCost: 0,
          note: null,
          sortOrder: defaultCosts.length,
          verificationStatus: "draft",
        });
      }


      // Field operational statement — always the last row. This is a fixed note
      // (no charge) indicating transport/field operations are covered by the
      // company, not a priced line item.
      defaultCosts.push({
        item: WORKSHEET_FIELD_OPERATIONAL_ITEM,
        unitCount:
          worksheet.estimatedAmountOfMembers > 0
            ? worksheet.estimatedAmountOfMembers
            : 1,
        days:
          worksheet.estimatedAmountOfDays > 0
            ? worksheet.estimatedAmountOfDays
            : 1,
        unitCost: 0,
        note: null,
        sortOrder: defaultCosts.length,
        verificationStatus: "draft",
      });

      setOperationalCosts(defaultCosts);
    }
  }, [worksheet, isDirty]);

  const readyItems = useMemo(() => {
    if (!worksheet?.items) return [];
    return worksheet.items.filter((item) => item.isReady);
  }, [worksheet?.items]);

  const notReadyItems = useMemo(() => {
    if (!worksheet?.items) return [];
    return worksheet.items.filter((item) => !item.isReady);
  }, [worksheet?.items]);

  const { hasPermission } = usePermissions();
  const isVerifier = hasPermission("worksheets.verify");

  // Check if worksheet is editable (only allow edits in "verified" status for now, since that's the only time operational costs are shown and editable in this view, but this can be expanded in the future if needed)
  const isEditable = useMemo(() => {
    if (!worksheet?.status) return false;
    return ["verified"].includes(worksheet.status);
  }, [worksheet?.status]);

  const showOperationalCosts = !!worksheet;

  // "Buat Penawaran" only becomes available once operational costs have been
  // saved (persisted rows, no pending edits) — the offering is generated from
  // the saved worksheet data, so it shouldn't be offered before that.
  const hasSavedOperationalCosts =
    (worksheet?.operationalCosts?.length ?? 0) > 0 && !isDirty;

  // The offering has been submitted once the linked order reaches
  // "penawaran_review" (awaiting Kepala Balai approval) or anything beyond it.
  // The branch/terminal states (revision, rejected, cancelled) sit later in the
  // enum but are NOT "submitted", so they are excluded explicitly.
  const isOfferingSubmitted = useMemo(() => {
    const orderStatus = worksheet?.order?.status as OrderStatus | undefined;
    if (!orderStatus) return false;
    if (
      orderStatus === "revision" ||
      orderStatus === "rejected" ||
      orderStatus === "cancelled"
    ) {
      return false;
    }
    return (
      ORDER_STATUS.indexOf(orderStatus) >=
      ORDER_STATUS.indexOf("penawaran_review")
    );
  }, [worksheet?.order?.status]);

  // Awaiting Kepala Balai approval — offering submitted but not yet issued.
  const isOfferingUnderReview = worksheet?.order?.status === "penawaran_review";

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

  const notReadyParameterData = useMemo(() => {
    return notReadyItems.map((item) => ({
      id: item.id,
      cluster: item.parameter?.category?.cluster?.name || "-",
      jenisPengujian: item.parameter?.category?.name || "-",
      parameter: item.parameter?.name || "-",
      acuan: item.parameter?.reference || "-",
      jumlah: item.quantity,
      status: "tidak siap" as const,
      biaya: item.parameter?.price || 0,
    }));
  }, [notReadyItems]);

  const notReadyParamPagination = usePagination(
    notReadyParameterData,
    notReadyParamPageSize,
    notReadyParamPage,
  );

  const notReadyParameterTotal = useMemo(() => {
    return notReadyParameterData.reduce(
      (sum, item) => sum + item.jumlah * item.biaya,
      0,
    );
  }, [notReadyParameterData]);

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

  const hasBaggageCost = useMemo(() => {
    return operationalCosts.some(
      (c) =>
        c.item === "Bagasi Pesawat (PP)" ||
        c.item === "Biaya Bagasi Pesawat",
    );
  }, [operationalCosts]);

  const handleAddBaggageCost = useCallback(() => {
    setOperationalCosts((prev) => [
      ...prev,
      {
        item: "Bagasi Pesawat (PP)",
        unitCount:
          worksheet && worksheet.estimatedAmountOfMembers > 0
            ? worksheet.estimatedAmountOfMembers
            : 1,
        days: 1,
        unitCost: 0,
        note: null,
        sortOrder: prev.length,
        sbmYear: null,
        verificationStatus: "draft",
        verificationNote: null,
      },
    ]);
    setIsDirty(true);
  }, [worksheet]);

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
        sbmYear: null,
        verificationStatus: "draft",
        verificationNote: null,
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

  const handleVerify = useCallback(
    (status: "submitted" | "verified" | "revised") => {
      if (!worksheetId) return;

      const itemsToVerify = operationalCosts
        .filter((c) => c.id) // Only saved items
        .filter((c) => {
          if (status === "submitted")
            return (
              c.verificationStatus === "draft" ||
              c.verificationStatus === "revised"
            );
          if (status === "verified" || status === "revised")
            return c.verificationStatus === "submitted";
          return false;
        });

      if (itemsToVerify.length === 0) {
        globalErrorToast(
          "Tidak ada item yang bisa diproses. Pastikan data sudah disimpan.",
        );
        return;
      }

      verifyOperationalCostsMutation.mutate({
        worksheetId,
        verifications: itemsToVerify.map((c) => ({
          id: c.id!,
          verificationStatus: status,
          verificationNote:
            status === "revised" ? c.verificationNote || "-" : null,
          sbmYear: c.sbmYear,
        })),
      });
    },
    [worksheetId, operationalCosts, verifyOperationalCostsMutation],
  );

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
        <WorksheetHeaderCardSkeleton />
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

  const hasStartDate = !!worksheet.startDate;
  const hasEstimate = worksheet.estimatedAmountOfDays > 0;

  const duration = hasStartDate
    ? calculateDuration(worksheet.startDate, worksheet.endDate)
    : worksheet.estimatedAmountOfDays;
  const dateRange = hasStartDate
    ? formatDateRange(worksheet.startDate, worksheet.endDate)
    : hasEstimate
      ? (() => {
          const today = new Date();
          const start = isWeekend(today) ? nextMonday(today) : today;
          const end = addBusinessDays(
            start,
            worksheet.estimatedAmountOfDays - 1,
          );
          return formatDateRange(start.toISOString(), end.toISOString());
        })()
      : "Estimasi belum di set";

  // Edit control for the Durasi Pengujian / Total Personel cards. Only shown
  // while the worksheet is editable (draft/revision) and to users who can update
  // transaction details (e.g. Koordinator Administrasi).
  const estimateEditAction = isEditable ? (
    <PermissionGate permission="worksheets-transaction-details.update">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 text-primary hover:bg-primary/20"
        onClick={() => dialogs.open("editEstimate")}
        aria-label="Edit durasi dan personel"
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </PermissionGate>
  ) : null;

  return (
    <div className="space-y-4">
      <WorksheetHeaderCard
        title="Detail Transaksi"
        subtitle="Rincian biaya parameter dan operasional pengujian"
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
            <InfoCard title="List Personel">
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
            </InfoCard>

            <InfoCard title="Area Pengujian">
              <ScrollArea className="h-50 sm:h-60">
                <div className="flex flex-col space-y-1 p-4 sm:p-6">
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
            </InfoCard>

            <InfoCard title="Durasi Pengujian" action={estimateEditAction}>
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
                  {worksheet.order?.estimatedSignatureDate && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>
                        Est. TTD:{" "}
                        <strong>
                          {format(parseISO(worksheet.order.estimatedSignatureDate), "dd MMM yyyy", { locale: id })}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </InfoCard>

            <InfoCard title="Total Personel" action={estimateEditAction}>
              <div className="flex flex-1 flex-col justify-between p-4 sm:p-6">
                <p className="text-3xl font-bold sm:text-4xl">
                  {assignedPersonnel.length > 0
                    ? `${assignedPersonnel.length} Orang`
                    : worksheet.estimatedAmountOfMembers > 0
                      ? `${worksheet.estimatedAmountOfMembers} Orang`
                      : "-"}
                </p>
              </div>
            </InfoCard>
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

      <Card>
        <CardHeader className="px-3 pb-3 sm:px-6 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <AlertCircle className="h-4 w-4 text-destructive sm:h-5 sm:w-5" />
            Rincian Parameter (Tidak Siap)
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
                {notReadyParamPagination.paginatedData.length > 0 ? (
                  notReadyParamPagination.paginatedData.map((item) => (
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
                        <Badge className="bg-red-100 text-xs text-red-700 hover:bg-red-100">
                          Tidak Siap
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
                      Semua parameter sudah siap
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
                      value={formatCurrency(notReadyParameterTotal)}
                      readOnly
                      className="ml-auto w-24 text-right text-xs font-bold sm:w-32 sm:text-sm"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          {notReadyParameterData.length > 0 && (
            <WorksheetDataTable
              currentPage={notReadyParamPagination.currentPage}
              totalPages={notReadyParamPagination.totalPages}
              pageSize={notReadyParamPageSize}
              totalItems={notReadyParamPagination.totalItems}
              onPageChange={setNotReadyParamPage}
              onPageSizeChange={(size) => {
                setNotReadyParamPageSize(size);
                setNotReadyParamPage(1);
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
              <div className="flex gap-2">
                {worksheet?.coverFlightIncluded && !hasBaggageCost && (
                  <PermissionGate permission="worksheets-transaction-details.update">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddBaggageCost}
                      disabled={!isEditable}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Tambah Biaya Bagasi
                    </Button>
                  </PermissionGate>
                )}
                <PermissionGate permission="worksheets-transaction-details.update">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddOperationalCost}
                    disabled={!isEditable}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Tambah Item
                  </Button>
                </PermissionGate>
              </div>
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
                      Orang/Unit/Trip
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold sm:text-sm">
                      Hari/Perjalanan
                    </TableHead>
                    <TableHead className="hidden text-center text-xs font-semibold sm:text-sm md:table-cell">
                      Keterangan
                    </TableHead>
                    <TableHead className="hidden text-center text-xs font-semibold sm:text-sm md:table-cell">
                      Tahun SBM
                    </TableHead>
                    <TableHead className="hidden text-right text-xs font-semibold sm:table-cell sm:text-sm">
                      Biaya/Unit
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold sm:text-sm">
                      Total
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold sm:text-sm">
                      Status Verifikasi
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
                    const isFixed =
                      item.item === WORKSHEET_FIELD_OPERATIONAL_ITEM;

                    if (isFixed) {
                      return (
                        <TableRow
                          key={index}
                          className="bg-muted/20 hover:bg-muted/30"
                        >
                          <TableCell
                            colSpan={6}
                            className="text-xs text-muted-foreground italic sm:text-sm"
                          >
                            {item.item}
                          </TableCell>
                          <TableCell className="text-right text-xs font-medium sm:text-sm">
                            -
                          </TableCell>
                          <TableCell colSpan={2} />
                        </TableRow>
                      );
                    }

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
                          <NumberInput
                            min={0}
                            value={item.unitCount}
                            onChange={(value) =>
                              handleUpdateOperationalCost(
                                index,
                                "unitCount",
                                value,
                              )
                            }
                            className="h-8 w-16 text-center text-xs sm:text-sm"
                            disabled={!isEditable}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <NumberInput
                            min={0}
                            value={item.days}
                            onChange={(value) =>
                              handleUpdateOperationalCost(index, "days", value)
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
                        <TableCell className="hidden text-center text-xs sm:text-sm md:table-cell">
                          <Input
                            type="number"
                            min={2000}
                            value={item.sbmYear ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdateOperationalCost(
                                index,
                                "sbmYear",
                                val === "" ? null : parseInt(val, 10),
                              );
                            }}
                            placeholder="Tahun"
                            className="h-8 w-16 text-center text-xs sm:text-sm"
                            disabled={!isEditable}
                          />
                        </TableCell>
                        <TableCell className="hidden text-right text-xs sm:table-cell sm:text-sm">
                          <Input
                            type="number"
                            min={0}
                            value={item.unitCost ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdateOperationalCost(
                                index,
                                "unitCost",
                                val === "" ? null : parseInt(val, 10),
                              );
                            }}
                            placeholder="-"
                            className="h-8 w-24 text-right text-xs sm:text-sm"
                            disabled={!isEditable}
                          />
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium sm:text-sm">
                          {itemTotal !== null ? formatCurrency(itemTotal) : "-"}
                        </TableCell>
                        <TableCell className="text-center text-xs sm:text-sm">
                          {isEditable && isVerifier && item.verificationStatus === "submitted" ? (
                            <div className="flex flex-col gap-1 items-center">
                              <select
                                value={item.verificationStatus || "submitted"}
                                onChange={(e) =>
                                  handleUpdateOperationalCost(
                                    index,
                                    "verificationStatus",
                                    e.target.value
                                  )
                                }
                                className="h-8 w-28 rounded-md border border-input bg-transparent px-2 py-1 text-xs outline-none"
                              >
                                <option value="submitted">Terkirim</option>
                                <option value="verified">Verified</option>
                                <option value="revised">Revisi</option>
                              </select>
                              {operationalCosts[index]?.verificationStatus === "revised" && (
                                <Input
                                  value={item.verificationNote || ""}
                                  onChange={(e) =>
                                    handleUpdateOperationalCost(
                                      index,
                                      "verificationNote",
                                      e.target.value || null
                                    )
                                  }
                                  placeholder="Catatan revisi"
                                  className="h-6 w-28 text-[10px]"
                                />
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "whitespace-nowrap rounded-md px-1.5 py-0 text-[10px] font-medium leading-4 tracking-wide shadow-none",
                                  item.verificationStatus
                                    ? OPERATIONAL_COST_VERIFICATION_STATUS_COLORS[item.verificationStatus]
                                    : OPERATIONAL_COST_VERIFICATION_STATUS_COLORS["draft"]
                                )}
                              >
                                {item.verificationStatus
                                  ? OPERATIONAL_COST_VERIFICATION_STATUS_LABELS[item.verificationStatus]
                                  : OPERATIONAL_COST_VERIFICATION_STATUS_LABELS["draft"]}
                              </Badge>
                              {item.verificationStatus === "revised" && item.verificationNote && (
                                <span className="text-[10px] text-muted-foreground">{item.verificationNote}</span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <PermissionGate permission="worksheets-transaction-details.update">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleRemoveOperationalCost(index)}
                              disabled={!isEditable}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {operationalCosts.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Belum ada biaya operasional
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
          {hasSavedOperationalCosts && isEditable && (
            <PermissionGate permission="worksheets-transaction-details.update">
              <Button
                variant="outline"
                className="flex-1 gap-2 sm:flex-initial"
                disabled={
                  publishOfferingMutation.isPending ||
                  saveOperationalCostsMutation.isPending ||
                  isOfferingSubmitted
                }
                onClick={() => {
                  if (isOfferingSubmitted) return;
                  publishOfferingMutation.mutate({ worksheetId: worksheet.id });
                }}
              >
                {publishOfferingMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
                {publishOfferingMutation.isPending
                  ? "Memproses..."
                  : isOfferingUnderReview
                    ? "Menunggu Persetujuan Kepala"
                    : isOfferingSubmitted
                      ? "Penawaran Diterbitkan"
                      : "Buat Penawaran"}
              </Button>
            </PermissionGate>
          )}
          {showOperationalCosts && (
            <PermissionGate permission="worksheets-transaction-details.update">
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
                Simpan
              </Button>
              {hasSavedOperationalCosts &&
                isEditable &&
                !isDirty &&
                operationalCosts.some(
                  (c) =>
                    c.verificationStatus === "draft" ||
                    c.verificationStatus === "revised",
                ) && (
                  <PermissionGate permission="worksheets-transaction-details.update">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 sm:flex-initial"
                      onClick={() => handleVerify("submitted")}
                      disabled={verifyOperationalCostsMutation.isPending}
                    >
                      Ajukan Verifikasi (Admin)
                    </Button>
                  </PermissionGate>
                )}
              {hasSavedOperationalCosts &&
                isEditable &&
                !isDirty &&
                operationalCosts.some(
                  (c) => c.verificationStatus === "submitted",
                ) && (
                  <PermissionGate permission="worksheets-transaction-details.verify">
                    <Button
                      className="flex-1 gap-2 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        const itemsToVerify = operationalCosts.filter(
                          (c) =>
                            c.verificationStatus === "verified" ||
                            c.verificationStatus === "revised",
                        );
                        if (itemsToVerify.length === 0) {
                          globalErrorToast(
                            "Ubah status ke Verified atau Revisi terlebih dahulu",
                          );
                          return;
                        }
                        verifyOperationalCostsMutation.mutate({
                          worksheetId,
                          verifications: itemsToVerify.map((c) => ({
                            id: c.id!,
                            verificationStatus: c.verificationStatus as
                              | "verified"
                              | "revised",
                            verificationNote: c.verificationNote || null,
                            sbmYear: c.sbmYear,
                          })),
                        });
                      }}
                      disabled={verifyOperationalCostsMutation.isPending}
                    >
                      Simpan Verifikasi Koordinator
                    </Button>
                  </PermissionGate>
                )}
              {hasSavedOperationalCosts && (
                <PermissionGate permission="worksheets-transaction-details.approve">
                  <Button
                    variant="secondary"
                    className="flex-1 gap-2 sm:flex-initial bg-purple-600 text-white hover:bg-purple-700"
                    onClick={() => {
                      // Override action by Kepala Koordinator Administrasi
                      handleSave();
                    }}
                    disabled={saveOperationalCostsMutation.isPending}
                  >
                    Override / Edit Final (Kepala Koordinator)
                  </Button>
                </PermissionGate>
              )}
            </PermissionGate>
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
      <EditEstimateDialog
        worksheetId={worksheet.id}
        currentDays={worksheet.estimatedAmountOfDays}
        currentMembers={worksheet.estimatedAmountOfMembers}
        isOpen={dialogs.isOpen("editEstimate")}
        setIsOpen={(isOpen) =>
          isOpen ? dialogs.open("editEstimate") : dialogs.close("editEstimate")
        }
      />
    </div>
  );
}
