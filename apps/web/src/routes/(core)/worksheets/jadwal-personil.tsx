import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { usePagination } from "@/lib/pagination";
import { trpc } from "@/utils/trpc";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import {
  EMPLOYEE_STATUS,
  EMPLOYEE_STATUS_COLORS,
  EMPLOYEE_STATUS_LABELS,
  type EmployeeStatus,
} from "@tepian-k3/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Loader2,
  Search,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/(core)/worksheets/jadwal-personil")({
  component: RouteComponent,
});

const routeApi = getRouteApi("/(core)/worksheets");

interface EmployeeWithSelection {
  id: string;
  name: string;
  position: string | null;
  email: string;
  status: EmployeeStatus;
  selected: boolean;
  userId: string | null;
}

function RouteComponent() {
  const { worksheetId } = routeApi.useSearch();
  const queryClient = useQueryClient();

  // Fetch worksheet data
  const {
    data: worksheet,
    isLoading: worksheetLoading,
    error: worksheetError,
  } = useQuery(trpc.worksheet.getWorksheetById.queryOptions({ worksheetId }));

  // Fetch all employees
  const { data: employeesData, isLoading: employeesLoading } = useQuery(
    trpc.employee.getAll.queryOptions(),
  );

  // Mutation for assigning employees
  const assignEmployeesMutation = useMutation(
    trpc.worksheet.assignEmployees.mutationOptions(),
  );

  // Mutation for updating supervisors
  const updateSupervisorsMutation = useMutation(
    trpc.worksheet.updateSupervisors.mutationOptions(),
  );

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(
    new Set(),
  );
  const [mainSupervisorId, setMainSupervisorId] = useState<string | null>(null);
  const [accompanyingSupervisorId, setAccompanyingSupervisorId] = useState<
    string | null
  >(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Initialize from worksheet data
  useMemo(() => {
    if (worksheet?.assignments) {
      setSelectedEmployeeIds(
        new Set(worksheet.assignments.map((a) => a.employeeId)),
      );
    }
    if (worksheet?.mainSupervisorId) {
      setMainSupervisorId(worksheet.mainSupervisorId);
    }
    if (worksheet?.accompanyingSupervisorId) {
      setAccompanyingSupervisorId(worksheet.accompanyingSupervisorId);
    }
  }, [worksheet]);

  // Transform employees data
  const employees: EmployeeWithSelection[] = useMemo(() => {
    if (!employeesData) return [];
    return employeesData.map((emp) => ({
      id: emp.id,
      name: emp.name,
      position: emp.position,
      email: emp.email,
      status: emp.status,
      userId: emp.userId,
      selected: selectedEmployeeIds.has(emp.id),
    }));
  }, [employeesData, selectedEmployeeIds]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.position?.toLowerCase().includes(searchQuery.toLowerCase()) ??
          false);
      const matchesStatus =
        statusFilter === "all" || emp.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [employees, searchQuery, statusFilter]);

  // Available employees (ready status)
  const availableEmployees = useMemo(() => {
    return employees.filter((emp) => emp.status === "siap");
  }, [employees]);

  // Pagination
  const pagination = usePagination(filteredEmployees, pageSize, page);

  // Handlers
  const handleEmployeeSelect = (employeeId: string, checked: boolean) => {
    setSelectedEmployeeIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(employeeId);
      } else {
        newSet.delete(employeeId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    const filteredIds = filteredEmployees
      .filter((emp) => emp.status === "siap")
      .map((emp) => emp.id);
    setSelectedEmployeeIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        filteredIds.forEach((id) => newSet.add(id));
      } else {
        filteredIds.forEach((id) => newSet.delete(id));
      }
      return newSet;
    });
  };

  const handleSaveAssignments = async () => {
    try {
      await assignEmployeesMutation.mutateAsync({
        worksheetId,
        employeeIds: Array.from(selectedEmployeeIds),
      });
      toast.success("Personil berhasil ditugaskan");
      queryClient.invalidateQueries({
        queryKey: [["worksheet", "getWorksheetById"]],
      });
    } catch {
      toast.error("Gagal menugaskan personil");
    }
  };

  const handleSaveSupervisors = async () => {
    try {
      await updateSupervisorsMutation.mutateAsync({
        worksheetId,
        mainSupervisorId,
        accompanyingSupervisorId,
      });
      toast.success("Supervisor berhasil diperbarui");
      queryClient.invalidateQueries({
        queryKey: [["worksheet", "getWorksheetById"]],
      });
    } catch {
      toast.error("Gagal memperbarui supervisor");
    }
  };

  const selectedCount = selectedEmployeeIds.size;
  const allAvailableSelected =
    availableEmployees.length > 0 &&
    availableEmployees
      .filter((emp) => filteredEmployees.some((f) => f.id === emp.id))
      .every((emp) => selectedEmployeeIds.has(emp.id));
  const someSelected = filteredEmployees.some((emp) =>
    selectedEmployeeIds.has(emp.id),
  );

  // Current assignments display
  const currentAssignments = useMemo(() => {
    if (!worksheet?.assignments) return [];
    return worksheet.assignments.map((a) => ({
      id: a.id,
      employeeName: a.employee?.user?.name ?? a.employee?.name ?? "Unknown",
      position: a.employee?.position ?? "Unknown",
      assignedAt: a.createdAt,
    }));
  }, [worksheet]);

  if (worksheetLoading || employeesLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (worksheetError || !worksheet) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Worksheet tidak ditemukan</p>
        <p className="text-sm text-muted-foreground">
          {worksheetError?.message ?? "Tidak dapat memuat data worksheet"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <WorksheetHeaderCard
        title="Jadwal Personil"
        subtitle="Penjadwalan dan penugasan personel pengujian"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <p className="text-2xl font-bold">{employees.length}</p>
            </div>
            <p className="text-xs text-muted-foreground">Total Personil</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <p className="text-2xl font-bold text-green-600">
                {availableEmployees.length}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Siap Bertugas</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <p className="text-2xl font-bold text-primary">{selectedCount}</p>
            </div>
            <p className="text-xs text-muted-foreground">Dipilih</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <p className="text-2xl font-bold text-blue-600">
                {currentAssignments.length}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Sudah Ditugaskan</p>
          </CardContent>
        </Card>
      </div>

      {/* Supervisor Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Supervisor Pengujian</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Supervisor Utama</label>
              <Select
                value={mainSupervisorId ?? "none"}
                onValueChange={(v) =>
                  setMainSupervisorId(v === "none" ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih supervisor utama" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada</SelectItem>
                  {employees
                    .filter((emp) => emp.status === "siap")
                    .map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} - {emp.position ?? "Unknown"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Supervisor Pendamping
              </label>
              <Select
                value={accompanyingSupervisorId ?? "none"}
                onValueChange={(v) =>
                  setAccompanyingSupervisorId(v === "none" ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih supervisor pendamping" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada</SelectItem>
                  {employees
                    .filter(
                      (emp) =>
                        emp.status === "siap" && emp.id !== mainSupervisorId,
                    )
                    .map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} - {emp.position ?? "Unknown"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSaveSupervisors}
              disabled={updateSupervisorsMutation.isPending}
              size="sm"
              className="gap-2"
            >
              {updateSupervisorsMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Simpan Supervisor
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Assignments */}
      {currentAssignments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Personil yang Sudah Ditugaskan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {currentAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                      {assignment.employeeName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {assignment.employeeName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({assignment.position})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee Selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Pilih Personil</CardTitle>
            <Button
              onClick={handleSaveAssignments}
              disabled={assignEmployeesMutation.isPending}
              className="gap-2"
            >
              {assignEmployeesMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Simpan Penugasan ({selectedCount})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari personil..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {EMPLOYEE_STATUS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {EMPLOYEE_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employee Table */}
          <div className="overflow-hidden rounded-xl border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allAvailableSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all available"
                        className={
                          someSelected && !allAvailableSelected
                            ? "data-[state=checked]:bg-primary/50"
                            : ""
                        }
                      />
                    </TableHead>
                    <TableHead className="text-xs font-semibold sm:text-sm">
                      Nama
                    </TableHead>
                    <TableHead className="hidden text-xs font-semibold sm:table-cell sm:text-sm">
                      Jabatan
                    </TableHead>
                    <TableHead className="hidden text-xs font-semibold sm:text-sm md:table-cell">
                      Email
                    </TableHead>
                    <TableHead className="text-xs font-semibold sm:text-sm">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagination.paginatedData.map((employee) => {
                    const isDisabled = employee.status !== "siap";
                    return (
                      <TableRow
                        key={employee.id}
                        className={`cursor-pointer hover:bg-muted/30 ${
                          selectedEmployeeIds.has(employee.id)
                            ? "bg-primary/5"
                            : ""
                        } ${isDisabled ? "opacity-50" : ""}`}
                        onClick={() => {
                          if (!isDisabled) {
                            handleEmployeeSelect(
                              employee.id,
                              !selectedEmployeeIds.has(employee.id),
                            );
                          }
                        }}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedEmployeeIds.has(employee.id)}
                            onCheckedChange={(checked) =>
                              handleEmployeeSelect(
                                employee.id,
                                checked as boolean,
                              )
                            }
                            disabled={isDisabled}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-muted text-xs">
                                {employee.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {employee.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-sm sm:table-cell">
                          {employee.position ?? "-"}
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          {employee.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs ${EMPLOYEE_STATUS_COLORS[employee.status]}`}
                          >
                            {EMPLOYEE_STATUS_LABELS[employee.status]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <WorksheetDataTable
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              pageSize={pageSize}
              totalItems={pagination.totalItems}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>

          {selectedCount > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              <CheckCircle2 className="mr-1 inline h-4 w-4 text-emerald-500" />
              {selectedCount} personil dipilih
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
