import type { WorksheetWithCertificates } from "@tepian-k3/types/pengujian/worksheet.types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPublicUrl } from "@/utils/url";
import { addYears, differenceInDays, format, isPast } from "date-fns";
import { Download, Wrench } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Computes employee certification status based on expiry date.
 *
 * @param expiryDate - ISO date string or null if no expiry.
 * @returns "active" | "expiring" | "expired"
 */
function getCertStatus(
  expiryDate: string | null,
): "active" | "expiring" | "expired" {
  if (!expiryDate) return "active";
  const expiry = new Date(expiryDate);
  if (isPast(expiry)) return "expired";
  if (differenceInDays(expiry, new Date()) <= 90) return "expiring";
  return "active";
}

/**
 * Computes tool calibration status based on calibration date,
 * assuming a 1-year calibration cycle.
 *
 * @param calibrationDate - ISO date string of the last calibration.
 * @returns "active" | "expiring" | "expired"
 */
function getCalibrationStatus(
  calibrationDate: string,
): "active" | "expiring" | "expired" {
  const next = addYears(new Date(calibrationDate), 1);
  if (isPast(next)) return "expired";
  if (differenceInDays(next, new Date()) <= 90) return "expiring";
  return "active";
}

/**
 * Formats an ISO date string to a human-readable Indonesian date.
 *
 * @param dateStr - ISO date string.
 * @returns Formatted date string, e.g. "15 Mar 2025"
 */
function formatDate(dateStr: string): string {
  return format(new Date(dateStr), "dd MMM yyyy");
}

/**
 * Derives up-to-two uppercase initials from a full name.
 *
 * @param name - Full name string.
 * @returns Initials string, e.g. "AP"
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const statusConfig = {
  active: {
    label: "Aktif",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  expired: {
    label: "Kadaluarsa",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  expiring: {
    label: "Akan Habis",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
} as const;

const avatarColors = [
  "bg-blue-600",
  "bg-violet-600",
  "bg-teal-600",
  "bg-orange-600",
  "bg-pink-600",
];

// ─── Status Badge ─────────────────────────────────────────────────────────────

/**
 * Renders a colored badge for certification/calibration status.
 *
 * @param props - Component props
 * @param props.status - The status key: "active" | "expiring" | "expired"
 */
function StatusBadge({
  status,
}: {
  status: "active" | "expiring" | "expired";
}) {
  const cfg = statusConfig[status];
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}

// ─── Employee Certifications Tab ──────────────────────────────────────────────

type Assignment = WorksheetWithCertificates["assignments"][number];

/**
 * Renders the employee competency certifications tab.
 *
 * @param props - Component props
 * @param props.assignments - Array of worksheet assignments with employee and certifications.
 */
function TabKaryawan({ assignments }: { assignments: Assignment[] }) {
  if (assignments.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Belum ada personel yang ditugaskan.
      </p>
    );
  }

  return (
    <Accordion type="single" collapsible className="space-y-3">
      {assignments.map(({ employee }, index) => (
        <AccordionItem
          key={employee.id}
          value={employee.id}
          className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
        >
          <AccordionTrigger className="flex items-center gap-3 px-4 py-3.5 hover:no-underline [&>svg]:hidden">
            <Avatar
              className={`h-10 w-10 shrink-0 rounded-xl ${avatarColors[index % avatarColors.length]}`}
            >
              <AvatarFallback
                className={`rounded-xl text-xs font-bold text-white ${avatarColors[index % avatarColors.length]}`}
              >
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold">{employee.name}</p>
              <p className="text-xs text-muted-foreground">
                {employee.type} · {employee.certifications.length} sertifikat
              </p>
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-0 pb-0">
            <div className="space-y-2 border-t bg-muted/30 px-4 py-3">
              {employee.certifications.length === 0 ? (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  Tidak ada sertifikat.
                </p>
              ) : (
                employee.certifications.map((cert) => {
                  const status = getCertStatus(cert.expiryDate);
                  return (
                    <div
                      key={cert.id}
                      className="rounded-xl border border-border bg-background p-3"
                    >
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold">
                          {cert.certificationName}
                        </p>
                        <StatusBadge status={status} />
                      </div>
                      <p className="mb-2 text-xs text-muted-foreground">
                        {cert.issuedBy}
                      </p>
                      <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
                        <span>
                          Terbit:{" "}
                          <span className="text-foreground">
                            {formatDate(cert.issueDate)}
                          </span>
                        </span>
                        {cert.expiryDate && (
                          <span>
                            Exp:{" "}
                            <span className="text-foreground">
                              {formatDate(cert.expiryDate)}
                            </span>
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                        onClick={() =>
                          window.open(
                            getPublicUrl(cert.certificate_fileUrl),
                            "_blank",
                          )
                        }
                      >
                        <Download className="h-3.5 w-3.5" />
                        Unduh Sertifikat
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

// ─── Tool Calibration Tab ─────────────────────────────────────────────────────

type WorksheetTool = WorksheetWithCertificates["tools"][number];

/**
 * Renders the tool calibration certificates tab.
 *
 * @param props - Component props
 * @param props.tools - Array of worksheet tools with tool details and latest calibration.
 */
function TabAlat({ tools }: { tools: WorksheetTool[] }) {
  if (tools.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Belum ada alat yang digunakan.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {tools.map(({ tool }) => {
        const latestCalibration = tool.calibrations[0];
        const status = latestCalibration
          ? getCalibrationStatus(latestCalibration.calibrationDate)
          : "expired";
        const certFileUrl =
          latestCalibration?.certificate?.certificateFileUrl ?? null;

        return (
          <div
            key={tool.id}
            className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
          >
            {/* Tool header */}
            <div className="flex items-center gap-3 border-b bg-background px-4 py-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Wrench className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{tool.toolName}</p>
                <p className="text-xs text-muted-foreground">
                  {[
                    tool.brand,
                    tool.serialNumber ? `SN: ${tool.serialNumber}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <StatusBadge status={status} />
            </div>

            {/* Calibration detail */}
            <div className="bg-muted/30 px-4 py-3">
              {latestCalibration ? (
                <>
                  <div className="mb-3 space-y-1.5 text-xs">
                    {(
                      [
                        [
                          "Tgl. Kalibrasi",
                          formatDate(latestCalibration.calibrationDate),
                        ],
                        latestCalibration.note
                          ? ["Catatan", latestCalibration.note]
                          : null,
                      ] as ([string, string] | null)[]
                    )
                      .filter((item): item is [string, string] => item !== null)
                      .map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-2">
                          <span className="shrink-0 text-muted-foreground">
                            {label}
                          </span>
                          <span className="text-right text-foreground">
                            {value}
                          </span>
                        </div>
                      ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                    disabled={!certFileUrl}
                    onClick={() => {
                      if (certFileUrl) {
                        window.open(getPublicUrl(certFileUrl), "_blank");
                      }
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Unduh Sertifikat Kalibrasi
                  </Button>
                </>
              ) : (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  Belum ada data kalibrasi.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

/**
 * Skeleton loader shown while certificate data is being fetched.
 */
function SertifikasiSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items have no real keys
          key={i}
          className="rounded-2xl border border-border bg-background p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface SertifikasiComponentProps {
  /** Fetched worksheet data; undefined while loading. */
  worksheet: WorksheetWithCertificates | undefined;
  /** Whether the data query is in-flight. */
  isLoading: boolean;
}

/**
 * Displays employee competency certifications and tool calibration certificates
 * for a given worksheet, split into two tabs.
 *
 * @param props - Component props
 * @param props.worksheet - The worksheet with certification data to display.
 * @param props.isLoading - Whether the data is still loading.
 */
export default function SertifikasiComponent({
  worksheet,
  isLoading,
}: SertifikasiComponentProps) {
  return (
    <div className="min-h-screen bg-muted/20 p-4 sm:p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground">Sertifikasi</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Sertifikat kompetensi karyawan &amp; kalibrasi alat
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="karyawan">
          <TabsList className="w-full rounded-2xl bg-muted p-1">
            <TabsTrigger value="karyawan" className="flex-1 rounded-xl">
              Kompetensi Karyawan
            </TabsTrigger>
            <TabsTrigger value="alat" className="flex-1 rounded-xl">
              Kalibrasi Alat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="karyawan" className="mt-4">
            {isLoading ? (
              <SertifikasiSkeleton />
            ) : (
              <TabKaryawan assignments={worksheet?.assignments ?? []} />
            )}
          </TabsContent>

          <TabsContent value="alat" className="mt-4">
            {isLoading ? (
              <SertifikasiSkeleton />
            ) : (
              <TabAlat tools={worksheet?.tools ?? []} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
