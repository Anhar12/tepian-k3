import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/theme-provider";
import { pageHead } from "@/utils/page-head";
import { trpc } from "@/utils/trpc";
import {
  EMPLOYEE_STATUS_LABELS,
  TESTING_STATUS_LABELS,
  WORKSHEET_STATUS_LABELS,
  type EmployeeStatus,
  type TestingStatus,
  type WorksheetStatus,
} from "@tepian-k3/constants";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ActivityIcon,
  CalendarCheckIcon,
  ClipboardListIcon,
  FlaskConicalIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  UsersIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/(core)/display-board/")({
  component: DisplayBoardPage,
  head: () => pageHead("Display Board"),
});

/** Auto-refresh interval for all queries (30 seconds) */
const REFRESH_INTERVAL = 30_000;

/** Active testing-phase order statuses shown in the queue */
const ACTIVE_ORDER_STATUSES = new Set([
  "pembayaran_diterima",
  "menunggu_penerbitan_spt_jadwal",
  "proses_pengambilan_sampel",
  "sampel_dalam_proses_penyerahan",
  "sampel_telah_dianalisis",
  "sampel_selesai_dianalisis",
]);

const ORDER_STATUS_LABELS: Record<string, string> = {
  pembayaran_diterima: "Pembayaran Diterima",
  menunggu_penerbitan_spt_jadwal: "Menunggu SPT",
  proses_pengambilan_sampel: "Pengambilan Sampel",
  sampel_dalam_proses_penyerahan: "Penyerahan Sampel",
  sampel_telah_dianalisis: "Analisis Selesai",
  sampel_selesai_dianalisis: "Sampel Selesai",
};

/** Semantic status colors — light and dark variants via Tailwind dark: prefix */
const EMPLOYEE_STATUS_COLORS: Record<EmployeeStatus, string> = {
  siap: "border-green-300 bg-green-100 text-green-700 dark:border-green-700 dark:bg-green-900 dark:text-green-300",
  spt: "border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-300",
  standby:
    "border-yellow-300 bg-yellow-100 text-yellow-700 dark:border-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  cuti: "border-gray-300 bg-gray-100 text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const WORKSHEET_STATUS_COLORS: Record<WorksheetStatus, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  pending_verification:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  revision:
    "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  verified: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  ready:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  in_progress:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  completed:
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const TESTING_STATUS_COLORS: Record<TestingStatus, string> = {
  start_testing:
    "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  sample_submission:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  sample_analysis:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  report_generation:
    "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  report_publishing:
    "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  completed:
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pembayaran_diterima:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  menunggu_penerbitan_spt_jadwal:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  proses_pengambilan_sampel:
    "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  sampel_dalam_proses_penyerahan:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  sampel_telah_dianalisis:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  sampel_selesai_dianalisis:
    "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Compact theme toggle button that cycles through dark → light → system.
 * Sits in the display board header.
 */
function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  const Icon =
    theme === "light" ? SunIcon : theme === "dark" ? MoonIcon : MonitorIcon;
  const label =
    theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System";

  return (
    <button
      type="button"
      onClick={cycle}
      className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      title="Ganti tema"
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

/**
 * Live digital clock that updates every second.
 */
function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-end leading-tight">
      <span className="font-mono text-2xl font-bold tabular-nums">
        {format(now, "HH:mm:ss")}
      </span>
      <span className="text-sm text-muted-foreground">
        {format(now, "EEEE, dd MMMM yyyy", { locale: localeId })}
      </span>
    </div>
  );
}

/**
 * Titled section header with an icon and optional item count badge.
 *
 * @param props.icon - Lucide icon element
 * @param props.title - Section title
 * @param props.count - Optional count shown as a badge
 */
function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
}) {
  return (
    <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
      <span className="text-muted-foreground">{icon}</span>
      <h2 className="text-base font-semibold tracking-wider text-foreground uppercase">
        {title}
      </h2>
      {count !== undefined && (
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
          {count}
        </span>
      )}
    </div>
  );
}

/**
 * Employee status panel — grid of all employees with live status badges.
 * Requires `employees.view` permission.
 */
function EmployeeStatusPanel() {
  const { data, isLoading } = useQuery({
    ...trpc.platform.employee.getAll.queryOptions(),
    refetchInterval: REFRESH_INTERVAL,
  });

  const employees = data ?? [];
  const available = employees.filter((e) => e.status === "siap").length;

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-4">
      <SectionHeader
        icon={<UsersIcon size={16} />}
        title="Status Karyawan"
        count={employees.length}
      />

      {/* Status summary row */}
      <div className="mb-3 grid grid-cols-4 gap-2 text-center text-xs">
        {[
          { status: "siap" as EmployeeStatus, label: "Siap" },
          { status: "standby" as EmployeeStatus, label: "Standby" },
          { status: "spt" as EmployeeStatus, label: "SPT" },
          { status: "cuti" as EmployeeStatus, label: "Cuti" },
        ].map(({ status, label }) => (
          <div
            key={status}
            className={`rounded-lg px-1 py-2 font-semibold ${EMPLOYEE_STATUS_COLORS[status]}`}
          >
            <div className="text-lg font-bold">
              {employees.filter((e) => e.status === status).length}
            </div>
            <div className="text-xs opacity-80">{label}</div>
          </div>
        ))}
      </div>

      {/* Scrollable employee list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : employees.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Tidak ada data karyawan
          </p>
        ) : (
          <div className="space-y-2">
            {employees.map((emp) => {
              const status = emp.status as EmployeeStatus;
              return (
                <div
                  key={emp.id}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                    EMPLOYEE_STATUS_COLORS[status] ??
                    "border-border bg-muted text-foreground"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{emp.name}</p>
                    <p className="truncate text-xs opacity-70">
                      {emp.position?.name ?? "—"}
                    </p>
                  </div>
                  <span className="ml-2 shrink-0 rounded-md px-2 py-0.5 text-xs font-bold tracking-wide uppercase opacity-90">
                    {EMPLOYEE_STATUS_LABELS[status] ?? emp.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        {available} dari {employees.length} karyawan siap
      </p>
    </div>
  );
}

/**
 * Active worksheets panel — shows worksheets currently in progress.
 * Requires `worksheets.view` permission.
 */
function ActiveWorksheetsPanel() {
  const { data, isLoading } = useQuery({
    ...trpc.pengujian.worksheet.getAllWorksheets.queryOptions({
      page: 1,
      perPage: 20,
      status: "in_progress",
    }),
    refetchInterval: REFRESH_INTERVAL,
  });

  const worksheets = data?.data ?? [];

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-4">
      <SectionHeader
        icon={<ClipboardListIcon size={16} />}
        title="Worksheet Aktif"
        count={data?.pagination?.totalItems ?? worksheets.length}
      />

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : worksheets.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Tidak ada worksheet aktif
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {worksheets.map((ws) => {
              const status = ws.status as WorksheetStatus;
              const companyName = ws.testing?.order?.company?.name;
              const supervisorName = ws.mainSupervisor?.user?.name;

              return (
                <div
                  key={ws.id}
                  className="rounded-lg border border-border bg-muted px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {companyName ?? "—"}
                      </p>
                      {supervisorName && (
                        <p className="truncate text-xs text-muted-foreground">
                          PJ: {supervisorName}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${
                        WORKSHEET_STATUS_COLORS[status] ??
                        "bg-muted text-muted-foreground"
                      }`}
                    >
                      {WORKSHEET_STATUS_LABELS[status] ?? ws.status}
                    </span>
                  </div>
                  {ws.startDate && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Mulai:{" "}
                      {format(new Date(ws.startDate), "dd MMM yyyy", {
                        locale: localeId,
                      })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Active testings panel — shows recent testings excluding completed ones.
 * Requires `testing.view` permission.
 */
function ActiveTestingsPanel() {
  const { data, isLoading } = useQuery({
    ...trpc.pengujian.testing.getAllTestings.queryOptions({
      page: 1,
      perPage: 20,
    }),
    refetchInterval: REFRESH_INTERVAL,
  });

  const testings = (data?.data ?? []).filter((t) => t.status !== "completed");

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-4">
      <SectionHeader
        icon={<FlaskConicalIcon size={16} />}
        title="Antrian Pengujian"
        count={testings.length}
      />

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : testings.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Tidak ada pengujian aktif
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {testings.map((t) => {
              const status = t.status as TestingStatus;
              return (
                <div
                  key={t.id}
                  className="rounded-lg border border-border bg-muted px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">
                        {t.testingNumber}
                      </p>
                      <p className="truncate text-sm font-semibold text-foreground">
                        {t.order?.company?.name ?? "—"}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${
                        TESTING_STATUS_COLORS[status] ??
                        "bg-muted text-muted-foreground"
                      }`}
                    >
                      {TESTING_STATUS_LABELS[status] ?? t.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(new Date(t.createdAt), "dd MMM yyyy", {
                      locale: localeId,
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Active order queue panel — shows orders in the active testing workflow phases.
 * Requires `orders.view` permission.
 */
function ActiveOrdersPanel() {
  const { data, isLoading } = useQuery({
    ...trpc.pengujian.order.getAllOrdersPaginated.queryOptions({
      page: 1,
      perPage: 50,
      search: "",
      sort: [{ id: "createdAt", desc: true }],
      createdAt: [],
      filters: [],
      joinOperator: "and",
      showDeleted: false,
    }),
    refetchInterval: REFRESH_INTERVAL,
  });

  const activeOrders = (data?.data ?? []).filter((o) =>
    ACTIVE_ORDER_STATUSES.has(o.status),
  );

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-4">
      <SectionHeader
        icon={<CalendarCheckIcon size={16} />}
        title="Antrian Order Aktif"
        count={activeOrders.length}
      />

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        {isLoading ? (
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-full min-w-45 rounded-lg" />
            ))}
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Tidak ada order aktif
            </p>
          </div>
        ) : (
          <div className="flex h-full gap-2">
            {activeOrders.map((order) => (
              <div
                key={order.id}
                className="flex min-w-47.5 flex-col justify-between rounded-lg border border-border bg-muted px-3 py-2"
              >
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {order.orderNumber}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-foreground">
                    {order.company?.name ?? "—"}
                  </p>
                </div>
                <span
                  className={`mt-2 self-start rounded-md px-2 py-0.5 text-xs font-semibold ${
                    ORDER_STATUS_COLORS[order.status] ??
                    "bg-muted text-muted-foreground"
                  }`}
                >
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

/**
 * Full-screen kiosk display board for the office front desk monitor.
 *
 * Shows four live panels that auto-refresh every 30 seconds:
 * - Employee availability status (left column)
 * - Active worksheets (top-right, left)
 * - Active testing queue (top-right, right)
 * - Active order queue (bottom-right, full width)
 *
 * Supports Light / Dark / System themes via the header toggle button.
 */
function DisplayBoardPage() {
  const [footerNow, setFooterNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setFooterNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex h-screen flex-col gap-3 p-4">
      {/* ── Header bar ── */}
      <header className="flex shrink-0 items-center justify-between rounded-xl border border-border bg-card px-5 py-3">
        <div className="flex items-center gap-3">
          <ActivityIcon className="text-green-500" size={22} />
          <div>
            <h1 className="text-lg font-bold tracking-widest text-foreground uppercase">
              Tepian K3 Laboratorium
            </h1>
            <p className="text-xs text-muted-foreground">
              Papan Informasi · Diperbarui setiap 30 detik
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <LiveClock />
        </div>
      </header>

      {/* ── Main grid ── */}
      <div className="grid min-h-0 flex-1 grid-cols-4 gap-3">
        {/* Left column — employee status (full height) */}
        <div className="col-span-1 min-h-0">
          <EmployeeStatusPanel />
        </div>

        {/* Right 3 columns — 2-row layout */}
        <div className="col-span-3 grid min-h-0 grid-rows-2 gap-3">
          {/* Top row: worksheets + testings */}
          <div className="grid min-h-0 grid-cols-2 gap-3">
            <ActiveWorksheetsPanel />
            <ActiveTestingsPanel />
          </div>

          {/* Bottom row: order queue */}
          <div className="min-h-0">
            <ActiveOrdersPanel />
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="shrink-0 text-center text-xs text-muted-foreground/60">
        {format(footerNow, "EEEE, dd MMMM yyyy", { locale: localeId })} · Tepian
        K3 Laboratorium Display Board
      </footer>
    </div>
  );
}
