import * as React from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  useLocation,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useMemo } from "react";
import { trpc } from "@/utils/trpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  User,
  Shield,
  HelpCircle,
  LayoutGrid,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { logout } from "@/lib/logout";
import { BACK_OFFICE_ROLES, EMPLOYEE_ROLES } from "@tepian-k3/constants";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/stores/dashboard.stores";

function formatSegment(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getPageTitle(pathname: string): string {
  const cleanPath = pathname.replace(/\/$/, "") || "/";
  const segments = cleanPath.split("/").filter(Boolean);

  if (segments.length === 0) {
    return "Dasbor";
  }

  const lastSegment = segments[segments.length - 1];
  if (!lastSegment) {
    return "Dasbor";
  }

  if (lastSegment === "back-office" || lastSegment === "back-office/") {
    return "Dasbor Utama";
  }

  const actionWords = [
    "create",
    "edit",
    "new",
    "add",
    "update",
    "delete",
    "detail",
  ];

  if (segments.length > 2 && actionWords.includes(lastSegment.toLowerCase())) {
    const secondLast = segments[segments.length - 2];
    if (!secondLast) return formatSegment(lastSegment);

    const isSecondLastId = /^[0-9a-f-]{36}$|^\d+$/.test(secondLast);

    if (isSecondLastId) {
      const parentSegment = segments[segments.length - 3];
      if (!parentSegment) return formatSegment(lastSegment);

      const singular = parentSegment.endsWith("s")
        ? parentSegment.slice(0, -1)
        : parentSegment;
      return `${formatSegment(singular)} ${formatSegment(lastSegment)}`;
    } else {
      return `${formatSegment(secondLast)} ${formatSegment(lastSegment)}`;
    }
  }

  const isId = /^[0-9a-f-]{36}$|^\d+$/.test(lastSegment);
  if (isId && segments.length > 1) {
    const parentSegment = segments[segments.length - 2];
    if (!parentSegment) return "Detail";
    const singular = parentSegment.endsWith("s")
      ? parentSegment.slice(0, -1)
      : parentSegment;
    return `${formatSegment(singular)} Detail`;
  }

  const titleMap: Record<string, string> = {
    dashboard: "Dasbor Utama",
    "back-office": "Dasbor Backoffice",
    employee: "Portal Pegawai",
    pengujian: "Layanan Pengujian K3",
    pelatihan: "Portal Pelatihan K3",
    orders: "Pesanan K3",
    worksheets: "Lembar Kerja",
    testings: "Hasil Pengujian",
    users: "Manajemen Pengguna",
    roles: "Manajemen Peran",
    settings: "Pengaturan Akun",
  };

  return titleMap[lastSegment] || formatSegment(lastSegment);
}

export function SiteHeader() {
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch logged in profile info
  const { data: profile } = useSuspenseQuery(
    trpc.platform.auth.profile.queryOptions(),
  );

  const pageTitle = useMemo(
    () => getPageTitle(location.pathname),
    [location.pathname],
  );

  const initials = useMemo(() => {
    if (!profile?.name) return "A";
    return profile.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [profile?.name]);

  const { activeMode, setActiveMode } = useDashboardStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isOnBackOffice = pathname.startsWith("/back-office");

  React.useEffect(() => {
    if (isOnBackOffice) {
      if (
        pathname.includes("/back-office/pelatihan") ||
        pathname.includes("/back-office/order-pelatihan") ||
        pathname.includes("/back-office/absensi") ||
        pathname.includes("/back-office/sertifikat-pelatihan") ||
        pathname.includes("/back-office/landing-settings") ||
        pathname.includes("/back-office/ppid") ||
        pathname.includes("/back-office/media-publications")
      ) {
        setActiveMode("pelatihan");
      } else if (
        pathname.includes("/back-office/orders") ||
        pathname.includes("/back-office/worksheets") ||
        pathname.includes("/back-office/testings") ||
        pathname.includes("/back-office/users") ||
        pathname.includes("/back-office/positions") ||
        pathname.includes("/back-office/employees") ||
        pathname.includes("/back-office/roles") ||
        pathname.includes("/back-office/clusters") ||
        pathname.includes("/back-office/parameter-categories") ||
        pathname.includes("/back-office/parameters") ||
        pathname.includes("/back-office/tool-codes") ||
        pathname.includes("/back-office/tools") ||
        pathname.includes("/back-office/chemical-materials") ||
        pathname.includes("/back-office/kblis") ||
        pathname.includes("/back-office/survey-questions") ||
        pathname.includes("/back-office/banners") ||
        pathname.includes("/back-office/news") ||
        pathname.includes("/back-office/audits")
      ) {
        setActiveMode("pengujian");
      }
    } else {
      if (
        pathname.includes("/dashboard/pelatihan") ||
        pathname.includes("/pelatihan/transaksi")
      ) {
        setActiveMode("pelatihan");
      } else if (
        pathname.includes("/dashboard/company") ||
        pathname.includes("/pengujian")
      ) {
        setActiveMode("pengujian");
      }
    }
  }, [pathname, isOnBackOffice, setActiveMode]);

  const roleNames = profile.roles.map((role) => role.name);
  const hasUserRole = roleNames.includes("user");

  // const hasEmployeeRole =
  //   roleNames.some((name) =>
  //     (EMPLOYEE_ROLES as readonly string[]).includes(name),
  //   ) || roleNames.some((name) => name !== "user");

  // const hasBackOfficeRole =
  //   isOnBackOffice ||
  //   roleNames.some((name) =>
  //     (BACK_OFFICE_ROLES as readonly string[]).includes(name),
  //   ) ||
  //   roleNames.some((name) => name !== "user");

  const canAccessBackOffice =
    roleNames.some((name) =>
      (BACK_OFFICE_ROLES as readonly string[]).includes(name),
    ) ||
    roleNames.some((name) =>
      (EMPLOYEE_ROLES as readonly string[]).includes(name),
    ) ||
    roleNames.some((name) => name !== "user");

  return (
    <header className="sticky top-0 z-40 flex h-13 shrink-0 items-center justify-between border-b px-4 shadow-sm backdrop-blur-md transition-all duration-200 dark:border-zinc-800/80 dark:bg-zinc-950/80">
      {/* Left section: Toggle + Breadcrumbs */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 h-8 w-8 text-slate-800 hover:bg-neutral-100 hover:text-primary dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100" />
        <Separator
          orientation="vertical"
          className="h-4 bg-neutral-200 dark:bg-zinc-800"
        />
        {/* <div className="flex items-center gap-2 text-xs font-semibold">
          <Link
            to="/"
            className="text-neutral-400 transition-colors hover:text-neutral-700 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            Aplikasi
          </Link>
          <span className="text-neutral-300 dark:text-zinc-700">/</span>
          <span className="font-bold text-neutral-800 dark:text-zinc-200">
            {pageTitle}
          </span>
        </div> */}

        {hasUserRole && !isOnBackOffice && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveMode("pengujian");
                navigate({ to: "/dashboard" });
              }}
              className={cn(
                "relative flex cursor-pointer items-center justify-center gap-1.5 px-2 py-2 text-[13px] font-semibold tracking-wide transition-all duration-300",
                activeMode === "pengujian"
                  ? "text-primary"
                  : "text-slate-800 hover:bg-primary/10 hover:text-primary",
              )}
            >
              {/* <IconFlask className="size-4" /> */}
              Pengujian
              <div
                className={cn(
                  "absolute bottom-0 w-full border-b-2 border-primary",
                  activeMode === "pengujian" ? "block" : "hidden",
                )}
              ></div>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode("pelatihan");
                navigate({
                  to: "/dashboard/pelatihan",
                  search: { tab: "profil" },
                });
              }}
              className={cn(
                "relative flex cursor-pointer items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-semibold tracking-wide transition-all duration-300",
                activeMode === "pelatihan"
                  ? "text-primary"
                  : "text-slate-800 hover:bg-primary/10 hover:text-primary",
              )}
            >
              {/* <IconBook className="size-4" /> */}
              Pelatihan
              <div
                className={cn(
                  "absolute bottom-0 w-full border-b-2 border-primary",
                  activeMode === "pelatihan" ? "block" : "hidden",
                )}
              ></div>
            </button>
          </div>
        )}

        {isOnBackOffice && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveMode("pengujian");
                navigate({ to: "/back-office" });
              }}
              className={cn(
                "relative flex cursor-pointer items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-semibold tracking-wide transition-all duration-300",
                activeMode === "pengujian"
                  ? "text-primary"
                  : "text-slate-800 hover:bg-primary/10 hover:text-primary",
              )}
            >
              {/* <IconFlask className="size-4" /> */}
              Pengujian
              <div
                className={cn(
                  "absolute bottom-0 w-full border-b-2 border-primary",
                  activeMode === "pengujian" ? "block" : "hidden",
                )}
              ></div>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode("pelatihan");
                navigate({ to: "/back-office" });
              }}
              className={cn(
                "relative flex cursor-pointer items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-semibold tracking-wide transition-all duration-300",
                activeMode === "pelatihan"
                  ? "text-primary"
                  : "text-slate-800 hover:bg-primary/10 hover:text-primary",
              )}
            >
              {/* <IconBook className="size-4" /> */}
              Pelatihan
              <div
                className={cn(
                  "absolute bottom-0 w-full border-b-2 border-primary",
                  activeMode === "pelatihan" ? "block" : "hidden",
                )}
              ></div>
            </button>
          </div>
        )}
      </div>

      {/* Right section: Actions + Profile Dropdown */}
      <div className="flex items-center gap-3">
        {/* Quick Notifications Button */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 rounded-lg text-slate-800 hover:bg-primary/10 hover:text-primary dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
          >
            <Bell className="size-6" />
            <span className="absolute top-1 right-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500"></span>
            </span>
          </Button>
        </div>

        <Separator
          orientation="vertical"
          className="h-5 bg-neutral-200 dark:bg-zinc-800"
        />

        {/* User Dropdown Menu */}
        {profile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex h-10 items-center gap-4 border bg-slate-50 transition-all duration-200 hover:bg-primary/10 dark:hover:bg-zinc-900">
                <Avatar className="h-7 w-7 shrink-0 rounded-lg ring-1 ring-neutral-200/50">
                  <AvatarImage
                    src={profile.profilePictureUrl || undefined}
                    alt={profile.name}
                  />
                  <AvatarFallback className="rounded-full bg-primary text-[10px] font-black text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-end text-right sm:flex">
                  <span className="text-xs leading-none font-bold text-zinc-800 dark:text-zinc-200">
                    {profile.name}
                  </span>
                  <span className="mt-0.5 text-[10px] leading-none font-semibold text-zinc-500 capitalize">
                    {profile.roles?.[0]?.name ?? "Admin"}
                  </span>
                </div>
                <ChevronDown className="hidden h-3.5 w-3.5 shrink-0 text-slate-800 sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="mt-1.5 w-56 rounded-xl border shadow-xl"
              align="end"
            >
              <DropdownMenuLabel className="p-2 font-normal">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {profile.name}
                  </span>
                  <span className="mt-0.5 truncate text-[10px] text-zinc-500">
                    {profile.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {canAccessBackOffice && (
                  <DropdownMenuItem
                    onSelect={() => navigate({ to: "/back-office" as any })}
                  >
                    <LayoutGrid className="mr-2 h-4 w-4 text-zinc-500" />
                    <span>Backoffice</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={() => navigate({ to: "/" as any })}>
                  <User className="mr-2 h-4 w-4 text-zinc-500" />
                  <span>Profil Saya</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => navigate({ to: "/settings" as any })}
                >
                  <Settings className="mr-2 h-4 w-4 text-zinc-500" />
                  <span>Pengaturan</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Shield className="mr-2 h-4 w-4 text-zinc-500" />
                  <span>Hak Akses</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate({ to: "/" as any })}>
                <HelpCircle className="mr-2 h-4 w-4 text-zinc-500" />
                <span>Bantuan</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                className="font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
