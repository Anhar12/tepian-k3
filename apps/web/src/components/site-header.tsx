import * as React from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLocation, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
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

  return formatSegment(lastSegment);
}

export function SiteHeader() {
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch logged in profile info
  const { data: profile } = useQuery(trpc.platform.auth.profile.queryOptions());

  const pageTitle = useMemo(
    () => getPageTitle(location.pathname),
    [location.pathname],
  );

  // Extract breadcrumbs segments
  const breadcrumbs = useMemo(() => {
    const cleanPath = location.pathname.replace(/\/$/, "") || "/";
    const segments = cleanPath.split("/").filter(Boolean);
    return segments.map((seg, index) => {
      const path = "/" + segments.slice(0, index + 1).join("/");
      return {
        label: formatSegment(seg),
        path,
        isLast: index === segments.length - 1,
      };
    });
  }, [location.pathname]);

  const initials = useMemo(() => {
    if (!profile?.name) return "A";
    return profile.name
      .split(" ")
      .map((n: string) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [profile?.name]);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6 shadow-xs select-none dark:bg-zinc-950">
      {/* Left section: Toggle Sidebar and Breadcrumbs */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1 h-9 w-9 rounded-xl transition-all hover:bg-neutral-100 dark:hover:bg-zinc-900" />
        <Separator
          orientation="vertical"
          className="h-4 bg-neutral-200 dark:bg-zinc-800"
        />

        {/* Breadcrumbs Navigation */}
        <div className="hidden items-center gap-1.5 text-xs font-semibold text-muted-foreground md:flex">
          <Link
            to="/back-office"
            className="transition-colors hover:text-teal-600"
          >
            Dasbor
          </Link>
          {breadcrumbs.map((crumb) => (
            <React.Fragment key={crumb.path}>
              <span className="text-neutral-400">/</span>
              {crumb.isLast ? (
                <span className="max-w-[150px] truncate font-bold text-zinc-800 dark:text-zinc-200">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path as any}
                  className="max-w-[120px] truncate transition-colors hover:text-teal-600"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>

        <h1 className="max-w-[150px] truncate text-sm font-bold text-zinc-900 md:hidden dark:text-zinc-50">
          {pageTitle}
        </h1>
      </div>

      {/* Right section: Notifications and Profile */}
      <div className="flex items-center gap-3.5">
        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          {/* Notification Button */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-xl text-zinc-600 transition-all hover:bg-neutral-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
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
              <Button
                variant="ghost"
                className="flex h-9 items-center gap-2 rounded-xl p-1 pl-2.5 transition-all duration-200 hover:bg-neutral-100 dark:hover:bg-zinc-900"
              >
                <div className="flex hidden flex-col items-end text-right sm:flex">
                  <span className="text-xs leading-none font-bold text-zinc-800 dark:text-zinc-200">
                    {profile.name}
                  </span>
                  <span className="mt-0.5 text-[10px] leading-none font-semibold text-zinc-500 capitalize">
                    {profile.roles?.[0]?.name ?? "Admin"}
                  </span>
                </div>
                <Avatar className="h-7 w-7 shrink-0 rounded-lg ring-1 ring-neutral-200/50">
                  <AvatarImage
                    src={profile.profilePictureUrl || undefined}
                    alt={profile.name}
                  />
                  <AvatarFallback className="rounded-lg bg-teal-500/10 text-[10px] font-black text-teal-700">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="hidden h-3.5 w-3.5 shrink-0 text-zinc-400 sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="mt-1.5 w-56 rounded-xl border border-neutral-100 shadow-xl"
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
