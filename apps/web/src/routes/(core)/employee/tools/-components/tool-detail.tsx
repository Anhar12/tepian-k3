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
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WorksheetDataTable } from "@/components/ui/worksheet-data-table";
import { WorksheetHeaderCardSkeleton } from "@/components/worksheet-header-card";
import { PermissionGate } from "@/components/permission-gate";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  TOOLS_AVAILABILITY,
  TOOLS_AVAILABILITY_LABELS,
  TOOLS_CONDITIONS,
  TOOLS_CONDITIONS_LABELS,
} from "@tepian-k3/constants";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
interface ToolDetailProps {
  worksheetId: string;
}

export default function ToolDetail({ worksheetId }: ToolDetailProps) {
  const queryClient = useQueryClient();

  // Pagination & filter state for tools table
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [toolSearch, setToolSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [showGuide, setShowGuide] = useState(true);

  // Selection state
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(
    new Set(),
  );

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(toolSearch);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [toolSearch]);

  // Worksheet data
  const { data: worksheet, isLoading: isLoadingWorksheet } = useQuery(
    trpc.pengujian.worksheet.getWorksheetById.queryOptions({ worksheetId }),
  );

  // Guide: tools required per parameter (from parameterTools relationship).
  // This is the only source for the tools table — we show only the tools that
  // appear in "Panduan Alat yang Diperlukan", not the full inventory.
  const { data: guideToolsData, isLoading: isLoadingGuide } = useQuery(
    trpc.pengujian.tool.getForWorksheet.queryOptions({ worksheetId }),
  );

  // Pre-populate selections from existing worksheet tool assignments
  useMemo(() => {
    if (worksheet?.tools) {
      const toolIdSet = new Set<string>();
      for (const t of worksheet.tools) {
        toolIdSet.add(t.toolId);
      }
      setSelectedToolIds(toolIdSet);
    }
  }, [worksheet?.tools]);

  // Build guide map: toolId -> { parameterIds, parameterNames, plannedToolNeeded }
  const guideByToolId = useMemo(() => {
    const map = new Map<
      string,
      {
        parameterIds: string[];
        parameterNames: string[];
        toolNeeded: number;
      }
    >();
    if (!guideToolsData) return map;
    for (const t of guideToolsData) {
      const existing = map.get(t.id);
      if (existing) {
        existing.parameterIds.push(t.parameterId);
        existing.parameterNames.push(t.parameterName);
        if (
          t.plannedToolNeeded != null &&
          t.plannedToolNeeded > existing.toolNeeded
        ) {
          existing.toolNeeded = t.plannedToolNeeded;
        }
      } else {
        map.set(t.id, {
          parameterIds: [t.parameterId],
          parameterNames: [t.parameterName],
          toolNeeded: t.plannedToolNeeded ?? 0,
        });
      }
    }
    return map;
  }, [guideToolsData]);

  // Build guide sections grouped by parameter (for the guide panel)
  const guideByParameter = useMemo(() => {
    const map = new Map<
      string,
      {
        parameterName: string;
        tools: { toolId: string; toolName: string; toolNeeded: number }[];
      }
    >();
    if (!guideToolsData) return map;
    for (const t of guideToolsData) {
      const existing = map.get(t.parameterId);
      if (existing) {
        existing.tools.push({
          toolId: t.id,
          toolName: t.toolName,
          toolNeeded: t.plannedToolNeeded ?? 0,
        });
      } else {
        map.set(t.parameterId, {
          parameterName: t.parameterName,
          tools: [
            {
              toolId: t.id,
              toolName: t.toolName,
              toolNeeded: t.plannedToolNeeded ?? 0,
            },
          ],
        });
      }
    }
    return map;
  }, [guideToolsData]);

  // Deduplicate the per-(tool, parameter) guide rows into one entry per tool,
  // keeping the full tool fields and aggregating the related parameter names.
  const guideTools = useMemo(() => {
    if (!guideToolsData) return [];
    const map = new Map<
      string,
      (typeof guideToolsData)[number] & { parameterNames: string[] }
    >();
    for (const t of guideToolsData) {
      const existing = map.get(t.id);
      if (existing) {
        if (!existing.parameterNames.includes(t.parameterName)) {
          existing.parameterNames.push(t.parameterName);
        }
      } else {
        map.set(t.id, { ...t, parameterNames: [t.parameterName] });
      }
    }
    return Array.from(map.values());
  }, [guideToolsData]);

  // Apply client-side search + condition/availability filters to the guide tools
  const filteredGuideTools = useMemo(() => {
    const search = debouncedSearch.trim().toLowerCase();
    return guideTools.filter((tool) => {
      const matchesSearch =
        search === "" || tool.toolName.toLowerCase().includes(search);
      const matchesCondition =
        conditionFilter === "all" || tool.condition === conditionFilter;
      const matchesAvailability =
        availabilityFilter === "all" ||
        tool.availability === availabilityFilter;
      return matchesSearch && matchesCondition && matchesAvailability;
    });
  }, [guideTools, debouncedSearch, conditionFilter, availabilityFilter]);

  // Client-side pagination over the filtered guide tools
  const pageCount = Math.max(1, Math.ceil(filteredGuideTools.length / perPage));
  const displayedTools = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredGuideTools.slice(start, start + perPage);
  }, [filteredGuideTools, page, perPage]);

  // Borrowing is per physical unit, so the planned "× N" quantity is satisfied
  // by selecting N distinct units of the same tool type. Track needed vs.
  // selected grouped by tool name (across all pages, not just the current one).
  const progressByToolName = useMemo(() => {
    const map = new Map<string, { needed: number; selected: number }>();
    for (const t of guideTools) {
      const entry = map.get(t.toolName) ?? { needed: 0, selected: 0 };
      entry.needed = Math.max(entry.needed, t.plannedToolNeeded ?? 0);
      if (selectedToolIds.has(t.id)) entry.selected += 1;
      map.set(t.toolName, entry);
    }
    return map;
  }, [guideTools, selectedToolIds]);

  const selectedToolsCount = selectedToolIds.size;
  const allDisplayedSelected =
    displayedTools.length > 0 &&
    displayedTools.every((t) => selectedToolIds.has(t.id));
  const someDisplayedSelected = displayedTools.some((t) =>
    selectedToolIds.has(t.id),
  );

  const borrowToolsMutation = useMutation(
    trpc.pengujian.worksheet.borrowTools.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.worksheet.getWorksheetById.queryOptions({
            worksheetId,
          }),
        );
        await queryClient.invalidateQueries(
          trpc.pengujian.tool.getForWorksheet.queryOptions({ worksheetId }),
        );
        globalSuccessToast("Alat berhasil dipinjam");
      },
      onError: (error) => {
        globalErrorToast("Gagal meminjam alat: " + error.message);
      },
    }),
  );

  const handleToolSelect = (toolId: string, checked: boolean) => {
    setSelectedToolIds((prev) => {
      const newSet = new Set(prev);
      if (checked) newSet.add(toolId);
      else newSet.delete(toolId);
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedToolIds((prev) => {
      const newSet = new Set(prev);
      displayedTools.forEach((tool) => {
        if (checked) newSet.add(tool.id);
        else newSet.delete(tool.id);
      });
      return newSet;
    });
  };

  const handleSaveTools = () => {
    if (selectedToolIds.size === 0) return;
    const items = Array.from(selectedToolIds)
      .map((toolId) => ({
        itemId: toolId,
        parameterId: guideByToolId.get(toolId)?.parameterIds ?? [],
      }))
      .filter((item) => item.parameterId.length > 0);
    if (items.length === 0) {
      globalErrorToast("Pastikan alat yang dipilih terkait parameter");
      return;
    }
    borrowToolsMutation.mutate({ worksheetId, items });
  };

  if (isLoadingWorksheet) {
    return (
      <div className="flex flex-col gap-4">
        <WorksheetHeaderCardSkeleton />
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          className="cursor-pointer pb-3 select-none"
          onClick={() => setShowGuide((v) => !v)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              Panduan Alat yang Diperlukan
              <Badge variant="outline" className="text-xs">
                {guideByParameter.size} Parameter
              </Badge>
            </CardTitle>
            {showGuide ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {showGuide && (
          <CardContent className="pt-0">
            {isLoadingGuide ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : guideByParameter.size === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tidak ada alat yang diperlukan untuk worksheet ini.
              </p>
            ) : (
              <div className="space-y-3">
                {Array.from(guideByParameter.entries()).map(
                  ([parameterId, { parameterName, tools }]) => (
                    <div key={parameterId}>
                      <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        {parameterName}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {tools.map((tool) => (
                          <Badge
                            key={tool.toolId}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tool.toolName}
                            {tool.toolNeeded > 0 && (
                              <span className="ml-1 text-muted-foreground">
                                × {tool.toolNeeded}
                              </span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Tools Selection */}
      <Card>
        <CardContent className="p-3 pt-4 sm:p-4 sm:pt-6">
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama alat..."
                value={toolSearch}
                onChange={(e) => setToolSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={conditionFilter}
              onValueChange={(v) => {
                setConditionFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Kondisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kondisi</SelectItem>
                {TOOLS_CONDITIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {TOOLS_CONDITIONS_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={availabilityFilter}
              onValueChange={(v) => {
                setAvailabilityFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Ketersediaan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {TOOLS_AVAILABILITY.map((a) => (
                  <SelectItem key={a} value={a}>
                    {TOOLS_AVAILABILITY_LABELS[a]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Save Button + Selected Count */}
          <PermissionGate permission="worksheet-tools.update">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedToolsCount > 0 && (
                  <>
                    <CheckCircle2 className="mr-1 inline h-4 w-4 text-emerald-500" />
                    {selectedToolsCount} alat dipilih
                  </>
                )}
              </p>
              <Button
                onClick={handleSaveTools}
                disabled={
                  borrowToolsMutation.isPending || selectedToolIds.size === 0
                }
                className="gap-2"
              >
                {borrowToolsMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Pinjam ({selectedToolsCount})
              </Button>
            </div>
          </PermissionGate>

          {/* Tools Table */}
          <div className="overflow-hidden rounded-xl border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">
                      <PermissionGate permission="worksheet-tools.update">
                        <Checkbox
                          checked={allDisplayedSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                          className={
                            someDisplayedSelected && !allDisplayedSelected
                              ? "data-[state=checked]:bg-primary/50"
                              : ""
                          }
                        />
                      </PermissionGate>
                    </TableHead>
                    <TableHead className="text-xs font-semibold sm:text-sm">
                      Kode
                    </TableHead>
                    <TableHead className="text-xs font-semibold sm:text-sm">
                      Nama Alat
                    </TableHead>
                    <TableHead className="text-xs font-semibold sm:text-sm">
                      Dibutuhkan
                    </TableHead>
                    <TableHead className="text-xs font-semibold sm:text-sm">
                      Lokasi Alat
                    </TableHead>
                    <TableHead className="text-xs font-semibold sm:text-sm">
                      Rak Alat
                    </TableHead>
                    <TableHead className="text-xs font-semibold sm:text-sm">
                      Kondisi
                    </TableHead>
                    <TableHead className="text-xs font-semibold sm:text-sm">
                      Ketersediaan
                    </TableHead>
                    <TableHead className="text-xs font-semibold sm:text-sm">
                      Terkait Parameter
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingGuide ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 9 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : displayedTools.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="py-12 text-center text-muted-foreground"
                      >
                        <Wrench className="mx-auto mb-2 h-8 w-8 opacity-50" />
                        Tidak ada alat ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedTools.map((tool) => {
                      const isSelected = selectedToolIds.has(tool.id);
                      return (
                        <TableRow
                          key={tool.id}
                          className={`cursor-pointer hover:bg-muted/30 ${
                            isSelected ? "bg-primary/5" : ""
                          }`}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <PermissionGate
                              permission="worksheet-tools.update"
                              fallback={
                                isSelected ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                ) : (
                                  <div className="h-5 w-5" />
                                )
                              }
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  handleToolSelect(tool.id, checked as boolean)
                                }
                              />
                            </PermissionGate>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {tool.toolCode?.code ?? "N/A"}
                          </TableCell>
                          <TableCell className="text-xs font-medium sm:text-sm">
                            {tool.toolName}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const progress = progressByToolName.get(
                                tool.toolName,
                              );
                              const needed = progress?.needed ?? 0;
                              if (needed <= 0) {
                                return (
                                  <span className="text-xs text-muted-foreground">
                                    —
                                  </span>
                                );
                              }
                              const selected = progress?.selected ?? 0;
                              const met = selected >= needed;
                              return (
                                <div className="flex items-center gap-1.5">
                                  <Badge
                                    variant="outline"
                                    className="text-xs whitespace-nowrap"
                                  >
                                    × {needed}
                                  </Badge>
                                  <span
                                    className={`text-xs whitespace-nowrap ${
                                      met
                                        ? "text-emerald-600"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {selected}/{needed} dipilih
                                  </span>
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {tool.location ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {tool.shelf ?? "—"}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              type="condition"
                              value={tool.condition}
                            />
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              type="availability"
                              value={tool.availability}
                            />
                          </TableCell>
                          <TableCell>
                            {tool.parameterNames.length > 0 ? (
                              <div className="flex flex-col gap-0.5">
                                {tool.parameterNames.map((name, i) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    className="w-fit text-xs"
                                  >
                                    {name}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            {pageCount > 1 && (
              <WorksheetDataTable
                currentPage={page}
                totalPages={pageCount}
                pageSize={perPage}
                totalItems={filteredGuideTools.length}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPerPage(size);
                  setPage(1);
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
