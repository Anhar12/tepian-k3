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
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toWaLink } from "@/utils/wa-link";
import {
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
              <a href="#" className="flex flex-row items-center justify-start">
                <ImageWithFallback
                  src="/assets/tepian-k3.webp"
                  alt="Tepian K3 Logo"
                  className="size-6"
                />
                <span className="text-base font-semibold">Tepian K3</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="p-4">
        {isLoading ? (
          <div className="mx-auto flex flex-col gap-6">
            <div className="flex justify-center">
              <Skeleton className="size-32 rounded-lg" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ) : worksheet ? (
          <div className="mx-auto flex flex-col gap-6">
            {/* Company Picture */}
            <div className="flex justify-center">
              <div className="flex size-32 items-center justify-center rounded-lg bg-muted">
                <ImageWithFallback
                  src={getPublicUrl(company?.companyPictureUrl || "")}
                  alt="Company"
                  className="size-32 rounded-lg object-cover"
                />
              </div>
            </div>

            {/* Company Name */}
            <div className="text-center">
              <h2 className="text-lg font-semibold">
                {company?.name ?? "Unknown Company"}
              </h2>
              {worksheet.status && (
                <Badge
                  className={`mt-2 ${WORKSHEET_STATUS_COLORS[worksheet.status]}`}
                >
                  {WORKSHEET_STATUS_LABELS[worksheet.status]}
                </Badge>
              )}
            </div>

            {/* Worksheet Info */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-sm">
                <ClipboardList className="size-4 text-muted-foreground" />
                <span className="font-medium">Testing:</span>
                <span className="text-muted-foreground">
                  {testing?.testingNumber ?? "N/A"}
                </span>
              </div>
              {order?.orderNumber && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <ClipboardList className="size-4 text-muted-foreground" />
                  <span className="font-medium">Order:</span>
                  <span className="text-muted-foreground">
                    {order.orderNumber}
                  </span>
                </div>
              )}
              {worksheet.startDate && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span className="font-medium">Mulai:</span>
                  <span className="text-muted-foreground">
                    {format(worksheet.startDate, "dd MMM yyyy")}
                  </span>
                </div>
              )}
              {worksheet.endDate && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span className="font-medium">Selesai:</span>
                  <span className="text-muted-foreground">
                    {format(worksheet.endDate, "dd MMM yyyy")}
                  </span>
                </div>
              )}
            </div>

            {/* Company Details */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Detail Perusahaan
              </h3>
              {/* Address */}
              {company?.address && (
                <div className="flex gap-3">
                  <MapPin className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {company.address}
                  </span>
                </div>
              )}

              {/* Contact Person */}
              {company?.responsibleTestingPerson && (
                <div className="flex gap-3">
                  <User className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {company.responsibleTestingPerson}
                  </span>
                </div>
              )}

              {/* Contact Number */}
              {company?.responsibleTestingPersonPhone && (
                <div className="flex gap-3">
                  <PhoneCall className="size-4 shrink-0 text-muted-foreground" />
                  <a
                    href={toWaLink(company.responsibleTestingPersonPhone) ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-600 hover:underline"
                  >
                    {company.responsibleTestingPersonPhone}
                  </a>
                </div>
              )}

              {/* Contact Email */}
              {company?.responsibleTestingPersonEmail && (
                <div className="flex gap-3">
                  <Mail className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {company.responsibleTestingPersonEmail}
                  </span>
                </div>
              )}
            </div>

            {/* Supervisor Info */}
            {mainSupervisor && (
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Supervisor
                </h3>
                <div className="flex gap-3">
                  <User className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {mainSupervisor.user?.name ?? mainSupervisor.name ?? "N/A"}
                  </span>
                </div>
                {mainSupervisor.position && (
                  <div className="ml-7 text-xs text-muted-foreground">
                    {mainSupervisor.position.name}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
            <ClipboardList className="size-8" />
            <span className="text-sm">Worksheet tidak ditemukan</span>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() =>
            navigate({
              to: "/back-office/orders/$orderId/detail",
              params: { orderId: worksheet?.orderId ?? "" },
            })
          }
        >
          <Home className="size-5" />
          Kembali ke Order
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
