import { useState, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  MapPin,
  Building2,
  Calendar,
  Clock,
  Check,
  Loader2,
  AlertCircle,
  Save,
  Download,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { WorksheetHeaderCard } from "@/components/worksheet-header-card";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { trpc } from "@/utils/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  EMPLOYEE_STATUS_COLORS,
  EMPLOYEE_STATUS_LABELS,
  WORKSHEET_STATUS_LABELS,
  type EmployeeStatus,
  type WorksheetStatus,
} from "@tepian-k3/constants";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isWithinInterval,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import { requirePermission } from "@/utils/require-permission";
import { PermissionGate } from "@/components/permission-gate";

// TODO: Make this page can be edited when status is verified approved and order is payed

export const Route = createFileRoute("/(core)/worksheets/jadwal-personel")({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "worksheets.read" }),
  component: JadwalPersonilPage,
});

const routeApi = getRouteApi("/(core)/worksheets");

interface Personnel {
  id: string;
  name: string;
  role: string;
  initials: string;
  status: EmployeeStatus;
  color: string;
}

interface WorksheetSchedule {
  id: string;
  company: string;
  location: string;
  color: string;
  startDate: Date | null;
  endDate: Date | null;
  personnel: string[];
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

function JadwalPersonilPage() {
  const { worksheetId } = routeApi.useSearch();
  const queryClient = useQueryClient();

  // Fetch worksheet data
  const {
    data: worksheet,
    isLoading: worksheetLoading,
    error: worksheetError,
  } = useQuery(trpc.worksheet.getWorksheetById.queryOptions({ worksheetId }));

  // Fetch all employees
  const { data: employeesData, isLoading: employeesLoading } = useQuery(
    trpc.employee.getAll.queryOptions(),
  );

  // Fetch all worksheets for schedule calendar display
  const { data: allWorksheetsData, isLoading: allWorksheetsLoading } = useQuery(
    trpc.worksheet.getWorksheetsForSchedule.queryOptions(),
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

  const resetDialogState = () => {
    setShowAssignDialog(false);
    setSelectedPersonnel([]);
    setSelectedStartDate(undefined);
    setSelectedEndDate(undefined);
  };

  // Mutation to assign employees to worksheet
  const assignEmployeesMutation = useMutation(
    trpc.worksheet.assignEmployees.mutationOptions({
      onSuccess: () => {
        toast.success("Personil dan jadwal berhasil disimpan");
        queryClient.invalidateQueries({
          queryKey: trpc.worksheet.getWorksheetById.queryKey({ worksheetId }),
        });
        resetDialogState();
      },
      onError: (error) => {
        toast.error(error.message || "Gagal menugaskan personil");
      },
    }),
  );

  // Transform employees data to personnel format
  const personnelData: Personnel[] = useMemo(() => {
    if (!employeesData) return [];
    return employeesData.map((emp, index) => ({
      id: emp.id,
      name: emp.name,
      role: emp.position.name ?? "Personil",
      initials: getInitials(emp.name),
      status: emp.status,
      color: getColorForIndex(index),
    }));
  }, [employeesData]);

  // Transform all worksheets data to schedule format for calendar display
  const allSchedules: WorksheetSchedule[] = useMemo(() => {
    if (!allWorksheetsData) return [];
    return allWorksheetsData.map((ws, index) => ({
      id: ws.id,
      company: ws.order?.company?.name ?? "Perusahaan",
      location: ws.testing?.items?.[0]?.location?.name ?? "Lokasi Pengujian",
      // Use different color for current worksheet, cycle through palette for others
      color:
        ws.id === worksheetId ? "bg-blue-600" : getColorForIndex(index + 1),
      startDate: ws.startDate ? new Date(ws.startDate) : null,
      endDate: ws.endDate ? new Date(ws.endDate) : null,
      personnel:
        ws.assignments?.map((a) => a.employee?.id).filter(Boolean) ?? [],
    }));
  }, [allWorksheetsData, worksheetId]);

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

  // Check if worksheet is editable (only draft or revision status)
  const isEditable = useMemo(() => {
    if (!worksheet?.status) return false;
    return ["draft", "revision"].includes(worksheet.status);
  }, [worksheet?.status]);

  // Initialize selected personnel and dates when opening dialog
  useEffect(() => {
    if (showAssignDialog) {
      if (assignedPersonnelIds.length > 0) {
        setSelectedPersonnel(assignedPersonnelIds as string[]);
      }
      // Initialize dates from worksheet
      if (worksheet?.startDate) {
        setSelectedStartDate(new Date(worksheet.startDate));
      }
      if (worksheet?.endDate) {
        setSelectedEndDate(new Date(worksheet.endDate));
      }
    }
  }, [
    showAssignDialog,
    assignedPersonnelIds,
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

  const availablePersonnel = personnelData.filter((p) => p.status === "siap");

  const togglePersonnel = (personId: string) => {
    setSelectedPersonnel((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId],
    );
  };

  const handleSaveAssignments = () => {
    if (selectedPersonnel.length === 0) {
      toast.error("Pilih minimal 1 personil");
      return;
    }

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

      return allSchedules.filter((schedule) => {
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
                        className={`absolute inset-0 ${event.color} flex cursor-pointer items-center truncate px-2 text-xs font-medium text-white transition-opacity hover:opacity-90 ${
                          startsThisWeek ? "rounded-l-md" : ""
                        } ${endsThisWeek ? "rounded-r-md" : ""}`}
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
      return allSchedules.filter((schedule) => {
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
                        className={`${event.color} mb-1 block w-full truncate rounded p-1 text-left text-xs text-white hover:opacity-90`}
                        style={{ marginTop: eventIdx * 24 }}
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
    const dayEvents: WorksheetSchedule[] = allSchedules.filter((schedule) => {
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
                      className={`${event.color} mb-2 w-full rounded-lg p-2 text-left text-sm text-white hover:opacity-90`}
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
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
            onClick: () => {},
          },
          {
            label: "Export",
            icon: <Download className="h-4 w-4" />,
            variant: "default",
            size: "sm",
            onClick: () => {},
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
            <strong>Draft</strong> atau <strong>Revision</strong>.
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
            </CardContent>
          </Card>
        </div>

        <div className="w-full shrink-0 space-y-4 lg:w-80">
          {/* Assigned Personnel Card */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between sm:mb-4">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
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
                <Badge variant="outline">{personnelData.length}</Badge>
              </div>

              <ScrollArea className="h-60 sm:h-80">
                <div className="space-y-2 pr-2">
                  {personnelData.map((person) => {
                    const isAssigned = assignedPersonnelIds.includes(person.id);
                    return (
                      <div
                        key={person.id}
                        className={`flex items-center gap-2 rounded-lg p-2 transition-colors sm:gap-3 ${
                          isAssigned
                            ? "border border-primary/20 bg-primary/5"
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
              <div className="grid grid-cols-2 gap-3">
                {/* Start Date */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Tanggal Mulai
                  </Label>
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
                        {selectedStartDate
                          ? format(selectedStartDate, "d MMM yyyy", {
                              locale: localeId,
                            })
                          : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={selectedStartDate}
                        onSelect={(date) => {
                          setSelectedStartDate(date);
                          // If end date is before start date, clear it
                          if (
                            date &&
                            selectedEndDate &&
                            selectedEndDate < date
                          ) {
                            setSelectedEndDate(undefined);
                          }
                        }}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Date */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Tanggal Selesai
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedEndDate && "text-muted-foreground",
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {selectedEndDate
                          ? format(selectedEndDate, "d MMM yyyy", {
                              locale: localeId,
                            })
                          : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={selectedEndDate}
                        onSelect={setSelectedEndDate}
                        disabled={(date) =>
                          selectedStartDate ? date < selectedStartDate : false
                        }
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
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
                Pilih Personel (Status: Siap)
              </p>
              <p className="text-xs text-muted-foreground">
                Hanya personel dengan status "Siap" yang dapat ditugaskan
              </p>
              <ScrollArea className="h-60 rounded-lg border p-2">
                <div className="space-y-2">
                  {availablePersonnel.map((person) => (
                    <div
                      key={person.id}
                      onClick={() => togglePersonnel(person.id)}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors ${
                        selectedPersonnel.includes(person.id)
                          ? "border border-primary bg-primary/10"
                          : "border border-transparent hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        checked={selectedPersonnel.includes(person.id)}
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
                      {selectedPersonnel.includes(person.id) && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  ))}
                  {availablePersonnel.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Tidak ada personel dengan status "Siap"
                    </p>
                  )}
                </div>
              </ScrollArea>
              {selectedPersonnel.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedPersonnel.length} personel dipilih
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
    </div>
  );
}
