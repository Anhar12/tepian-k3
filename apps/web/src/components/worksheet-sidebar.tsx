import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { toWaLink } from "@/utils/wa-link";
import {
  Building2,
  Calendar,
  ClipboardList,
  Home,
  Mail,
  MapPin,
  PhoneCall,
  User,
} from "lucide-react";
import { Button } from "./ui/button";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import {
  WORKSHEET_STATUS_COLORS,
  WORKSHEET_STATUS_LABELS,
} from "@tepian-k3/constants";
import { getPublicUrl } from "@/utils/url";
import { format } from "date-fns";
import ImageWithFallback from "./image-with-fallback";
import { Skeleton } from "@/components/ui/skeleton";

const routeApi = getRouteApi("/(core)/worksheets");

export function WorksheetSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate();
  const { worksheetId } = routeApi.useSearch();

  const { data: worksheet, isLoading } = useQuery(
    trpc.pengujian.worksheet.getWorksheetById.queryOptions({ worksheetId }),
  );

  const company = worksheet?.order?.company;
  const testing = worksheet?.testing ?? null;
  const order = worksheet?.order;
  const mainSupervisor = worksheet?.mainSupervisor;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a
                href="#"
                className="flex flex-row items-center justify-start gap-2 text-white"
              >
                <ImageWithFallback
                  src="/assets/tepian-k3.webp"
                  alt="Tepian K3 Logo"
                  className="size-6"
                />
                <span className="text-base font-bold tracking-tight text-white">
                  Tepian K3
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="p-4">
        {isLoading ? (
          <div className="mx-auto flex flex-col gap-6">
            <div className="flex justify-center">
              <Skeleton className="size-32 rounded-xl bg-white/20" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-5 w-40 bg-white/20" />
              <Skeleton className="h-5 w-20 rounded-full bg-white/20" />
            </div>
            <div className="space-y-2 rounded-xl border border-white/20 bg-white/10 p-4">
              <Skeleton className="h-4 w-full bg-white/20" />
              <Skeleton className="h-4 w-full bg-white/20" />
              <Skeleton className="h-4 w-3/4 bg-white/20" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-28 bg-white/20" />
              <Skeleton className="h-4 w-full bg-white/20" />
              <Skeleton className="h-4 w-full bg-white/20" />
              <Skeleton className="h-4 w-3/4 bg-white/20" />
            </div>
          </div>
        ) : worksheet ? (
          <div className="mx-auto flex w-full flex-col gap-6">
            {/* Company Picture */}
            <div className="flex justify-center">
              <div className="flex size-32 items-center justify-center rounded-2xl bg-white/10 p-1 shadow-inner ring-1 ring-white/20">
                <ImageWithFallback
                  src={getPublicUrl(company?.companyPictureUrl || "")}
                  alt="Company"
                  className="size-30 rounded-xl object-cover"
                />
              </div>
            </div>

            {/* Company Name */}
            <div className="text-center">
              <h2 className="text-lg leading-snug font-bold tracking-tight text-white drop-shadow-xs">
                {company?.name ?? "Unknown Company"}
              </h2>
              {worksheet.status && (
                <Badge
                  className={`mt-2 font-bold shadow-xs ${WORKSHEET_STATUS_COLORS[worksheet.status]}`}
                >
                  {WORKSHEET_STATUS_LABELS[worksheet.status]}
                </Badge>
              )}
            </div>

            {/* Worksheet Info - High Contrast Box */}
            <div className="space-y-2.5 rounded-xl border border-white/25 bg-white/10 p-3.5 shadow-xs backdrop-blur-xs">
              <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                <div className="flex min-w-0 items-center gap-1.5">
                  <ClipboardList className="size-4 shrink-0 text-sky-300" />
                  <span className="font-semibold text-white/90">Testing:</span>
                </div>
                <span className="truncate rounded border border-white/10 bg-white/15 px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-sky-200">
                  {testing?.testingNumber ?? "N/A"}
                </span>
              </div>
              {order?.orderNumber && (
                <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <ClipboardList className="size-4 shrink-0 text-sky-300" />
                    <span className="font-semibold text-white/90">Order:</span>
                  </div>
                  <span className="truncate rounded border border-white/10 bg-white/15 px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-sky-200">
                    {order.orderNumber}
                  </span>
                </div>
              )}
              {worksheet.startDate && (
                <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Calendar className="size-4 shrink-0 text-sky-300" />
                    <span className="font-semibold text-white/90">Mulai:</span>
                  </div>
                  <span className="text-xs font-medium text-white">
                    {format(worksheet.startDate, "dd MMM yyyy")}
                  </span>
                </div>
              )}
              {worksheet.endDate && (
                <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Calendar className="size-4 shrink-0 text-sky-300" />
                    <span className="font-semibold text-white/90">
                      Selesai:
                    </span>
                  </div>
                  <span className="text-xs font-medium text-white">
                    {format(worksheet.endDate, "dd MMM yyyy")}
                  </span>
                </div>
              )}
            </div>

            {/* Company Details */}
            <div className="flex flex-col gap-3">
              <h3 className="flex items-center gap-1.5 border-b border-white/20 pb-1.5 text-xs font-bold tracking-wider text-sky-200 uppercase">
                <Building2 className="size-3.5 text-sky-300" />
                Detail Perusahaan
              </h3>

              {/* Address */}
              {company?.address && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-sky-300" />
                  <span className="text-sm leading-snug font-medium text-white/95">
                    {company.address}
                  </span>
                </div>
              )}

              {/* Contact Person */}
              {company?.responsibleTestingPerson && (
                <div className="flex items-center gap-2.5">
                  <User className="size-4 shrink-0 text-sky-300" />
                  <span className="text-sm font-medium text-white/95">
                    {company.responsibleTestingPerson}
                  </span>
                </div>
              )}

              {/* Contact Number - Highlighted Link */}
              {company?.responsibleTestingPersonPhone && (
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="size-4 shrink-0 text-emerald-300" />
                  <a
                    href={
                      toWaLink(company.responsibleTestingPersonPhone) ?? "#"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-emerald-400/40 bg-emerald-950/40 px-2.5 py-1 text-sm font-bold text-emerald-200 transition-colors hover:bg-emerald-900/60 hover:underline"
                  >
                    {company.responsibleTestingPersonPhone}
                  </a>
                </div>
              )}

              {/* Contact Email */}
              {company?.responsibleTestingPersonEmail && (
                <div className="flex items-center gap-2.5">
                  <Mail className="size-4 shrink-0 text-sky-300" />
                  <span className="text-sm font-medium break-all text-sky-100">
                    {company.responsibleTestingPersonEmail}
                  </span>
                </div>
              )}
            </div>

            {/* Supervisor Info */}
            {mainSupervisor && (
              <div className="flex flex-col gap-3">
                <h3 className="flex items-center gap-1.5 border-b border-white/20 pb-1.5 text-xs font-bold tracking-wider text-sky-200 uppercase">
                  <User className="size-3.5 text-sky-300" />
                  Supervisor
                </h3>
                <div className="flex items-center gap-2.5">
                  <User className="size-4 shrink-0 text-sky-300" />
                  <span className="text-sm font-medium text-white/95">
                    {mainSupervisor.user?.name ?? mainSupervisor.name ?? "N/A"}
                  </span>
                </div>
                {mainSupervisor.position && (
                  <div className="ml-6.5 w-fit rounded border border-white/10 bg-white/10 px-2 py-0.5 text-xs font-medium text-sky-200">
                    {mainSupervisor.position.name}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-white/70">
            <ClipboardList className="size-8 text-sky-300" />
            <span className="text-sm font-semibold">
              Worksheet tidak ditemukan
            </span>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter>
        <Button
          className="h-10 w-full rounded-xl bg-white font-bold text-blue-950 shadow-md transition-all hover:bg-blue-50 active:scale-[0.98]"
          onClick={() =>
            navigate({
              to: "/back-office/orders/$orderId/detail",
              params: { orderId: worksheet?.orderId ?? "" },
            })
          }
        >
          <Home className="mr-1.5 size-4.5 text-blue-700" />
          Kembali ke Order
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
