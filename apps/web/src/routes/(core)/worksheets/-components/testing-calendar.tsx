import { useState } from "react";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { Building2, Calendar as CalendarIcon, MapPin, ExternalLink } from "lucide-react";
import { WORKSHEET_STATUS_COLORS, WORKSHEET_STATUS_LABELS, type WorksheetStatus } from "@tepian-k3/constants";

const locales = { id };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

/**
 * Generates a deterministic pastel HSL color string based on company name.
 */
function getCompanyColor(companyName: string): string {
  let hash = 0;
  for (let i = 0; i < companyName.length; i++) {
    hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 45%)`;
}

interface TestingCalendarProps {
  worksheets: any[];
}

export function TestingCalendar({ worksheets }: TestingCalendarProps) {
  const [selectedWorksheet, setSelectedWorksheet] = useState<any>(null);

  // Map worksheets to calendar events
  const events = worksheets
    .filter((ws) => ws.startDate && ws.endDate)
    .map((ws) => {
      const companyName = ws.order?.company?.name || ws.companyName || "Perusahaan";
      return {
        id: ws.id,
        title: `${companyName} (${ws.worksheetNumber || "WS"})`,
        start: new Date(ws.startDate),
        end: new Date(ws.endDate),
        resource: ws,
        color: getCompanyColor(companyName),
      };
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 650 }}
          culture="id"
          onSelectEvent={(event: any) => setSelectedWorksheet(event.resource)}
          eventPropGetter={(event: any) => ({
            style: {
              backgroundColor: event.color,
              borderRadius: "6px",
              color: "#ffffff",
              border: "none",
              fontSize: "12px",
              padding: "2px 6px",
            },
          })}
          messages={{
            next: "Berikutnya",
            previous: "Sebelumnya",
            today: "Hari Ini",
            month: "Bulan",
            week: "Minggu",
            day: "Hari",
            agenda: "Agenda",
            noEventsInRange: "Tidak ada jadwal pengujian pada rentang ini.",
          }}
        />
      </div>

      {/* Event Detail Dialog */}
      <Dialog
        open={!!selectedWorksheet}
        onOpenChange={(open) => !open && setSelectedWorksheet(null)}
      >
        {selectedWorksheet && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    WORKSHEET_STATUS_COLORS[
                      selectedWorksheet.status as WorksheetStatus
                    ] || "bg-slate-100 text-slate-700"
                  }
                >
                  {WORKSHEET_STATUS_LABELS[
                    selectedWorksheet.status as WorksheetStatus
                  ] || selectedWorksheet.status}
                </Badge>
              </div>
              <DialogTitle className="mt-2 text-lg font-bold text-slate-900">
                {selectedWorksheet.order?.company?.name || "Detail Pengujian"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Nomor Worksheet: {selectedWorksheet.worksheetNumber || "-"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  <strong>Jadwal:</strong>{" "}
                  {format(new Date(selectedWorksheet.startDate), "dd MMM yyyy", { locale: id })}{" "}
                  s/d{" "}
                  {format(new Date(selectedWorksheet.endDate), "dd MMM yyyy", { locale: id })}
                </span>
              </div>

              {selectedWorksheet.testingLocation && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Lokasi:</strong> {selectedWorksheet.testingLocation.name} (
                    {selectedWorksheet.testingLocation.district?.name},{" "}
                    {selectedWorksheet.testingLocation.regency?.name})
                  </span>
                </div>
              )}
            </div>

            <DialogFooter className="sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setSelectedWorksheet(null)}
              >
                Tutup
              </Button>
              <Button asChild>
                <Link
                  to="/worksheets/detail-transaksi"
                  search={{ worksheetId: selectedWorksheet.id }}
                >
                  Lihat Detail Worksheet
                  <ExternalLink className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
