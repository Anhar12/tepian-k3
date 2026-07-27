import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { PermissionGate } from "@/components/permission-gate";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  WorksheetHeaderCard,
  WorksheetHeaderCardSkeleton,
} from "@/components/worksheet-header-card";
import useDialogs from "@/hooks/use-dialog";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { getPublicUrl } from "@/utils/url";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import {
  EMPLOYEE_STATUS_COLORS,
  EMPLOYEE_STATUS_LABELS,
  ORDER_STATUS_FLOW,
  WORKSHEET_STATUS_LABELS,
  type EmployeeStatus,
  type OrderStatus,
  type WorksheetStatus,
} from "@tepian-k3/constants";
import {
  addBusinessDays,
  addDays,
  addMonths,
  addWeeks,
  differenceInBusinessDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isWeekend,
  isWithinInterval,
  nextMonday,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  AlertCircle,
  Building2,
  Calendar,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileCheck,
  Loader2,
  Lock,
  MapPin,
  Save,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { TestingCalendar } from "./-components/testing-calendar";

export const Route = createFileRoute("/(core)/worksheets/jadwal-personel")({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "worksheets.read" }),
  component: JadwalPersonilPage,
  head: () => pageHead("Lembar Kerja - Jadwal Personel"),
});

const routeApi = getRouteApi("/(core)/worksheets");

interface Personnel {
  id: string;
  name: string;
  role: string;
  initials: string;
  status: EmployeeStatus;
  isBusy?: boolean;
  color: string;
  avatarUrl?: string;
}

interface WorksheetSchedule {
  id: string;
  company: string;
  location: string;
  color: string | { bg: string; text: string; border: string; isTailwind?: boolean; className?: string };
  startDate: Date | null;
  endDate: Date | null;
  personnel: string[];
  fundingType?: string | null;
}

type CalendarView = "day" | "week" | "month";

const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const colorPalette = [
  "bg-blue-500",
  "bg-cyan-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-blue-400",
  "bg-cyan-400",
  "bg-purple-400",
  "bg-green-400",
  "bg-orange-500",
  "bg-red-500",
  "bg-pink-500",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-gray-500",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getColorForIndex(index: number): string {
  return colorPalette[index % colorPalette.length] ?? "bg-blue-500";
}

function getColorForCompany(companyId: string | undefined): { bg: string; text: string; border: string } {
  if (!companyId) {
    return { bg: "hsl(210, 100%, 95%)", text: "hsl(210, 100%, 20%)", border: "hsl(210, 100%, 80%)" };
  }
  let hash = 0;
  for (let i = 0; i < companyId.length; i++) {
    hash = companyId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    bg: `hsl(${hue}, 85%, 96%)`,
    text: `hsl(${hue}, 90%, 25%)`,
    border: `hsl(${hue}, 80%, 85%)`,
  };
}

function JadwalPersonilPage() {
  const { worksheetId } = routeApi.useSearch();
  const queryClient = useQueryClient();

  const getEventColorAndStyle = (color: any) => {
    const isStringColor = typeof color === "string";
    const colorClass = isStringColor
      ? color
      : (color.isTailwind
        ? color.className
        : "border");
    const customStyle =
      isStringColor || color.isTailwind
        ? {}
        : {
            backgroundColor: color.bg,
            color: color.text,
            borderColor: color.border,
            borderStyle: "solid" as const,
            borderWidth: "1px",
          };
    return { className: colorClass, style: customStyle };
  };

  const dialogs = useDialogs({
    saveDate: null,
  });

  // Fetch worksheet data
  const {
    data: worksheet,
    isLoading: worksheetLoading,
    error: worksheetError,
  } = useQuery(
    trpc.pengujian.worksheet.getWorksheetById.queryOptions({ worksheetId }),
  );

  // Fetch all employees
  const { data: employeesData, isLoading: employeesLoading } = useQuery(
    trpc.platform.employee.getAll.queryOptions(),
  );

  // Fetch all worksheets for schedule calendar display
  const { data: allWorksheetsData, isLoading: allWorksheetsLoading } = useQuery(
    trpc.pengujian.worksheet.getWorksheetsForSchedule.queryOptions(),
  );

  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<WorksheetSchedule | null>(
    null,
  );
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [showWeekEvents, setShowWeekEvents] = useState(false);
  const [weekEventsData, setWeekEventsData] = useState<WorksheetSchedule[]>([]);

  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<string[]>([]);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(
    undefined,
  );
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(
    undefined,
  );
  const [hideBusy, setHideBusy] = useState(false);
  const [showPhoneConfirm, setShowPhoneConfirm] = useState(false);

  const resetDialogState = () => {
    setShowAssignDialog(false);
    setSelectedPersonnel([]);
    setSelectedStartDate(undefined);
    setSelectedEndDate(undefined);
  };

  // Mutation to set IsPersonnelDateSet flag on worksheet
  const setPersonnelDateSetMutation = useMutation(
    trpc.pengujian.worksheet.updateWorksheetPersonnelDateSet.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.worksheet.getWorksheetById.queryOptions({
            worksheetId,
          }),
        );

        globalSuccessToast("Tanggal personil berhasil disimpan");
        dialogs.close("saveDate");
      },
      onError: (error) => {
        globalErrorToast("Gagal menyimpan tanggal personil: " + error.message);
      },
    }),
  );

  // Mutation to assign employees to worksheet
  const assignEmployeesMutation = useMutation(
    trpc.pengujian.worksheet.assignEmployees.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.worksheet.getWorksheetById.queryOptions({
            worksheetId,
          }),
        );
        await queryClient.invalidateQueries(
          trpc.pengujian.worksheet.getWorksheetsForSchedule.queryOptions(),
        );
        globalSuccessToast("Personil berhasil ditugaskan");
        resetDialogState();
      },
      onError: (error) => {
        globalErrorToast("Gagal menugaskan personil: " + error.message);
      },
    }),
  );

  const respondProposedDateMutation = useMutation(
    trpc.pengujian.worksheet.respondProposedDate.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.worksheet.getWorksheetById.queryOptions({
            worksheetId,
          }),
        );
        globalSuccessToast("Berhasil merespon usulan tanggal");
      },
      onError: (error) => {
        globalErrorToast("Gagal merespon usulan tanggal: " + error.message);
      },
    }),
  );

  // Calculate the dates to check for overlaps
  const checkStart = selectedStartDate ?? (worksheet?.startDate ? new Date(worksheet.startDate) : undefined);
  const checkEnd = selectedEndDate ?? (worksheet?.endDate ? new Date(worksheet.endDate) : undefined);

  // Transform employees data to personnel format
  const personnelData: Personnel[] = useMemo(() => {
    if (!employeesData) return [];
    
    return employeesData.map((emp, index) => {
      // Check for overlap in other worksheets
      let isBusy = false;
      if (checkStart && checkEnd && allWorksheetsData) {
        isBusy = allWorksheetsData.some(ws => {
           if (ws.id === worksheetId) return false; // skip current worksheet
           
           const isAssignedToWs = ws.assignments?.some(a => a.employee?.id === emp.id);
           if (!isAssignedToWs) return false;
           
           if (!ws.startDate || !ws.endDate) return false;
           
           const wsStart = new Date(ws.startDate);
           const wsEnd = new Date(ws.endDate);
           
           // Check if intervals overlap
           return checkStart <= wsEnd && checkEnd >= wsStart;
        });
      }

      return {
        id: emp.id,
        name: emp.name,
        role: emp.position.name ?? "Personil",
        initials: getInitials(emp.name),
        status: emp.status,
        isBusy,
        color: getColorForIndex(index),
        avatarUrl: emp.user.profilePictureUrl ?? undefined,
      };
    });
  }, [employeesData, allWorksheetsData, worksheetId, checkStart, checkEnd]);

  const displayedPersonnel = useMemo(() => {
    if (hideBusy) {
      return personnelData.filter((p) => !p.isBusy);
    }
    return personnelData;
  }, [personnelData, hideBusy]);

  // Transform all worksheets data to schedule format for calendar display
  const allSchedules: WorksheetSchedule[] = useMemo(() => {
    if (!allWorksheetsData) return [];
    return allWorksheetsData.map((ws) => ({
      id: ws.id,
      company: ws.order?.company?.name ?? "Perusahaan",
      location:
        [
          ...new Set(
            ws.items?.map((item) => item.location?.name).filter(Boolean),
          ),
        ].join(", ") || "Lokasi Pengujian",
      // Use company specific color to group worksheets from the same company
      color:
        ws.id === worksheetId
          ? { bg: "", text: "", border: "", isTailwind: true, className: "bg-blue-600 text-white" }
          : getColorForCompany(ws.order?.company?.id),
      startDate: ws.startDate ? new Date(ws.startDate) : null,
      endDate: ws.endDate ? new Date(ws.endDate) : null,
      personnel:
        ws.assignments?.map((a) => a.employee?.id).filter(Boolean) ?? [],
      fundingType: ws.order?.fundingType,
    }));
  }, [allWorksheetsData, worksheetId]);

  const [filterFundingType, setFilterFundingType] = useState<string>("all");

  const filteredSchedules = useMemo(() => {
    if (filterFundingType === "all") return allSchedules;
    return allSchedules.filter((s) => s.fundingType === filterFundingType);
  }, [allSchedules, filterFundingType]);

  // Get current worksheet schedule for highlighting
  const currentWorksheetSchedule = useMemo(() => {
    return allSchedules.find((s) => s.id === worksheetId) ?? null;
  }, [allSchedules, worksheetId]);

  // Get currently assigned personnel IDs
  const assignedPersonnelIds = useMemo(() => {
    return (
      worksheet?.assignments?.map((a) => a.employee?.id).filter(Boolean) ?? []
    );
  }, [worksheet]);

  const publishSPTMutation = useMutation(
    trpc.pengujian.worksheet.publishSPT.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.worksheet.getWorksheetById.queryOptions({
            worksheetId,
          }),
        );
        globalSuccessToast(
          "SPT berhasil diterbitkan. Admin dapat mencetak dokumen SPT.",
        );
      },
      onError: (error) => {
        globalErrorToast("Gagal menerbitkan SPT: " + error.message);
      },
    }),
  );

  // Check if worksheet is editable (status is 'verified') or personnel dates are not set yet
  const isEditable = useMemo(() => {
    if (!worksheet?.status) return false;
    return (
      ["verified"].includes(worksheet.status) && !worksheet.isPersonnelDateSet
    );
  }, [worksheet?.isPersonnelDateSet, worksheet?.status]);

  // SPT is already published once the linked order has reached (or passed)
  // the "menunggu_penerbitan_spt_jadwal" milestone in the status flow.
  const isSPTPublished = useMemo(() => {
    const orderStatus = worksheet?.order?.status as OrderStatus | undefined;
    if (!orderStatus) return false;
    const currentIdx = ORDER_STATUS_FLOW.indexOf(orderStatus);
    const sptIdx = ORDER_STATUS_FLOW.indexOf("menunggu_penerbitan_spt_jadwal");
    return currentIdx >= sptIdx && currentIdx !== -1;
  }, [worksheet?.order?.status]);

  // Initialize selected personnel and dates when opening dialog
  useEffect(() => {
    if (showAssignDialog) {
      if (assignedPersonnelIds.length > 0) {
        setSelectedPersonnel(assignedPersonnelIds as string[]);
      }
      // Initialize dates from worksheet
      if (worksheet?.startDate) {
        const worksheetStartDate = new Date(worksheet.startDate);
        setSelectedStartDate(worksheetStartDate);
        setSelectedEndDate(
          worksheet?.endDate
            ? new Date(worksheet.endDate)
            : addDays(
                worksheetStartDate,
                Math.max(worksheet.estimatedAmountOfDays - 1, 0),
              ),
        );
      } else if (worksheet?.endDate) {
        setSelectedEndDate(new Date(worksheet.endDate));
      }
    }
  }, [
    showAssignDialog,
    assignedPersonnelIds,
    worksheet?.estimatedAmountOfDays,
    worksheet?.startDate,
    worksheet?.endDate,
  ]);

  // Set current date to worksheet start date
  useEffect(() => {
    if (worksheet?.startDate) {
      setCurrentDate(new Date(worksheet.startDate));
    }
  }, [worksheet?.startDate]);

  const navigatePrev = () => {
    if (calendarView === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (calendarView === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (calendarView === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (calendarView === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const handleEventClick = (event: WorksheetSchedule) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  const handleWeekEventsClick = (events: WorksheetSchedule[]) => {
    setWeekEventsData(events);
    setShowWeekEvents(true);
  };

  const getStatusBadge = (status: EmployeeStatus) => {
    const colorClass =
      EMPLOYEE_STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700";
    const label = EMPLOYEE_STATUS_LABELS[status] ?? status;
    return (
      <Badge className={`${colorClass} hover:${colorClass}`}>{label}</Badge>
    );
  };

  // Employees with status "spt" can also be selected if the worksheet hasn't started yet,
  // since their current assignment may end before this worksheet begins.
  const worksheetStartDate = worksheet?.startDate
    ? new Date(worksheet.startDate)
    : null;
  const isBeforeWorksheetStart = worksheetStartDate
    ? new Date() < worksheetStartDate
    : false;

  const availablePersonnel = displayedPersonnel.filter((p) =>
    isBeforeWorksheetStart
      ? p.status === "siap" || p.status === "spt" || p.isBusy
      : p.status === "siap" || p.isBusy,
  );

  const maxSelectedPersonnel = worksheet?.estimatedAmountOfMembers ?? 0;

  const togglePersonnel = (personId: string) => {
    const person = availablePersonnel.find(p => p.id === personId);
    if (person?.isBusy) return;
    
    setSelectedPersonnel((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : prev.length >= maxSelectedPersonnel
          ? prev
          : [...prev, personId],
    );
  };

  const handleSaveAssignments = () => {
    if (selectedPersonnel.length === 0) {
      globalErrorToast("Pilih setidaknya satu personil untuk ditugaskan");
      return;
    }

    if (
      maxSelectedPersonnel > 0 &&
      selectedPersonnel.length > maxSelectedPersonnel
    ) {
      globalErrorToast(
        `Maksimal ${maxSelectedPersonnel} personil dapat dipilih untuk worksheet ini`,
      );
      return;
    }

    const originalStart = worksheet?.startDate ? new Date(worksheet.startDate).toDateString() : "";
    const originalEnd = worksheet?.endDate ? new Date(worksheet.endDate).toDateString() : "";
    const selectedStart = selectedStartDate ? selectedStartDate.toDateString() : "";
    const selectedEnd = selectedEndDate ? selectedEndDate.toDateString() : "";

    const isDateChanged = originalStart !== selectedStart || originalEnd !== selectedEnd;

    if (isDateChanged) {
      setShowPhoneConfirm(true);
      return;
    }

    executeSaveAssignments();
  };

  const executeSaveAssignments = () => {
    assignEmployeesMutation.mutate({
      worksheetId,
      employeeIds: selectedPersonnel,
      startDate: selectedStartDate?.toISOString(),
      endDate: selectedEndDate?.toISOString(),
    });
  };

  // Check if a date falls within the current worksheet schedule (for highlighting)
  const isDateInCurrentSchedule = (date: Date) => {
    if (!currentWorksheetSchedule || !currentWorksheetSchedule.startDate)
      return false;
    const endDate =
      currentWorksheetSchedule.endDate ?? currentWorksheetSchedule.startDate;
    return isWithinInterval(date, {
      start: currentWorksheetSchedule.startDate,
      end: endDate,
    });
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const allDays = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });
    const weeks: Date[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7));
    }

    const today = new Date();

    // Check if any worksheet events overlap with a week
    const getEventsForWeek = (weekDays: Date[]): WorksheetSchedule[] => {
      const weekStart = weekDays[0];
      const weekEnd = weekDays[6];
      if (!weekStart || !weekEnd) return [];

      return filteredSchedules.filter((schedule) => {
        if (!schedule.startDate) return false;
        const scheduleEnd = schedule.endDate ?? schedule.startDate;
        // Check if schedule overlaps with this week
        return schedule.startDate <= weekEnd && scheduleEnd >= weekStart;
      });
    };

    return (
      <div className="overflow-hidden rounded-xl border">
        <div className="grid grid-cols-7 bg-muted/50">
          {dayNames.map((day) => (
            <div
              key={day}
              className="border-b p-3 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {weeks.map((weekDays, weekIndex) => {
          const weekEvents = getEventsForWeek(weekDays);
          const visibleEvents = weekEvents.slice(0, 3);
          const hiddenCount = weekEvents.length - 3;

          return (
            <div key={weekIndex} className="relative">
              <div className="grid grid-cols-7">
                {weekDays.map((day, dayIndex) => {
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, today);
                  const isInCurrentSchedule = isDateInCurrentSchedule(day);

                  return (
                    <div
                      key={dayIndex}
                      className={`min-h-30 border-r border-b p-1 ${
                        !isCurrentMonth
                          ? "bg-muted/20"
                          : isInCurrentSchedule
                            ? "bg-blue-50 dark:bg-blue-950/20"
                            : "bg-background hover:bg-muted/30"
                      }`}
                    >
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                          isToday
                            ? "bg-primary font-bold text-primary-foreground"
                            : !isCurrentMonth
                              ? "text-muted-foreground"
                              : "text-foreground"
                        }`}
                      >
                        {format(day, "d")}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pointer-events-none absolute top-9 right-0 left-0 space-y-1 px-1">
                {visibleEvents.map((event) => {
                  // Skip rendering if no start date
                  if (!event.startDate) return null;

                  const weekStart = weekDays[0];
                  const weekEnd = weekDays[6];
                  if (!weekStart || !weekEnd) return null;

                  const scheduleEnd = event.endDate ?? event.startDate;

                  const eventStartInWeek =
                    event.startDate > weekStart ? event.startDate : weekStart;
                  const eventEndInWeek =
                    scheduleEnd < weekEnd ? scheduleEnd : weekEnd;

                  const startColIndex = weekDays.findIndex((d) =>
                    isSameDay(d, eventStartInWeek),
                  );
                  const endColIndex = weekDays.findIndex((d) =>
                    isSameDay(d, eventEndInWeek),
                  );

                  const leftPercent = (Math.max(0, startColIndex) / 7) * 100;
                  const widthPercent =
                    ((Math.max(0, endColIndex) -
                      Math.max(0, startColIndex) +
                      1) /
                      7) *
                    100;

                  const startsThisWeek = event.startDate >= weekStart;
                  const endsThisWeek = scheduleEnd <= weekEnd;

                  return (
                    <div
                      key={`${event.id}-${weekIndex}`}
                      className="pointer-events-auto relative h-6"
                      style={{
                        marginLeft: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                    >
                      <button
                        onClick={() => handleEventClick(event)}
                        className={`absolute inset-0 ${getEventColorAndStyle(event.color).className} flex cursor-pointer items-center truncate px-2 text-xs font-medium text-white transition-opacity hover:opacity-90 ${
                          startsThisWeek ? "rounded-l-md" : ""
                        } ${endsThisWeek ? "rounded-r-md" : ""}`}
                        style={getEventColorAndStyle(event.color).style}
                      >
                        {startsThisWeek && event.company}
                      </button>
                    </div>
                  );
                })}

                {hiddenCount > 0 && (
                  <div className="pointer-events-auto relative h-5 pl-1">
                    <button
                      onClick={() => handleWeekEventsClick(weekEvents)}
                      className="cursor-pointer text-xs font-medium text-primary hover:underline"
                    >
                      +{hiddenCount} lainnya
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: addDays(weekStart, 6),
    });

    const getEventsForDay = (day: Date): WorksheetSchedule[] => {
      return filteredSchedules.filter((schedule) => {
        if (!schedule.startDate) return false;
        const endDate = schedule.endDate ?? schedule.startDate;
        return isWithinInterval(day, {
          start: schedule.startDate,
          end: endDate,
        });
      });
    };

    const today = new Date();

    return (
      <div className="overflow-hidden rounded-xl border">
        <div className="grid grid-cols-8 bg-muted/50">
          <div className="border-r border-b p-3 text-center text-sm font-medium text-muted-foreground">
            <Clock className="mx-auto h-4 w-4" />
          </div>
          {weekDays.map((date, idx) => (
            <div key={idx} className="border-r border-b p-3 text-center">
              <div className="text-xs text-muted-foreground">
                {dayNames[idx]}
              </div>
              <div
                className={`mt-1 text-lg font-semibold ${
                  isSameDay(date, today) ? "text-primary" : ""
                }`}
              >
                {format(date, "d")}
              </div>
            </div>
          ))}
        </div>

        {["08:00", "10:00", "12:00", "14:00", "16:00"].map((time) => (
          <div key={time} className="grid grid-cols-8">
            <div className="border-r bg-muted/20 p-2 text-center text-xs text-muted-foreground">
              {time}
            </div>
            {weekDays.map((date, idx) => {
              const dayEvents = getEventsForDay(date);
              return (
                <div
                  key={idx}
                  className={`relative min-h-20 border-r border-b p-1 ${
                    isDateInCurrentSchedule(date)
                      ? "bg-blue-50 dark:bg-blue-950/20"
                      : ""
                  }`}
                >
                  {time === "08:00" &&
                    dayEvents.slice(0, 2).map((event, eventIdx) => (
                      <button
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className={`${getEventColorAndStyle(event.color).className} mb-1 block w-full truncate rounded p-1 text-left text-xs text-white hover:opacity-90`}
                        style={{ marginTop: eventIdx * 24, ...getEventColorAndStyle(event.color).style }}
                      >
                        {event.company}
                      </button>
                    ))}
                  {time === "08:00" && dayEvents.length > 2 && (
                    <span className="text-xs text-muted-foreground">
                      +{dayEvents.length - 2}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents: WorksheetSchedule[] = filteredSchedules.filter((schedule) => {
      if (!schedule.startDate) return false;
      const endDate = schedule.endDate ?? schedule.startDate;
      return isWithinInterval(currentDate, {
        start: schedule.startDate,
        end: endDate,
      });
    });

    return (
      <div className="overflow-hidden rounded-xl border">
        <div className="border-b bg-muted/50 p-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">
              {format(currentDate, "EEEE", { locale: localeId })}
            </div>
            <div className="text-3xl font-bold text-primary">
              {format(currentDate, "d")}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(currentDate, "MMMM yyyy", { locale: localeId })}
            </div>
          </div>
        </div>

        <div className="divide-y">
          {[
            "08:00",
            "09:00",
            "10:00",
            "11:00",
            "12:00",
            "13:00",
            "14:00",
            "15:00",
            "16:00",
            "17:00",
          ].map((time, idx) => (
            <div key={time} className="flex">
              <div className="w-20 shrink-0 border-r bg-muted/20 p-3 text-sm text-muted-foreground">
                {time}
              </div>
              <div
                className={`min-h-15 flex-1 p-2 ${isDateInCurrentSchedule(currentDate) ? "bg-blue-50 dark:bg-blue-950/20" : ""}`}
              >
                {idx === 0 &&
                  dayEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className={`${getEventColorAndStyle(event.color).className} mb-2 w-full rounded-lg p-2 text-left text-sm text-white hover:opacity-90`}
                      style={getEventColorAndStyle(event.color).style}
                    >
                      <div className="font-medium">{event.company}</div>
                      <div className="text-xs opacity-80">{event.location}</div>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (worksheetLoading || employeesLoading || allWorksheetsLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <WorksheetHeaderCardSkeleton />
        </div>
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <Card>
              <CardContent className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <Skeleton className="h-6 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-48" />
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={`h-${i}`} className="h-8 w-full" />
                  ))}
                  {Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="w-full shrink-0 space-y-4 lg:w-80">
            <Card>
              <CardContent className="space-y-3 p-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-3 p-4">
                <Skeleton className="h-5 w-40" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (worksheetError || !worksheet) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Worksheet tidak ditemukan</p>
        <p className="text-sm text-muted-foreground">
          {worksheetError?.message ?? "Tidak dapat memuat data worksheet"}
        </p>
      </div>
    );
  }

  const startDate = worksheet.startDate
    ? new Date(worksheet.startDate)
    : new Date();
  const businessStartDate = isWeekend(startDate)
    ? nextMonday(startDate)
    : startDate;
  const businessEndDate = addBusinessDays(
    businessStartDate,
    worksheet.estimatedAmountOfDays,
  );
  const estimatedSelectedEndDate = selectedStartDate
    ? addDays(
        selectedStartDate,
        Math.max(worksheet.estimatedAmountOfDays - 1, 0),
      )
    : undefined;
  const maxSelectedDays = Math.max(worksheet.estimatedAmountOfDays, 1);
  const maxSelectedDayOffset = maxSelectedDays - 1;
  const activeSelectedEndDate = selectedEndDate ?? estimatedSelectedEndDate;
  const selectedDateRange: DateRange | undefined = selectedStartDate
    ? {
        from: selectedStartDate,
        to: activeSelectedEndDate,
      }
    : undefined;

  return (
    <div className="space-y-4">
      <WorksheetHeaderCard
        title="Jadwal Personil"
        subtitle="Penjadwalan dan penugasan personel pengujian"
        actionButton={[
          {
            label: "Simpan",
            icon: <Save className="h-4 w-4" />,
            variant: "outline",
            size: "sm",
            showButton: isEditable,
            onClick: () => dialogs.open("saveDate"),
          },
          {
            label: publishSPTMutation.isPending
              ? "Memproses..."
              : isSPTPublished
                ? "SPT Diterbitkan"
                : "Buat SPT",
            icon: publishSPTMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileCheck className="h-4 w-4" />
            ),
            variant: "default",
            size: "sm",
            showButton: !!(
              worksheet?.isPersonnelDateSet &&
              (worksheet?.assignments?.length ?? 0) > 0
            ),
            permission: "worksheets-personnel-assignments.update",
            disabled: publishSPTMutation.isPending || isSPTPublished,
            onClick: () => {
              if (isSPTPublished) return;
              if (worksheetId) publishSPTMutation.mutate({ worksheetId });
            },
          },
        ]}
      />

      {/* Show readonly alert when worksheet is not editable */}
      {!isEditable && worksheet && (
        <Alert className="border-blue-200 bg-blue-50">
          <Lock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            Worksheet ini dalam status{" "}
            <strong>
              {WORKSHEET_STATUS_LABELS[worksheet.status as WorksheetStatus]}
            </strong>{" "}
            dan jadwal tidak dapat diubah. Jadwal hanya dapat diubah saat status{" "}
            <strong>Verified</strong>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row">
        <div className="flex-1">
          <Card>
            <CardContent className="p-2 sm:p-4">
              <div className="mb-3 flex flex-col items-start justify-between gap-3 sm:mb-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                  <h3 className="text-base font-semibold sm:text-lg">
                    Penjadwalan
                  </h3>
                </div>

                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-4">
                  <div className="flex items-center gap-2">
                    <Select
                      value={filterFundingType}
                      onValueChange={setFilterFundingType}
                    >
                      <SelectTrigger className="h-8 w-[140px] text-xs sm:h-9 sm:w-[160px] sm:text-sm">
                        <SelectValue placeholder="Semua Pendanaan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Pendanaan</SelectItem>
                        <SelectItem value="pnbp">PNBP</SelectItem>
                        <SelectItem value="dipa">DIPA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isEditable && (
                    <PermissionGate permission="worksheet-assignments.update">
                      <Button
                        onClick={() => setShowAssignDialog(true)}
                        className="gap-2"
                        size="sm"
                      >
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          Tugaskan Personil
                        </span>
                        <span className="sm:hidden">Tugaskan</span>
                      </Button>
                    </PermissionGate>
                  )}

                  <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                    <Button
                      variant={calendarView === "day" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCalendarView("day")}
                      className="px-2 text-xs sm:px-3 sm:text-sm"
                    >
                      Hari
                    </Button>
                    <Button
                      variant={calendarView === "week" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCalendarView("week")}
                      className="px-2 text-xs sm:px-3 sm:text-sm"
                    >
                      Minggu
                    </Button>
                    <Button
                      variant={calendarView === "month" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCalendarView("month")}
                      className="px-2 text-xs sm:px-3 sm:text-sm"
                    >
                      Bulan
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={navigatePrev}
                      className="h-8 w-8 bg-transparent sm:h-9 sm:w-9"
                    >
                      <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToToday}
                      className="bg-transparent px-2 text-xs sm:px-3 sm:text-sm"
                    >
                      Hari Ini
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={navigateNext}
                      className="h-8 w-8 bg-transparent sm:h-9 sm:w-9"
                    >
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>

                  <div className="text-base font-semibold sm:text-lg">
                    {format(currentDate, "MMMM yyyy", { locale: localeId })}
                  </div>
                </div>
              </div>

              {calendarView === "month" && renderMonthView()}
              {calendarView === "week" && renderWeekView()}
              {calendarView === "day" && renderDayView()}

              <div className="mt-4 flex flex-wrap gap-3 border-t pt-4">
                <span className="text-sm font-medium text-muted-foreground w-full sm:w-auto">Legenda:</span>
                {Array.from(new Set(filteredSchedules.map((s) => s.company))).map((company) => {
                  const schedule = filteredSchedules.find((s) => s.company === company);
                  if (!schedule) return null;
                  return (
                    <div key={company} className="flex items-center gap-2 text-xs">
                      <div
                        className={`h-3 w-3 rounded-full border ${getEventColorAndStyle(schedule.color).className}`}
                        style={getEventColorAndStyle(schedule.color).style}
                      />
                      <span>{company}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 border-t pt-4">
                <h4 className="mb-3 text-sm font-semibold text-slate-700">Tampilan Kalender Interaktif</h4>
                <TestingCalendar worksheets={allWorksheetsData || []} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full shrink-0 space-y-4 lg:w-80">
          {/* Estimated Card */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-primary sm:size-5" />
                <h3 className="text-sm font-semibold sm:text-base">Estimasi</h3>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-muted-foreground sm:size-5" />
                  <span className="text-sm text-foreground sm:text-base">
                    {format(businessStartDate, "dd/MM/yyyy")} -{" "}
                    {format(businessEndDate, "dd/MM/yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-muted-foreground sm:size-5" />
                  <span className="text-sm text-foreground sm:text-base">
                    {differenceInBusinessDays(
                      businessEndDate,
                      businessStartDate,
                    )}{" "}
                    Hari Kerja
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground sm:size-5" />
                  <span className="text-sm text-foreground sm:text-base">
                    {worksheet.estimatedAmountOfMembers} Personil
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Usulan Tanggal Customer */}
          {worksheet?.proposedDates && worksheet.proposedDates.length > 0 && (
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between sm:mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-orange-500 sm:h-5 sm:w-5" />
                    <h3 className="text-sm font-semibold sm:text-base">
                      Usulan Tanggal
                    </h3>
                  </div>
                  <Badge variant="outline">{worksheet.proposedDates.length}</Badge>
                </div>
                <div className="space-y-3">
                  {worksheet.proposedDates.map((usulan: any) => (
                    <div
                      key={usulan.id}
                      className="rounded-lg border bg-muted/30 p-3 text-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">
                          {format(new Date(usulan.proposedStartDate), "dd MMM yyyy", { locale: localeId })} -{" "}
                          {format(new Date(usulan.proposedEndDate), "dd MMM yyyy", { locale: localeId })}
                        </span>
                        {usulan.status === "pending" && (
                          <Badge className="bg-yellow-100 text-yellow-700">Menunggu</Badge>
                        )}
                        {usulan.status === "approved" && (
                          <Badge className="bg-green-100 text-green-700">Disetujui</Badge>
                        )}
                        {usulan.status === "rejected" && (
                          <Badge className="bg-red-100 text-red-700">Ditolak</Badge>
                        )}
                      </div>
                      {usulan.note && (
                        <p className="text-muted-foreground text-xs italic mb-2">"{usulan.note}"</p>
                      )}
                      
                      {usulan.status === "pending" && isEditable && (
                        <PermissionGate permission="worksheet-assignments.update">
                          <div className="flex gap-2 mt-3 pt-3 border-t">
                            <Button
                              size="sm"
                              className="w-full bg-green-500 hover:bg-green-600"
                              disabled={respondProposedDateMutation.isPending}
                              onClick={() => {
                                // F4-E: Terima usulan
                                respondProposedDateMutation.mutate({
                                  proposedDateId: usulan.id,
                                  action: "approved",
                                  finalStartDate: usulan.proposedStartDate,
                                  finalEndDate: usulan.proposedEndDate,
                                });
                              }}
                            >
                              Terima
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
                              disabled={respondProposedDateMutation.isPending}
                              onClick={() => {
                                // F4-E: Tolak usulan
                                respondProposedDateMutation.mutate({
                                  proposedDateId: usulan.id,
                                  action: "rejected",
                                });
                              }}
                            >
                              Tolak
                            </Button>
                          </div>
                        </PermissionGate>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assigned Personnel Card */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between sm:mb-4">
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-primary sm:size-5" />
                  <h3 className="text-sm font-semibold sm:text-base">
                    Personel Ditugaskan
                  </h3>
                </div>
                <Badge variant="secondary">{assignedPersonnelIds.length}</Badge>
              </div>

              {assignedPersonnelIds.length > 0 ? (
                <div className="space-y-2">
                  {assignedPersonnelIds.map((personId) => {
                    const person = personnelData.find((p) => p.id === personId);
                    if (!person) return null;
                    return (
                      <div
                        key={person.id}
                        className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2 sm:gap-3"
                      >
                        <Avatar className={`size-8 sm:size-10 ${person.color}`}>
                          <AvatarImage
                            src={getPublicUrl(person.avatarUrl ?? "")}
                            alt={person.name}
                          />
                          <AvatarFallback className="text-xs text-white sm:text-sm">
                            {person.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium sm:text-sm">
                            {person.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {person.role}
                          </p>
                        </div>
                        {getStatusBadge(person.status)}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Belum ada personel ditugaskan
                  </p>
                  {isEditable && (
                    <PermissionGate permission="worksheet-assignments.update">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setShowAssignDialog(true)}
                      >
                        Tugaskan Sekarang
                      </Button>
                    </PermissionGate>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Personnel Card */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between sm:mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
                  <h3 className="text-sm font-semibold sm:text-base">
                    Semua Personel
                  </h3>
                </div>
                <Badge variant="outline">{displayedPersonnel.length}</Badge>
              </div>

              <div className="mb-3 flex items-center gap-2 rounded-md border border-dashed p-2">
                <Checkbox
                  id="hide-busy-checkbox"
                  checked={hideBusy}
                  onCheckedChange={(checked) => setHideBusy(!!checked)}
                />
                <label
                  htmlFor="hide-busy-checkbox"
                  className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Sembunyikan pegawai dengan SPT aktif
                </label>
              </div>

              <ScrollArea className="h-60 sm:h-80">
                <div className="space-y-2 pr-2">
                  {displayedPersonnel.map((person) => {
                    const isAssigned = assignedPersonnelIds.includes(person.id);
                    const isBusy = person.isBusy;
                    return (
                      <div
                        key={person.id}
                        className={`flex items-center gap-2 rounded-lg p-2 transition-colors sm:gap-3 ${
                          isAssigned
                            ? "border border-primary/20 bg-primary/5"
                            : isBusy 
                              ? "opacity-50"
                              : "hover:bg-muted/50"
                        }`}
                      >
                        <Avatar
                          className={`h-8 w-8 sm:h-10 sm:w-10 ${person.color}`}
                        >
                          <AvatarFallback className="text-xs text-white sm:text-sm">
                            {person.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium sm:text-sm">
                            {person.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {person.role}
                          </p>
                        </div>
                        {isAssigned ? (
                          <Badge variant="default" className="text-xs">
                            Ditugaskan
                          </Badge>
                        ) : isBusy ? (
                          <Badge variant="destructive" className="text-xs">
                            Sibuk
                          </Badge>
                        ) : (
                          getStatusBadge(person.status)
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assign Personnel Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="flex max-h-[90vh] max-w-lg flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Tugaskan Personil
            </DialogTitle>
            <DialogDescription>
              Tugaskan personil untuk worksheet pengujian ini
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto py-4">
            {/* Worksheet Info */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4 text-primary" />
                {currentWorksheetSchedule?.company}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {currentWorksheetSchedule?.location}
              </div>
            </div>

            {/* Schedule Date Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Jadwal Pengujian</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedStartDate && "text-muted-foreground",
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedStartDate && activeSelectedEndDate
                      ? `${format(selectedStartDate, "d MMM yyyy", {
                          locale: localeId,
                        })} - ${format(activeSelectedEndDate, "d MMM yyyy", {
                          locale: localeId,
                        })}`
                      : "Pilih rentang tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="range"
                    selected={selectedDateRange}
                    max={maxSelectedDayOffset}
                    onSelect={(range) => {
                      if (!range?.from) {
                        setSelectedStartDate(undefined);
                        setSelectedEndDate(undefined);
                        return;
                      }

                      const maxEndDate = addDays(
                        range.from,
                        maxSelectedDayOffset,
                      );

                      if (range.to && isBefore(maxEndDate, range.to)) {
                        setSelectedStartDate(range.to);
                        setSelectedEndDate(
                          addDays(range.to, maxSelectedDayOffset),
                        );
                        return;
                      }

                      setSelectedStartDate(range.from);
                      setSelectedEndDate(
                        range.to &&
                          !isSameDay(range.from, range.to) &&
                          isBefore(range.to, maxEndDate)
                          ? range.to
                          : maxEndDate,
                      );
                    }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
              {selectedStartDate && selectedEndDate && (
                <p className="text-xs text-muted-foreground">
                  Durasi:{" "}
                  {Math.ceil(
                    (selectedEndDate.getTime() - selectedStartDate.getTime()) /
                      (1000 * 60 * 60 * 24),
                  ) + 1}{" "}
                  hari
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">
                Pilih Personel (Status:{" "}
                {isBeforeWorksheetStart ? "Siap / SPT" : "Siap"})
              </p>
              <p className="text-xs text-muted-foreground">
                {isBeforeWorksheetStart
                  ? 'Personel dengan status "Siap" atau "SPT" dapat dipilih karena pengujian belum dimulai'
                  : 'Hanya personel dengan status "Siap" yang dapat ditugaskan'}
              </p>
              <p className="text-xs text-muted-foreground">
                Maksimal {maxSelectedPersonnel} personil sesuai estimasi
                worksheet
              </p>
              <ScrollArea className="h-60 rounded-lg border p-2">
                <div className="space-y-2">
                  {availablePersonnel.map((person) => {
                    const isBusy = person.isBusy;
                    return (
                    <div
                      key={person.id}
                      onClick={() => togglePersonnel(person.id)}
                      className={`flex items-center gap-3 rounded-lg p-2 transition-colors ${
                        isBusy ? "opacity-50 cursor-not-allowed bg-muted/20" : "cursor-pointer"
                      } ${
                        selectedPersonnel.includes(person.id)
                          ? "border border-primary bg-primary/10"
                          : "border border-transparent hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        checked={selectedPersonnel.includes(person.id)}
                        disabled={
                          isBusy || 
                          (!selectedPersonnel.includes(person.id) &&
                          selectedPersonnel.length >= maxSelectedPersonnel)
                        }
                        onCheckedChange={() => togglePersonnel(person.id)}
                      />
                      <Avatar className={`h-8 w-8 ${person.color}`}>
                        <AvatarFallback className="text-xs text-white">
                          {person.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {person.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {person.role}
                        </p>
                      </div>
                      {isBusy && (
                        <Badge variant="destructive" className="text-[10px] h-5">
                          Tidak Tersedia
                        </Badge>
                      )}
                      {selectedPersonnel.includes(person.id) && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  )})}
                  {availablePersonnel.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Tidak ada personel dengan status{" "}
                      {isBeforeWorksheetStart ? '"Siap" atau "SPT"' : '"Siap"'}
                    </p>
                  )}
                </div>
              </ScrollArea>
              {selectedPersonnel.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedPersonnel.length}/{maxSelectedPersonnel} personel
                  dipilih
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={resetDialogState}>
              Batal
            </Button>
            <PermissionGate permission="worksheet-assignments.update">
              <Button
                onClick={handleSaveAssignments}
                disabled={
                  selectedPersonnel.length === 0 ||
                  assignEmployeesMutation.isPending
                }
              >
                {assignEmployeesMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Simpan Penugasan
              </Button>
            </PermissionGate>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Detail Dialog */}
      <Dialog open={showEventDetail} onOpenChange={setShowEventDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {selectedEvent?.company}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {selectedEvent?.location}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {selectedEvent?.startDate
                  ? format(selectedEvent.startDate, "d MMMM yyyy", {
                      locale: localeId,
                    })
                  : "Belum dijadwalkan"}
                {selectedEvent?.endDate &&
                  ` - ${format(selectedEvent.endDate, "d MMMM yyyy", { locale: localeId })}`}
              </span>
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-2 font-medium">
                <Users className="h-4 w-4 text-primary" />
                Personel Ditugaskan ({selectedEvent?.personnel.length ?? 0})
              </h4>
              <div className="space-y-2">
                {selectedEvent?.personnel.map((personId) => {
                  const person = personnelData.find((p) => p.id === personId);
                  if (!person) return null;
                  return (
                    <div
                      key={person.id}
                      className="flex items-center gap-3 rounded-lg bg-muted/50 p-2"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback
                          className={`${person.color} text-xs text-white`}
                        >
                          {person.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{person.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {person.role}
                        </p>
                      </div>
                      {getStatusBadge(person.status)}
                    </div>
                  );
                })}
                {(!selectedEvent?.personnel ||
                  selectedEvent.personnel.length === 0) && (
                  <p className="py-2 text-center text-sm text-muted-foreground">
                    Belum ada personel ditugaskan
                  </p>
                )}
              </div>
            </div>

            {isEditable && (
              <DialogFooter>
                <PermissionGate permission="worksheet-assignments.update">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEventDetail(false);
                      setShowAssignDialog(true);
                    }}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Edit Penugasan
                  </Button>
                </PermissionGate>
              </DialogFooter>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Week Events Dialog */}
      <Dialog open={showWeekEvents} onOpenChange={setShowWeekEvents}>
        <DialogContent className="max-h-[80vh] max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Jadwal Minggu Ini
            </DialogTitle>
            <DialogDescription>
              {weekEventsData.length} jadwal pengujian
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 pr-2">
              {weekEventsData.map((event) => (
                <button
                  key={event.id}
                  onClick={() => {
                    setShowWeekEvents(false);
                    handleEventClick(event);
                  }}
                  className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-3 w-3 rounded-full ${event.color} mt-1.5 shrink-0`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{event.company}</p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {event.startDate
                          ? format(event.startDate, "d MMM", {
                              locale: localeId,
                            })
                          : "Belum dijadwalkan"}
                        {event.endDate &&
                          ` - ${format(event.endDate, "d MMM", { locale: localeId })}`}
                      </p>
                      <div className="mt-2 flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <div className="flex -space-x-1">
                          {event.personnel.slice(0, 4).map((personId) => {
                            const person = personnelData.find(
                              (p) => p.id === personId,
                            );
                            if (!person) return null;
                            return (
                              <Avatar
                                key={person.id}
                                className="h-5 w-5 border border-background"
                              >
                                <AvatarFallback
                                  className={`${person.color} text-[8px] text-white`}
                                >
                                  {person.initials}
                                </AvatarFallback>
                              </Avatar>
                            );
                          })}
                        </div>
                        {event.personnel.length > 4 && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            +{event.personnel.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={dialogs.isOpen("saveDate")}
        onOpenChange={(isOpen) =>
          isOpen ? dialogs.open("saveDate") : dialogs.close("saveDate")
        }
        title="Simpan Jadwal"
        description="Apakah Anda yakin ingin menyimpan jadwal ini? Pastikan semua informasi sudah benar sebelum menyimpan."
        isLoading={setPersonnelDateSetMutation.isPending}
        onConfirm={() =>
          setPersonnelDateSetMutation.mutate({ worksheetId, isSet: true })
        }
      />

      <ConfirmationDialog
        open={showPhoneConfirm}
        onOpenChange={setShowPhoneConfirm}
        title="Pengingat Konfirmasi Telepon"
        description={`Anda mengubah jadwal pelaksanaan kegiatan. Silakan hubungi PIC perusahaan (${
          worksheet?.order?.company?.responsibleTestingPerson ?? "PIC"
        } - ${
          worksheet?.order?.company?.responsibleTestingPersonPhone ?? "-"
        }) melalui telepon untuk melakukan konfirmasi perubahan jadwal ini. Apakah Anda sudah menelepon PIC dan ingin melanjutkan penyimpanan?`}
        isLoading={assignEmployeesMutation.isPending}
        onConfirm={() => {
          setShowPhoneConfirm(false);
          executeSaveAssignments();
        }}
      />
    </div>
  );
}
