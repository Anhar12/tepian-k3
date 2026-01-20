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
  TESTING_STATUSES,
  TESTING_STATUS_LABELS,
  type TestingStatus,
} from "@tepian-k3/constants";
import { Building2, Eye, FileText, FlaskConical, Search } from "lucide-react";
import { useState } from "react";
import z from "zod";

const searchSchema = z.object({
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(TESTING_STATUSES).optional(),
});

export const Route = createFileRoute("/(core)/back-office/testings/")({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "testing.view" }),
  component: RouteComponent,
});

const STATUS_COLORS: Record<TestingStatus, string> = {
  start_testing: "bg-blue-100 text-blue-700",
  sample_submission: "bg-indigo-100 text-indigo-700",
  sample_analysis: "bg-purple-100 text-purple-700",
  report_generation: "bg-amber-100 text-amber-700",
  report_publishing: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
};

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();
  const [searchInput, setSearchInput] = useState(params.search || "");

  const { data, isLoading } = useQuery(
    trpc.testing.getAllTestings.queryOptions({
      page: params.page,
      perPage: params.perPage,
      search: params.search,
    }),
  );

  const handleSearch = () => {
    navigate({
      search: { ...params, search: searchInput || undefined, page: 1 },
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
        status: status === "all" ? undefined : (status as TestingStatus),
        page: 1,
      },
    });
  };

  // Count by status
  const statusCounts = {
    total: data?.pagination?.totalItems ?? 0,
    start_testing: 0,
    sample_submission: 0,
    sample_analysis: 0,
    report_generation: 0,
    report_publishing: 0,
    completed: 0,
  };

  return (
    <div className="flex flex-col gap-4">
      <WorksheetHeaderCard
        title="Manajemen Testing"
        subtitle="Kelola pengujian laboratorium dan dokumen hasil testing"
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
                {TESTING_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {TESTING_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary Cards */}
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-7">
            {[
              {
                label: "Total",
                count: statusCounts.total,
                color: "bg-slate-100 text-slate-700",
              },
              {
                label: "Start",
                count: statusCounts.start_testing,
                color: STATUS_COLORS.start_testing,
              },
              {
                label: "Submission",
                count: statusCounts.sample_submission,
                color: STATUS_COLORS.sample_submission,
              },
              {
                label: "Analysis",
                count: statusCounts.sample_analysis,
                color: STATUS_COLORS.sample_analysis,
              },
              {
                label: "Report Gen",
                count: statusCounts.report_generation,
                color: STATUS_COLORS.report_generation,
              },
              {
                label: "Publishing",
                count: statusCounts.report_publishing,
                color: STATUS_COLORS.report_publishing,
              },
              {
                label: "Completed",
                count: statusCounts.completed,
                color: STATUS_COLORS.completed,
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
                        <FileText className="h-4 w-4" />
                        Order
                      </div>
                    </TableHead>
                    <TableHead className="text-xs font-semibold sm:text-sm">
                      Status
                    </TableHead>
                    <TableHead className="hidden text-xs font-semibold sm:text-sm lg:table-cell">
                      Tanggal
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
                        <FlaskConical className="mx-auto mb-2 h-8 w-8 animate-pulse" />
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : !data?.data?.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-12 text-center text-muted-foreground"
                      >
                        <FlaskConical className="mx-auto mb-2 h-8 w-8 opacity-50" />
                        Tidak ada data testing ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.data.map((testing) => (
                      <TableRow
                        key={testing.id}
                        className="cursor-pointer transition-colors hover:bg-muted/30"
                      >
                        <TableCell className="font-mono text-xs font-medium sm:text-sm">
                          {testing.testingNumber}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="max-w-50 truncate">
                            {testing.order?.company?.name || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs md:table-cell">
                          {testing.order?.orderNumber || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${STATUS_COLORS[testing.status as TestingStatus]} text-xs`}
                          >
                            {
                              TESTING_STATUS_LABELS[
                                testing.status as TestingStatus
                              ]
                            }
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                          {new Date(testing.createdAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <PermissionGate
                            permission="testing.view"
                            fallback={
                              <Badge variant="outline" className="text-xs">
                                <Eye className="mr-1 inline-block h-3 w-3" />
                                Tidak ada akses
                              </Badge>
                            }
                          >
                            <Button asChild size="sm" variant="outline">
                              <Link
                                to="/back-office/testings/$testingId/detail"
                                params={{ testingId: testing.id }}
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
