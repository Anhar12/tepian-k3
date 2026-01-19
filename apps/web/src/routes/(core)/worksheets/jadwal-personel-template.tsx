"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  MapPin,
  Building2,
  Calendar,
  Clock,
  Filter,
  Plus,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { WorksheetHeaderCard } from "@/components/worksheet-header-card";

const personnelData = [
  {
    id: 1,
    name: "Waluyo",
    role: "Kepala Regu",
    initials: "WL",
    status: "siap",
    color: "bg-blue-500",
  },
  {
    id: 2,
    name: "Rahmat",
    role: "Ketua Regu Kimia",
    initials: "RM",
    status: "siap",
    color: "bg-cyan-500",
  },
  {
    id: 3,
    name: "Zaqqi Muawanah",
    role: "Penguji K3 Ahli Madya",
    initials: "ZM",
    status: "siap",
    color: "bg-purple-500",
  },
  {
    id: 4,
    name: "Heri Purwanto, M.Si",
    role: "Penguji K3 Ahli Madya",
    initials: "HP",
    status: "siap",
    color: "bg-green-500",
  },
  {
    id: 5,
    name: "Rahman Nur",
    role: "Penguji K3 Ahli Muda",
    initials: "RN",
    status: "siap",
    color: "bg-blue-400",
  },
  {
    id: 6,
    name: "Muliyadi",
    role: "Penguji K3 Ahli Muda",
    initials: "MY",
    status: "siap",
    color: "bg-cyan-400",
  },
  {
    id: 7,
    name: "David Lagadoni",
    role: "Penguji K3 Ahli Muda",
    initials: "DL",
    status: "siap",
    color: "bg-purple-400",
  },
  {
    id: 8,
    name: "Ahmad Yani",
    role: "Penguji K3 Ahli Muda",
    initials: "AY",
    status: "siap",
    color: "bg-green-400",
  },
  {
    id: 9,
    name: "Ugeng Priyanto",
    role: "Penguji K3 Ahli Pertama",
    initials: "UP",
    status: "spt",
    color: "bg-orange-500",
  },
  {
    id: 10,
    name: "Arif Sumarianto",
    role: "Penguji K3 Ahli Pertama",
    initials: "AS",
    status: "spt",
    color: "bg-red-500",
  },
  {
    id: 11,
    name: "Rizky Katherine",
    role: "Penguji K3 Ahli Pertama",
    initials: "RK",
    status: "spt",
    color: "bg-pink-500",
  },
  {
    id: 12,
    name: "Priscella Cindy Samosir",
    role: "Penguji K3 Ahli Pertama",
    initials: "PS",
    status: "standby",
    color: "bg-amber-500",
  },
  {
    id: 13,
    name: "Arif Budiman",
    role: "Penguji K3 Ahli Pertama",
    initials: "AB",
    status: "standby",
    color: "bg-yellow-500",
  },
  {
    id: 14,
    name: "Henny Ayu Nirwala",
    role: "Penguji K3 Ahli Pertama",
    initials: "HN",
    status: "cuti",
    color: "bg-gray-500",
  },
];

const companySchedules = [
  {
    id: 1,
    company: "PT. Badak LNG",
    location: "Bontang, Kalimantan Timur",
    color: "bg-cyan-500",
    startDay: 1,
    endDay: 10,
    personnel: [1, 2, 3, 5],
  },
  {
    id: 2,
    company: "PT. Barokah",
    location: "Jakarta",
    color: "bg-emerald-500",
    startDay: 1,
    endDay: 7,
    personnel: [4, 6, 7],
  },
  {
    id: 3,
    company: "PT. Anugerah Sara Kaltim",
    location: "Samarinda",
    color: "bg-amber-500",
    startDay: 3,
    endDay: 15,
    personnel: [8, 9, 10],
  },
  {
    id: 4,
    company: "PT. Maehub Bersaudara",
    location: "Balikpapan",
    color: "bg-blue-500",
    startDay: 5,
    endDay: 12,
    personnel: [1, 11, 12],
  },
  {
    id: 5,
    company: "DIPA Kalimantan Selatan",
    location: "Banjarmasin",
    color: "bg-rose-500",
    startDay: 8,
    endDay: 20,
    personnel: [2, 3, 13],
  },
  {
    id: 6,
    company: "PT. Perjadin Jakarta",
    location: "Jakarta",
    color: "bg-purple-500",
    startDay: 10,
    endDay: 18,
    personnel: [5, 6, 14],
  },
  {
    id: 7,
    company: "DIPA Kalimantan Utara",
    location: "Tarakan",
    color: "bg-indigo-500",
    startDay: 12,
    endDay: 25,
    personnel: [7, 8, 9],
  },
  {
    id: 8,
    company: "PT. Antareja Mahada Makmur",
    location: "Samarinda",
    color: "bg-teal-500",
    startDay: 15,
    endDay: 28,
    personnel: [1, 2, 4, 10],
  },
  {
    id: 9,
    company: "PT. Samarinda Ulu",
    location: "Samarinda",
    color: "bg-orange-500",
    startDay: 20,
    endDay: 31,
    personnel: [3, 5, 11],
  },
  {
    id: 10,
    company: "PT. Perjadin Bogor",
    location: "Bogor",
    color: "bg-lime-600",
    startDay: 22,
    endDay: 30,
    personnel: [6, 12, 13],
  },
];

type CalendarView = "day" | "week" | "month";

const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function JadwalPersonilPage() {
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 1));
  const [selectedEvent, setSelectedEvent] = useState<
    (typeof companySchedules)[0] | null
  >(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [showWeekEvents, setShowWeekEvents] = useState(false);
  const [weekEventsData, setWeekEventsData] = useState<typeof companySchedules>(
    [],
  );

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    company: "",
    location: "",
    startDay: 1,
    endDay: 7,
    personnel: [] as number[],
  });
  const [schedules, setSchedules] = useState(companySchedules);

  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const navigatePrev = () => {
    if (calendarView === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
      );
    } else if (calendarView === "week") {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    }
  };

  const navigateNext = () => {
    if (calendarView === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
      );
    } else if (calendarView === "week") {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  const goToToday = () => setCurrentDate(new Date(2025, 11, 15));

  const handleEventClick = (event: (typeof companySchedules)[0]) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  const handleWeekEventsClick = (events: typeof companySchedules) => {
    setWeekEventsData(events);
    setShowWeekEvents(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "siap":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            Siap
          </Badge>
        );
      case "spt":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            SPT
          </Badge>
        );
      case "standby":
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            Standby
          </Badge>
        );
      case "cuti":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            Cuti
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const availablePersonnel = personnelData.filter((p) => p.status === "siap");

  const togglePersonnel = (personId: number) => {
    setNewEvent((prev) => ({
      ...prev,
      personnel: prev.personnel.includes(personId)
        ? prev.personnel.filter((id) => id !== personId)
        : [...prev.personnel, personId],
    }));
  };

  const handleCreateEvent = () => {
    if (
      !newEvent.company ||
      !newEvent.location ||
      newEvent.personnel.length === 0
    )
      return;

    const colors = [
      "bg-cyan-500",
      "bg-emerald-500",
      "bg-amber-500",
      "bg-blue-500",
      "bg-rose-500",
      "bg-purple-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-orange-500",
      "bg-lime-600",
    ];

    const newSchedule = {
      id: schedules.length + 1,
      company: newEvent.company,
      location: newEvent.location,
      color: colors[Math.floor(Math.random() * colors.length)],
      startDay: newEvent.startDay,
      endDay: newEvent.endDay,
      personnel: newEvent.personnel,
    };

    setSchedules([...schedules, newSchedule]);
    setShowCreateEvent(false);
    setNewEvent({
      company: "",
      location: "",
      startDay: 1,
      endDay: 7,
      personnel: [],
    });
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const weeks: {
      startDay: number;
      endDay: number;
      days: (number | null)[];
    }[] = [];

    let currentWeek: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) currentWeek.push(null);

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push({
          startDay: currentWeek.find((d) => d !== null) || 1,
          endDay: day,
          days: currentWeek,
        });
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push({
        startDay: currentWeek.find((d) => d !== null) || 1,
        endDay: daysInMonth,
        days: currentWeek,
      });
    }

    const getEventsForWeek = (weekStart: number, weekEnd: number) => {
      return schedules
        .filter((event) => {
          return event.startDay <= weekEnd && event.endDay >= weekStart;
        })
        .sort(
          (a, b) =>
            a.startDay - b.startDay ||
            b.endDay - b.startDay - (a.endDay - a.startDay),
        );
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

        {weeks.map((week, weekIndex) => {
          const weekEvents = getEventsForWeek(week.startDay, week.endDay);
          const visibleEvents = weekEvents.slice(0, 3);
          const hiddenCount = weekEvents.length - 3;

          return (
            <div key={weekIndex} className="relative">
              <div className="grid grid-cols-7">
                {week.days.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`min-h-30 border-r border-b p-1 ${
                      day === null
                        ? "bg-muted/20"
                        : "bg-background hover:bg-muted/30"
                    }`}
                  >
                    {day && (
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                          day === 15
                            ? "bg-primary font-bold text-primary-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {day}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="pointer-events-none absolute top-9 right-0 left-0 space-y-1 px-1">
                {visibleEvents.map((event, idx) => {
                  const weekStartDay = week.days.find((d) => d !== null) || 1;
                  const weekEndDay =
                    week.days.filter((d) => d !== null).pop() || 7;

                  const eventStartInWeek = Math.max(
                    event.startDay,
                    weekStartDay,
                  );
                  const eventEndInWeek = Math.min(event.endDay, weekEndDay);

                  const startColIndex = week.days.findIndex(
                    (d) => d === eventStartInWeek,
                  );
                  const endColIndex = week.days.findIndex(
                    (d) => d === eventEndInWeek,
                  );

                  const leftPercent = (startColIndex / 7) * 100;
                  const widthPercent =
                    ((endColIndex - startColIndex + 1) / 7) * 100;

                  const startsThisWeek = event.startDay >= weekStartDay;
                  const endsThisWeek = event.endDay <= weekEndDay;

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
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });

    const getEventsForDay = (day: number) => {
      return schedules.filter(
        (event) => day >= event.startDay && day <= event.endDay,
      );
    };

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
                className={`mt-1 text-lg font-semibold ${date.getDate() === 15 ? "text-primary" : ""}`}
              >
                {date.getDate()}
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
              const dayEvents = getEventsForDay(date.getDate());
              return (
                <div
                  key={idx}
                  className="relative min-h-20 border-r border-b p-1"
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
    const dayOfMonth = currentDate.getDate();
    const dayEvents = schedules.filter(
      (event) => dayOfMonth >= event.startDay && dayOfMonth <= event.endDay,
    );

    return (
      <div className="overflow-hidden rounded-xl border">
        <div className="border-b bg-muted/50 p-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">
              {dayNames[currentDate.getDay()]}
            </div>
            <div className="text-3xl font-bold text-primary">
              {currentDate.getDate()}
            </div>
            <div className="text-sm text-muted-foreground">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
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
              <div className="min-h-15 flex-1 p-2">
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

  return (
    <div className="space-y-4 p-3 sm:space-y-6 sm:p-6">
      <WorksheetHeaderCard
        title="Jadwal Personil"
        subtitle="Penjadwalan dan penugasan personel pengujian"
      />

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
                  <Button
                    onClick={() => setShowCreateEvent(true)}
                    className="gap-2"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Buat Jadwal</span>
                    <span className="sm:hidden">Buat</span>
                  </Button>

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
                    {monthNames[currentDate.getMonth()]}{" "}
                    {currentDate.getFullYear()}
                  </div>
                </div>
              </div>

              {calendarView === "month" && renderMonthView()}
              {calendarView === "week" && renderWeekView()}
              {calendarView === "day" && renderDayView()}
            </CardContent>
          </Card>
        </div>

        <div className="w-full shrink-0 lg:w-80">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between sm:mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                  <h3 className="text-sm font-semibold sm:text-base">
                    Personel
                  </h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 bg-transparent text-xs sm:text-sm"
                >
                  <Filter className="h-3 w-3" />
                  Filter
                </Button>
              </div>

              <ScrollArea className="h-75 sm:h-150">
                <div className="space-y-2 pr-2">
                  {personnelData.map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-muted/50 sm:gap-3"
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
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showCreateEvent} onOpenChange={setShowCreateEvent}>
        <DialogContent className="flex max-h-[90vh] max-w-lg flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Buat Jadwal Baru
            </DialogTitle>
            <DialogDescription>
              Buat jadwal pengujian baru dan tugaskan personel yang tersedia
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto py-4">
            <div className="space-y-2">
              <Label htmlFor="company">Nama Perusahaan</Label>
              <Input
                id="company"
                placeholder="Masukkan nama perusahaan"
                value={newEvent.company}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, company: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Lokasi</Label>
              <Input
                id="location"
                placeholder="Masukkan lokasi pengujian"
                value={newEvent.location}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, location: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDay">Tanggal Mulai</Label>
                <Input
                  id="startDay"
                  type="number"
                  min={1}
                  max={31}
                  value={newEvent.startDay}
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      startDay: Number.parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDay">Tanggal Selesai</Label>
                <Input
                  id="endDay"
                  type="number"
                  min={1}
                  max={31}
                  value={newEvent.endDay}
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      endDay: Number.parseInt(e.target.value) || 7,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pilih Personel (Status: Siap)</Label>
              <p className="mb-2 text-xs text-muted-foreground">
                Hanya personel dengan status "Siap" yang dapat ditugaskan
              </p>
              <ScrollArea className="h-50 rounded-lg border p-2">
                <div className="space-y-2">
                  {availablePersonnel.map((person) => (
                    <div
                      key={person.id}
                      onClick={() => togglePersonnel(person.id)}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors ${
                        newEvent.personnel.includes(person.id)
                          ? "border border-primary bg-primary/10"
                          : "border border-transparent hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        checked={newEvent.personnel.includes(person.id)}
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
                      {newEvent.personnel.includes(person.id) && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {newEvent.personnel.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {newEvent.personnel.length} personel dipilih
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCreateEvent(false)}>
              Batal
            </Button>
            <Button
              onClick={handleCreateEvent}
              disabled={
                !newEvent.company ||
                !newEvent.location ||
                newEvent.personnel.length === 0
              }
            >
              <Check className="mr-2 h-4 w-4" />
              Simpan Jadwal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                {selectedEvent?.startDay} - {selectedEvent?.endDay}{" "}
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-2 font-medium">
                <Users className="h-4 w-4 text-primary" />
                Personel Ditugaskan ({selectedEvent?.personnel.length})
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
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showWeekEvents} onOpenChange={setShowWeekEvents}>
        <DialogContent className="max-h-[80vh] max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Semua Jadwal Minggu Ini
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
                        {event.startDay} - {event.endDay}{" "}
                        {monthNames[currentDate.getMonth()]}
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
