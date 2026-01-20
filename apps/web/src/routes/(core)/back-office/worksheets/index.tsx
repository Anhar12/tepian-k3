import { PermissionGate } from "@/components/permission-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WorksheetDataTable } from "@/components/ui/worksheet-data-table";
import { WorksheetHeaderCard } from "@/components/worksheet-header-card";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  WORKSHEET_STATUS_COLORS,
  WORKSHEET_STATUS,
  WORKSHEET_STATUS_LABELS,
  type WorksheetStatus,
} from "@tepian-k3/constants";
import { format } from "date-fns";
import {
  Building2,
  Calendar,
  ClipboardList,
  Eye,
  FlaskConical,
  Search,
  UserCheck,
} from "lucide-react";
import { useState } from "react";
import z from "zod";

const searchSchema = z.object({
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(100).default(10),
  status: z.enum(WORKSHEET_STATUS).optional(),
});

export const Route = createFileRoute("/(core)/back-office/worksheets/")({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "worksheets.view" }),
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = useQuery(
    trpc.worksheet.getAllWorksheets.queryOptions({
      page: params.page,
      perPage: params.perPage,
      status: params.status,
    }),
  );

  const handleSearch = () => {
    navigate({
      search: { ...params, page: 1 },
    });
  };

  const handlePageChange = (page: number) => {
    navigate({ search: { ...params, page } });
  };

  const handlePageSizeChange = (size: number) => {
    navigate({ search: { ...params, perPage: size, page: 1 } });
  };

  const handleStatusChange = (status: string) => {
    navigate({
      search: {
        ...params,
        status: status === "all" ? undefined : (status as WorksheetStatus),
        page: 1,
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <WorksheetHeaderCard
        title="Manajemen Worksheet"
        subtitle="Kelola worksheet pengujian laboratorium dan pelaksanaan testing"
      />

      <Card>
        <CardContent className="p-4 sm:p-6">
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nomor testing, perusahaan..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} variant="secondary">
              Cari
            </Button>
            <Select
              value={params.status || "all"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {WORKSHEET_STATUS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {WORKSHEET_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary Cards */}
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
            {[
              {
                label: "Total",
                count: data?.pagination?.totalItems ?? 0,
                color: "bg-slate-100 text-slate-700",
              },
              {
                label: "Draft",
                count: 0,
                color: WORKSHEET_STATUS_COLORS["draft"],
              },
              {
                label: "In Progress",
                count: 0,
                color: WORKSHEET_STATUS_COLORS["in_progress"],
              },
              {
                label: "Completed",
                count: 0,
                color: WORKSHEET_STATUS_COLORS["completed"],
              },
              {
                label: "Verified",
                count: 0,
                color: WORKSHEET_STATUS_COLORS["verified"],
              },
              {
                label: "Rejected",
                count: 0,
                color: WORKSHEET_STATUS_COLORS["rejected"],
              },
            ].map((stat) => (
              <Card key={stat.label} className="border-0 shadow-sm">
                <CardContent className="p-2 text-center sm:p-3">
                  <p className="text-lg font-bold sm:text-xl">{stat.count}</p>
                  <p
                    className={`rounded-full px-2 py-0.5 text-xs ${stat.color}`}
                  >
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-semibold sm:text-sm">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4" />
                        No. Testing
                      </div>
                    </TableHead>
                    <TableHead className="text-xs font-semibold sm:text-sm">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Perusahaan
                      </div>
                    </TableHead>
                    <TableHead className="hidden text-xs font-semibold sm:text-sm md:table-cell">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Supervisor
                      </div>
                    </TableHead>
                    <TableHead className="text-xs font-semibold sm:text-sm">
                      Status
                    </TableHead>
                    <TableHead className="hidden text-xs font-semibold sm:text-sm lg:table-cell">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Tanggal
                      </div>
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold sm:text-sm">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-12 text-center text-muted-foreground"
                      >
                        <ClipboardList className="mx-auto mb-2 h-8 w-8 animate-pulse" />
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : !data?.data?.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-12 text-center text-muted-foreground"
                      >
                        <ClipboardList className="mx-auto mb-2 h-8 w-8 opacity-50" />
                        Tidak ada worksheet ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.data.map((worksheet) => (
                      <TableRow
                        key={worksheet.id}
                        className="cursor-pointer transition-colors hover:bg-muted/30"
                      >
                        <TableCell className="font-mono text-xs font-medium sm:text-sm">
                          {worksheet.testing?.testingNumber || "-"}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="max-w-50 truncate">
                            {worksheet.testing?.order?.company?.name || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-xs md:table-cell">
                          {worksheet.mainSupervisor?.user?.name || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${WORKSHEET_STATUS_COLORS[worksheet.status as WorksheetStatus]} text-xs`}
                          >
                            {
                              WORKSHEET_STATUS_LABELS[
                                worksheet.status as WorksheetStatus
                              ]
                            }
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                          <div className="flex flex-col">
                            <span>
                              Mulai:{" "}
                              {worksheet.startDate
                                ? format(worksheet.startDate, "dd MMM yyyy")
                                : "-"}
                            </span>
                            {worksheet.endDate && (
                              <span>
                                Selesai:{" "}
                                {worksheet.endDate
                                  ? format(worksheet.endDate, "dd MMM yyyy")
                                  : "-"}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <PermissionGate
                            permission="worksheets.view"
                            fallback={
                              <Badge variant="outline" className="text-xs">
                                <Eye className="mr-1 inline-block h-3 w-3" />
                                Tidak ada akses
                              </Badge>
                            }
                          >
                            <Button asChild size="sm" variant="outline">
                              <Link
                                to="/worksheets"
                                search={{ worksheetId: worksheet.id }}
                              >
                                <Eye className="mr-1 h-4 w-4" />
                                <span className="hidden sm:inline">Detail</span>
                              </Link>
                            </Button>
                          </PermissionGate>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {data?.pagination && (
              <WorksheetDataTable
                currentPage={data.pagination.page}
                totalPages={data.pagination.totalPages}
                pageSize={params.perPage}
                totalItems={data.pagination.totalItems ?? 0}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
