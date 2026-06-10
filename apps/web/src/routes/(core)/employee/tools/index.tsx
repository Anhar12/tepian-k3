import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  WORKSHEET_STATUS_COLORS,
  WORKSHEET_STATUS_LABELS,
  type WorksheetStatus,
} from "@tepian-k3/constants";
import { format } from "date-fns";
import { Building2, Calendar, Settings2, Wrench } from "lucide-react";
import z from "zod";

const TOOL_RELEVANT_STATUSES = [
  "verified",
  "ready",
  "in_progress",
] as const satisfies readonly WorksheetStatus[];

type ToolRelevantStatus = (typeof TOOL_RELEVANT_STATUSES)[number];

const searchSchema = z.object({
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(100).default(10),
  status: z.enum(TOOL_RELEVANT_STATUSES).optional().default("verified"),
});

export const Route = createFileRoute("/(core)/employee/tools/")({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "worksheet-tools.update" }),
  component: RouteComponent,
  head: () => pageHead("Manajemen Alat Worksheet"),
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading } = useQuery(
    trpc.pengujian.worksheet.getWorksheetsWithAssignmentLetter.queryOptions({
      page: params.page,
      perPage: params.perPage,
      status: params.status,
    }),
  );

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
        status: status as ToolRelevantStatus,
        page: 1,
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <WorksheetHeaderCard
        title="Manajemen Alat Worksheet"
        subtitle="Pilih dan kelola alat yang digunakan untuk worksheet yang telah terverifikasi"
        actionButton={[]}
      />

      <Card>
        <CardContent className="p-4 sm:p-6">
          {/* Filter */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wrench className="h-4 w-4" />
              <span>Filter status worksheet:</span>
            </div>
            <Select value={params.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOOL_RELEVANT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {WORKSHEET_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    {/* <TableHead className="text-xs font-semibold sm:text-sm">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4" />
                        No. Testing
                      </div>
                    </TableHead> */}
                    <TableHead className="text-xs font-semibold sm:text-sm">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Perusahaan
                      </div>
                    </TableHead>
                    <TableHead className="text-xs font-semibold sm:text-sm">
                      Status
                    </TableHead>
                    <TableHead className="hidden text-xs font-semibold sm:text-sm lg:table-cell">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Tanggal Mulai
                      </div>
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold sm:text-sm">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {/* <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell> */}
                        <TableCell>
                          <Skeleton className="h-4 w-40" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="mx-auto h-8 w-28" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : !data?.data?.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-12 text-center text-muted-foreground"
                      >
                        <Wrench className="mx-auto mb-2 h-8 w-8 opacity-50" />
                        Tidak ada worksheet{" "}
                        {WORKSHEET_STATUS_LABELS[params.status]} ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.data.map((worksheet) => (
                      <TableRow
                        key={worksheet.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        {/* <TableCell className="font-mono text-xs font-medium sm:text-sm">
                          {worksheet.testing?.testingNumber ?? "-"}
                        </TableCell> */}
                        <TableCell className="text-xs sm:text-sm">
                          <div className="max-w-50 truncate">
                            {worksheet.order.company?.name ?? "-"}
                          </div>
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
                          {worksheet.startDate
                            ? format(worksheet.startDate, "dd MMM yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button asChild size="sm" variant="outline">
                            <Link
                              to="/employee/tools/$worksheetId/detail"
                              params={{ worksheetId: worksheet.id }}
                            >
                              <Settings2 className="mr-1 h-4 w-4" />
                              <span className="hidden sm:inline">
                                Kelola Alat
                              </span>
                            </Link>
                          </Button>
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
