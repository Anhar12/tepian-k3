import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { WorksheetDataTable } from "@/components/ui/worksheet-data-table";
import { WorksheetHeaderCard } from "@/components/worksheet-header-card";
import { getClusterColor } from "@/lib/cluster-colors";
import { usePagination } from "@/lib/pagination";
import { TabsContent } from "@radix-ui/react-tabs";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import {
  BAHAN_STATUS,
  BAHAN_STATUS_LABELS,
  BAHAN_UNIT_LABELS,
  TOOLS_AVAILABILITY,
  TOOLS_AVAILABILITY_LABELS,
  TOOLS_CONDITIONS,
  TOOLS_CONDITIONS_LABELS,
  WORKSHEET_NOTE_STATUS,
  type BahanStatus,
  type BahanUnit,
  type ToolsAvailability,
  type ToolsCondition,
  type WorksheetNoteStatus,
} from "@tepian-k3/constants";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Loader2,
  MessageSquare,
  Package,
  Search,
  Send,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import z from "zod";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSubscription } from "@trpc/tanstack-react-query";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";

export const Route = createFileRoute("/(core)/worksheets/")({
  validateSearch: z.object({
    tabs: z
      .enum(["parameter", "alat", "bahan", "stok", "catatan"])
      .default("parameter"),
  }),
  component: RouteComponent,
});

const routeApi = getRouteApi("/(core)/worksheets");

interface Tool {
  id: string;
  toolCode: string;
  toolName: string;
  parameterName: string;
  condition: ToolsCondition;
  availability: ToolsAvailability;
  selected?: boolean;
}

interface WorksheetItemWithMeta {
  id: string;
  parameterId: string;
  parameterName: string;
  clusterName: string;
  categoryName: string;
  quantity: number;
  value: number | null;
  note: string | null;
  isReady: boolean;
  locationName: string;
}

function RouteComponent() {
  const { worksheetId } = routeApi.useSearch();
  const queryClient = useQueryClient();

  // Fetch worksheet data
  const {
    data: worksheet,
    isLoading,
    error,
  } = useQuery(trpc.worksheet.getWorksheetById.queryOptions({ worksheetId }));

  // Fetch worksheet notes
  const { data: notes } = useQuery(
    trpc.worksheet.getNotes.queryOptions({ worksheetId }),
  );

  // TODO create worksheet items api to fetch items separately
  // Fetch worksheet items

  // Fetch all tools for assignment
  const { data: allToolsData } = useQuery(
    trpc.tool.getForWorksheet.queryOptions({
      worksheetId,
    }),
  );

  // Fetch chemical materials linked to parameters in this worksheet
  const { data: chemicalMaterialsData, isLoading: isLoadingChemicalMaterials } =
    useQuery(
      trpc.chemicalMaterial.getForWorksheet.queryOptions({ worksheetId }),
    );

  // Fetch worksheet-specific chemical materials (with required quantities)
  const { data: worksheetChemicalMaterialsData } = useQuery(
    trpc.worksheet.getChemicalMaterials.queryOptions({ worksheetId }),
  );

  // Mutations
  const batchUpdateMutation = useMutation(
    trpc.worksheet.batchUpdateItems.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.worksheet.getWorksheetById.queryOptions({ worksheetId }),
        );
        globalSuccessToast("Perubahan berhasil disimpan");
        setLocalItemUpdates(new Map());
      },
      onError: (error) => {
        globalErrorToast("Gagal menyimpan perubahan : " + error.message);
      },
    }),
  );

  const assignToolsMutation = useMutation(
    trpc.worksheet.assignTools.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.worksheet.getWorksheetById.queryOptions({ worksheetId }),
        );
        globalSuccessToast("Alat berhasil disimpan");
      },
      onError: (error) => {
        globalErrorToast("Gagal menyimpan alat : " + error.message);
      },
    }),
  );

  const addNoteMutation = useMutation(
    trpc.worksheet.addNote.mutationOptions({
      onSuccess: async () => {
        (await queryClient.invalidateQueries(
          trpc.worksheet.getNotes.queryOptions({ worksheetId }),
        ),
          globalSuccessToast("Catatan berhasil ditambahkan"));
        setNewNote("");
        setNoteSeverity("info");
      },
      onError: (error) => {
        globalErrorToast("Gagal menambahkan catatan : " + error.message);
      },
    }),
  );

  const saveChemicalMaterialsMutation = useMutation(
    trpc.worksheet.saveChemicalMaterials.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.worksheet.getChemicalMaterials.queryOptions({ worksheetId }),
        );
        globalSuccessToast("Bahan berhasil disimpan");
        setLocalRequiredUpdates(new Map());
      },
      onError: (error) => {
        globalErrorToast("Gagal menyimpan bahan : " + error.message);
      },
    }),
  );

  // Local state
  const [selectedCluster, setSelectedCluster] = useState("Semua Cluster");
  const [newNote, setNewNote] = useState("");
  const [noteSeverity, setNoteSeverity] = useState<WorksheetNoteStatus>("info");
  const [toolSearch, setToolSearch] = useState("");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [activeSubTab, setActiveSubTab] = useState<
    "parameter" | "alat" | "bahan" | "stok-habis" | "catatan"
  >("parameter");
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(
    new Set(),
  );
  const [localItemUpdates, setLocalItemUpdates] = useState<
    Map<string, { value: number | null; note: string | null; isReady: boolean }>
  >(new Map());

  const [parameterPage, setParameterPage] = useState(1);
  const [parameterPageSize, setParameterPageSize] = useState(5);
  const [toolPage, setToolPage] = useState(1);
  const [toolPageSize, setToolPageSize] = useState(5);
  const [bahanSearch, setBahanSearch] = useState("");
  const [bahanStatusFilter, setBahanStatusFilter] = useState<string>("all");
  const [bahanPage, setBahanPage] = useState(1);
  const [bahanPageSize, setBahanPageSize] = useState(5);
  const [localRequiredUpdates, setLocalRequiredUpdates] = useState<
    Map<string, number>
  >(new Map());

  // Initialize selected tools from worksheet data
  useMemo(() => {
    if (worksheet?.tools) {
      setSelectedToolIds(new Set(worksheet.tools.map((t) => t.toolId)));
    }
  }, [worksheet?.tools]);

  // Transform worksheet items to display format
  const worksheetItems: WorksheetItemWithMeta[] = useMemo(() => {
    if (!worksheet?.items) return [];
    return worksheet.items.map((item) => ({
      id: item.id,
      parameterId: item.parameterId,
      parameterName: item.parameter?.name ?? "Unknown",
      clusterName: item.parameter.category.cluster?.name ?? "Unknown",
      categoryName: item.parameter?.category?.name ?? "Unknown",
      quantity: item.quantity,
      value: item.value,
      note: item.note,
      isReady: item.isReady,
      locationName: item.location?.name ?? "Unknown",
    }));
  }, [worksheet?.items]);

  // Get unique clusters for filter
  const clusters = useMemo(() => {
    const uniqueClusters = new Set(
      worksheetItems.map((item) => item.clusterName),
    );
    return ["Semua Cluster", ...Array.from(uniqueClusters)];
  }, [worksheetItems]);

  // Filter items by cluster
  const filteredItems = useMemo(() => {
    return selectedCluster === "Semua Cluster"
      ? worksheetItems
      : worksheetItems.filter((item) => item.clusterName === selectedCluster);
  }, [worksheetItems, selectedCluster]);

  // Transform tools data
  const tools: Tool[] = useMemo(() => {
    if (!allToolsData) return [];
    return allToolsData.map((tool) => ({
      id: tool.id,
      toolCode: tool.toolCode,
      toolName: tool.toolName,
      parameterName: tool.parameterName,
      condition: tool.condition,
      availability: tool.availability,
      selected: selectedToolIds.has(tool.id),
    }));
  }, [allToolsData, selectedToolIds]);

  // Filter tools
  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesSearch =
        tool.id.toLowerCase().includes(toolSearch.toLowerCase()) ||
        tool.toolCode.toLowerCase().includes(toolSearch.toLowerCase()) ||
        tool.toolName.toLowerCase().includes(toolSearch.toLowerCase());
      const matchesCondition =
        conditionFilter === "all" || tool.condition === conditionFilter;
      const matchesAvailability =
        availabilityFilter === "all" ||
        tool.availability === availabilityFilter;
      return matchesSearch && matchesCondition && matchesAvailability;
    });
  }, [tools, toolSearch, conditionFilter, availabilityFilter]);

  // Merge chemical materials with worksheet required quantities
  const consumablesWithRequired = useMemo(() => {
    if (!chemicalMaterialsData) return [];

    // Create a map of worksheet chemical materials (material id -> required)
    const worksheetMaterialsMap = new Map<
      string,
      { required: number; requiredUnit: BahanUnit | null }
    >();
    if (worksheetChemicalMaterialsData) {
      for (const wcm of worksheetChemicalMaterialsData) {
        worksheetMaterialsMap.set(wcm.chemicalMaterialId, {
          required: wcm.required,
          requiredUnit: wcm.requiredUnit,
        });
      }
    }

    return chemicalMaterialsData.map((material) => {
      const worksheetData = worksheetMaterialsMap.get(material.id);
      const localRequired = localRequiredUpdates.get(material.id);
      const required = localRequired ?? worksheetData?.required ?? 0;

      // Calculate total stock (usedStock + sealedStock)
      const totalStock =
        (material.usedStock ?? 0) + (material.sealedStock ?? 0);

      return {
        ...material,
        required,
        requiredUnit: worksheetData?.requiredUnit ?? material.usedStockUnit,
        totalStock,
        stockStatus:
          required === 0
            ? ("none" as const)
            : required <= totalStock
              ? ("sufficient" as const)
              : ("insufficient" as const),
      };
    });
  }, [
    chemicalMaterialsData,
    worksheetChemicalMaterialsData,
    localRequiredUpdates,
  ]);

  // Filter chemical materials
  const filteredChemicalMaterials = useMemo(() => {
    return consumablesWithRequired.filter((material) => {
      const matchesSearch =
        material.code.toLowerCase().includes(bahanSearch.toLowerCase()) ||
        material.name.toLowerCase().includes(bahanSearch.toLowerCase()) ||
        (material.chemicalFormula
          ?.toLowerCase()
          .includes(bahanSearch.toLowerCase()) ??
          false);
      const matchesStatus =
        bahanStatusFilter === "all" || material.status === bahanStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [consumablesWithRequired, bahanSearch, bahanStatusFilter]);

  // Get items with insufficient stock (for ready parameters)
  const insufficientStockItems = useMemo(() => {
    return consumablesWithRequired.filter(
      (material) =>
        material.required > 0 && material.stockStatus === "insufficient",
    );
  }, [consumablesWithRequired]);

  // Get low stock / out of stock items based on material status
  const outOfStockMaterials = useMemo(() => {
    return consumablesWithRequired.filter(
      (material) => material.status === "habis",
    );
  }, [consumablesWithRequired]);

  const lowStockMaterials = useMemo(() => {
    return consumablesWithRequired.filter(
      (material) => material.status === "hampir_habis",
    );
  }, [consumablesWithRequired]);

  const expiredMaterials = useMemo(() => {
    return consumablesWithRequired.filter(
      (material) => material.status === "expired",
    );
  }, [consumablesWithRequired]);

  const criticalStockCount = useMemo(() => {
    return (
      outOfStockMaterials.length +
      lowStockMaterials.length +
      expiredMaterials.length
    );
  }, [outOfStockMaterials, lowStockMaterials, expiredMaterials]);

  // Pagination
  const parameterPagination = usePagination(
    filteredItems,
    parameterPageSize,
    parameterPage,
  );
  const toolPagination = usePagination(filteredTools, toolPageSize, toolPage);
  const bahanPagination = usePagination(
    filteredChemicalMaterials,
    bahanPageSize,
    bahanPage,
  );

  // Handlers
  const getItemState = (itemId: string) => {
    const localUpdate = localItemUpdates.get(itemId);
    if (localUpdate) return localUpdate;
    const item = worksheetItems.find((i) => i.id === itemId);
    return item
      ? { value: item.value, note: item.note, isReady: item.isReady }
      : { value: null, note: null, isReady: false };
  };

  const handleItemChange = (
    itemId: string,
    field: "value" | "note" | "isReady",
    value: number | string | boolean | null,
  ) => {
    setLocalItemUpdates((prev) => {
      const newMap = new Map(prev);
      const current = getItemState(itemId);
      newMap.set(itemId, {
        ...current,
        [field]: value,
      });
      return newMap;
    });
  };

  const handleSaveItems = () => {
    if (localItemUpdates.size === 0) return;

    const items = Array.from(localItemUpdates.entries()).map(
      ([itemId, data]) => ({
        itemId,
        value: data.value,
        note: data.note,
        isReady: data.isReady,
      }),
    );

    batchUpdateMutation.mutate({
      worksheetId,
      items,
    });
  };

  const handleToolSelect = (toolId: string, checked: boolean) => {
    setSelectedToolIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(toolId);
      } else {
        newSet.delete(toolId);
      }
      return newSet;
    });
  };

  const handleSelectAllTools = (checked: boolean) => {
    const filteredIds = filteredTools.map((t) => t.id);
    setSelectedToolIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        filteredIds.forEach((id) => newSet.add(id));
      } else {
        filteredIds.forEach((id) => newSet.delete(id));
      }
      return newSet;
    });
  };

  const handleSaveTools = () => {
    assignToolsMutation.mutate({
      worksheetId,
      toolIds: Array.from(selectedToolIds),
    });
  };

  const handleSendNote = () => {
    if (!newNote.trim()) return;

    addNoteMutation.mutate({
      worksheetId,
      note: newNote.trim(),
      severity: noteSeverity,
    });
  };

  const handleRequiredChange = (materialId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setLocalRequiredUpdates((prev) => {
      const newMap = new Map(prev);
      newMap.set(materialId, numValue);
      return newMap;
    });
  };

  const handleSaveBahan = () => {
    // Build the materials array from consumablesWithRequired with local updates applied
    const materials = consumablesWithRequired.map((material) => ({
      chemicalMaterialId: material.id,
      required: localRequiredUpdates.has(material.id)
        ? localRequiredUpdates.get(material.id)!
        : material.required,
      requiredUnit: material.requiredUnit,
    }));

    saveChemicalMaterialsMutation.mutate({
      worksheetId,
      materials,
    });
  };

  const selectedToolsCount = selectedToolIds.size;
  const allToolsSelected =
    filteredTools.length > 0 &&
    filteredTools.every((t) => selectedToolIds.has(t.id));
  const someToolsSelected = filteredTools.some((t) =>
    selectedToolIds.has(t.id),
  );
  const readyParametersCount = worksheetItems.filter((p) => {
    const state = getItemState(p.id);
    return state.isReady;
  }).length;

  const hasLocalChanges = localItemUpdates.size > 0;
  const hasLocalBahanChanges = localRequiredUpdates.size > 0;

  useSubscription({
    ...trpc.event.onWorksheetNoteCreated.subscriptionOptions(),
    onData: (event) => {
      if (event.worksheetId === worksheetId)
        queryClient.invalidateQueries(
          trpc.worksheet.getNotes.queryOptions({ worksheetId }),
        );
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !worksheet) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Worksheet tidak ditemukan</p>
        <p className="text-sm text-muted-foreground">
          {error?.message ?? "Tidak dapat memuat data worksheet"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <WorksheetHeaderCard
        title="Rincian parameter"
        subtitle={`Worksheet untuk ${worksheet?.order?.company?.name ?? "Unknown"}`}
      />

      <Card>
        <Tabs
          value={activeSubTab}
          onValueChange={(v) => setActiveSubTab(v as typeof activeSubTab)}
          className="w-full"
        >
          <div className="scrollbar-hide overflow-x-auto px-3">
            <TabsList className="h-auto w-full min-w-max flex-nowrap justify-start bg-muted/30 p-1">
              <TabsTrigger
                value="parameter"
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:gap-2 sm:px-4 sm:text-sm"
              >
                <ClipboardList className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="xs:inline hidden">Parameter</span>
                <span className="xs:hidden">Param</span>
                {hasLocalChanges && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 px-1.5 text-xs"
                  >
                    *
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="alat"
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:gap-2 sm:px-4 sm:text-sm"
              >
                <Wrench className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Alat</span>
                {selectedToolsCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 px-1.5 text-xs"
                  >
                    {selectedToolsCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="bahan"
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:gap-2 sm:px-4 sm:text-sm"
              >
                <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Bahan</span>
              </TabsTrigger>
              <TabsTrigger
                value="stok-habis"
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:gap-2 sm:px-4 sm:text-sm"
              >
                <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Stok Habis</span>
                <span className="sm:hidden">Habis</span>
              </TabsTrigger>
              <TabsTrigger
                value="catatan"
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:gap-2 sm:px-4 sm:text-sm"
              >
                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Catatan</span>
                {notes && notes.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 px-1.5 text-xs"
                  >
                    {notes.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Parameter Tab */}
          <TabsContent value="parameter" className="p-3 pt-4 sm:p-4 sm:pt-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Select
                value={selectedCluster}
                onValueChange={(v) => {
                  setSelectedCluster(v);
                  setParameterPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Pilih Cluster" />
                </SelectTrigger>
                <SelectContent>
                  {clusters.map((cluster) => (
                    <SelectItem key={cluster} value={cluster}>
                      {cluster}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasLocalChanges && (
                <Button
                  onClick={handleSaveItems}
                  disabled={batchUpdateMutation.isPending}
                  className="gap-2"
                >
                  {batchUpdateMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Simpan Perubahan
                </Button>
              )}
            </div>

            <Alert className="mb-4 border-primary/20 bg-primary/5">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                Centang "Ready" pada parameter untuk menandakan pengujian
                selesai. Saat ini <strong>{readyParametersCount}</strong> dari{" "}
                <strong>{worksheetItems.length}</strong> parameter siap.
              </AlertDescription>
            </Alert>

            <div className="overflow-hidden rounded-xl border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs font-semibold sm:text-sm">
                        Cluster
                      </TableHead>
                      <TableHead className="hidden text-xs font-semibold sm:text-sm md:table-cell">
                        Kategori
                      </TableHead>
                      <TableHead className="text-xs font-semibold sm:text-sm">
                        Parameter
                      </TableHead>
                      <TableHead className="hidden text-xs font-semibold sm:text-sm lg:table-cell">
                        Lokasi
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold sm:text-sm">
                        Jumlah
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold sm:text-sm">
                        Nilai
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold sm:text-sm">
                        Ready
                      </TableHead>
                      <TableHead className="hidden text-xs font-semibold sm:table-cell sm:text-sm">
                        Catatan
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parameterPagination.paginatedData.map((item) => {
                      const itemState = getItemState(item.id);
                      return (
                        <TableRow
                          key={item.id}
                          className={`hover:bg-muted/30 ${itemState.isReady ? "bg-emerald-50/50" : ""}`}
                        >
                          <TableCell>
                            <Badge
                              className={`${getClusterColor(item.clusterName)} text-xs`}
                            >
                              {item.clusterName}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden text-xs sm:text-sm md:table-cell">
                            {item.categoryName}
                          </TableCell>
                          <TableCell className="text-xs font-medium sm:text-sm">
                            {item.parameterName}
                          </TableCell>
                          <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                            {item.locationName}
                          </TableCell>
                          <TableCell className="text-center text-xs sm:text-sm">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              value={itemState.value ?? ""}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "value",
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : null,
                                )
                              }
                              className="mx-auto h-8 w-20 text-center text-xs sm:text-sm"
                              step="any"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={itemState.isReady}
                              onCheckedChange={(checked) =>
                                handleItemChange(
                                  item.id,
                                  "isReady",
                                  checked as boolean,
                                )
                              }
                              className="data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                            />
                          </TableCell>

                          <TableCell className="hidden sm:table-cell">
                            <Input
                              value={itemState.note ?? ""}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "note",
                                  e.target.value || null,
                                )
                              }
                              className="h-8 text-xs"
                              placeholder="Catatan..."
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <WorksheetDataTable
                currentPage={parameterPagination.currentPage}
                totalPages={parameterPagination.totalPages}
                pageSize={parameterPageSize}
                totalItems={parameterPagination.totalItems}
                onPageChange={setParameterPage}
                onPageSizeChange={(size) => {
                  setParameterPageSize(size);
                  setParameterPage(1);
                }}
              />
            </div>
          </TabsContent>

          {/* Alat Tab */}
          <TabsContent value="alat" className="p-3 pt-4 sm:p-4 sm:pt-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari alat (ID, kode, nama)..."
                  value={toolSearch}
                  onChange={(e) => {
                    setToolSearch(e.target.value);
                    setToolPage(1);
                  }}
                  className="pl-9"
                />
              </div>
              <Select
                value={conditionFilter}
                onValueChange={(v) => {
                  setConditionFilter(v);
                  setToolPage(1);
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
                  setToolPage(1);
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

            {/* Summary Cards */}
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
              {[
                {
                  label: "Total",
                  count: tools.length,
                  color: "bg-slate-100 text-slate-700",
                },
                {
                  label: "Ready",
                  count: tools.filter((t) => t.availability === "ready").length,
                  color: "bg-emerald-100 text-emerald-700",
                },
                {
                  label: "Kalibrasi",
                  count: tools.filter((t) => t.availability === "kalibrasi")
                    .length,
                  color: "bg-blue-100 text-blue-700",
                },
                {
                  label: "Maintenance",
                  count: tools.filter((t) => t.availability === "maintenance")
                    .length,
                  color: "bg-orange-100 text-orange-700",
                },
                {
                  label: "Dipinjam",
                  count: tools.filter((t) => t.availability === "dipinjam")
                    .length,
                  color: "bg-purple-100 text-purple-700",
                },
                {
                  label: "Dipilih",
                  count: selectedToolsCount,
                  color: "bg-primary/10 text-primary",
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

            <div className="mb-4 flex justify-end">
              <Button
                onClick={handleSaveTools}
                disabled={assignToolsMutation.isPending}
                className="gap-2"
              >
                {assignToolsMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Simpan Alat ({selectedToolsCount})
              </Button>
            </div>

            <div className="overflow-hidden rounded-xl border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={allToolsSelected}
                          onCheckedChange={handleSelectAllTools}
                          aria-label="Select all"
                          className={
                            someToolsSelected && !allToolsSelected
                              ? "data-[state=checked]:bg-primary/50"
                              : ""
                          }
                        />
                      </TableHead>
                      <TableHead className="text-xs font-semibold sm:text-sm">
                        Kode
                      </TableHead>
                      <TableHead className="text-xs font-semibold sm:text-sm">
                        Nama Alat
                      </TableHead>
                      <TableHead className="text-xs font-semibold sm:text-sm">
                        Untuk Parameter
                      </TableHead>
                      <TableHead className="text-xs font-semibold sm:text-sm">
                        Kondisi
                      </TableHead>
                      <TableHead className="text-xs font-semibold sm:text-sm">
                        Ketersediaan
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {toolPagination.paginatedData.map((tool) => (
                      <TableRow
                        key={tool.id}
                        className={`cursor-pointer hover:bg-muted/30 ${
                          selectedToolIds.has(tool.id) ? "bg-primary/5" : ""
                        }`}
                        onClick={() =>
                          handleToolSelect(
                            tool.id,
                            !selectedToolIds.has(tool.id),
                          )
                        }
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedToolIds.has(tool.id)}
                            onCheckedChange={(checked) =>
                              handleToolSelect(tool.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {tool.toolCode}
                        </TableCell>
                        <TableCell className="text-xs font-medium sm:text-sm">
                          {tool.toolName}
                        </TableCell>
                        <TableCell className="text-xs font-medium sm:text-sm">
                          {tool.parameterName}
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <WorksheetDataTable
                currentPage={toolPagination.currentPage}
                totalPages={toolPagination.totalPages}
                pageSize={toolPageSize}
                totalItems={toolPagination.totalItems}
                onPageChange={setToolPage}
                onPageSizeChange={(size) => {
                  setToolPageSize(size);
                  setToolPage(1);
                }}
              />
            </div>

            {selectedToolsCount > 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                <CheckCircle2 className="mr-1 inline h-4 w-4 text-emerald-500" />
                {selectedToolsCount} alat dipilih
              </p>
            )}
          </TabsContent>

          {/* Bahan Tab */}
          <TabsContent value="bahan" className="p-3 pt-4 sm:p-4 sm:pt-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari bahan (kode, nama, rumus kimia)..."
                  value={bahanSearch}
                  onChange={(e) => {
                    setBahanSearch(e.target.value);
                    setBahanPage(1);
                  }}
                  className="pl-9"
                />
              </div>
              <Select
                value={bahanStatusFilter}
                onValueChange={(v) => {
                  setBahanStatusFilter(v);
                  setBahanPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {BAHAN_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {BAHAN_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoadingChemicalMaterials ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredChemicalMaterials.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-medium">
                  Tidak ada bahan yang dibutuhkan
                </h3>
                <p className="text-sm text-muted-foreground">
                  Parameter pada worksheet ini tidak memerlukan bahan kimia.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-2 text-center sm:p-3">
                      <p className="text-lg font-bold sm:text-xl">
                        {filteredChemicalMaterials.length}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total Bahan
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-2 text-center sm:p-3">
                      <p className="text-lg font-bold text-emerald-600 sm:text-xl">
                        {
                          consumablesWithRequired.filter(
                            (c) => c.stockStatus === "sufficient",
                          ).length
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stok Cukup
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-2 text-center sm:p-3">
                      <p className="text-lg font-bold text-amber-600 sm:text-xl">
                        {insufficientStockItems.length}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stok Kurang
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-2 text-center sm:p-3">
                      <p className="text-lg font-bold text-primary sm:text-xl">
                        {consumablesWithRequired.reduce(
                          (sum, c) => sum + c.required,
                          0,
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total Dibutuhkan
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {hasLocalBahanChanges && (
                  <div className="mb-4 flex justify-end">
                    <Button
                      onClick={handleSaveBahan}
                      disabled={saveChemicalMaterialsMutation.isPending}
                      className="gap-2"
                    >
                      {saveChemicalMaterialsMutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      Simpan Bahan ({localRequiredUpdates.size} perubahan)
                    </Button>
                  </div>
                )}

                <div className="overflow-hidden rounded-xl border">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs font-semibold sm:text-sm">
                            Nama Bahan
                          </TableHead>
                          <TableHead className="text-xs font-semibold sm:text-sm">
                            Untuk Parameter
                          </TableHead>
                          <TableHead className="hidden text-xs font-semibold sm:text-sm md:table-cell">
                            Rumus Kimia
                          </TableHead>
                          <TableHead className="text-xs font-semibold sm:text-sm">
                            Satuan
                          </TableHead>
                          <TableHead className="text-center text-xs font-semibold sm:text-sm">
                            Dibutuhkan
                          </TableHead>
                          <TableHead className="text-center text-xs font-semibold sm:text-sm">
                            Stok
                          </TableHead>
                          <TableHead className="text-center text-xs font-semibold sm:text-sm">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bahanPagination.paginatedData.map((item) => (
                          <TableRow
                            key={item.id}
                            className={`hover:bg-muted/30 ${item.required > 0 ? "bg-primary/5" : ""}`}
                          >
                            <TableCell className="text-xs font-medium sm:text-sm">
                              {item.name}
                            </TableCell>
                            <TableCell className="text-xs font-medium sm:text-sm">
                              {item.parameterName}
                            </TableCell>
                            <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                              {item.chemicalFormula ?? "-"}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              {item.usedStockUnit
                                ? BAHAN_UNIT_LABELS[
                                    item.usedStockUnit as BahanUnit
                                  ]
                                : "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                value={item.required}
                                onChange={(e) =>
                                  handleRequiredChange(item.id, e.target.value)
                                }
                                className="mx-auto h-8 w-16 text-center text-xs sm:text-sm"
                                min={0}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className="bg-background text-xs"
                              >
                                {item.totalStock}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {item.stockStatus === "none" ? (
                                <span className="text-xs text-muted-foreground">
                                  -
                                </span>
                              ) : item.stockStatus === "sufficient" ? (
                                <Badge className="bg-emerald-100 text-xs text-emerald-700">
                                  Cukup
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-xs text-amber-700">
                                  Kurang
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <WorksheetDataTable
                    currentPage={bahanPagination.currentPage}
                    totalPages={bahanPagination.totalPages}
                    pageSize={bahanPageSize}
                    totalItems={bahanPagination.totalItems}
                    onPageChange={setBahanPage}
                    onPageSizeChange={(size) => {
                      setBahanPageSize(size);
                      setBahanPage(1);
                    }}
                  />
                </div>
              </>
            )}
          </TabsContent>

          {/* Stok Habis Tab */}
          <TabsContent value="stok-habis" className="p-3 pt-4 sm:p-4 sm:pt-6">
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-2 text-center sm:p-3">
                  <p className="text-lg font-bold sm:text-xl">
                    {consumablesWithRequired.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Bahan</p>
                </CardContent>
              </Card>
              <Card className="border-0 border-red-200 bg-red-50/50 shadow-sm">
                <CardContent className="p-2 text-center sm:p-3">
                  <p className="text-lg font-bold text-red-600 sm:text-xl">
                    {outOfStockMaterials.length}
                  </p>
                  <p className="text-xs text-red-600">Habis</p>
                </CardContent>
              </Card>
              <Card className="border-0 border-amber-200 bg-amber-50/50 shadow-sm">
                <CardContent className="p-2 text-center sm:p-3">
                  <p className="text-lg font-bold text-amber-600 sm:text-xl">
                    {lowStockMaterials.length}
                  </p>
                  <p className="text-xs text-amber-600">Stok Rendah</p>
                </CardContent>
              </Card>
              <Card className="border-0 border-emerald-200 bg-emerald-50/50 shadow-sm">
                <CardContent className="p-2 text-center sm:p-3">
                  <p className="text-lg font-bold text-emerald-600 sm:text-xl">
                    {
                      consumablesWithRequired.filter(
                        (c) => c.status === "tersedia",
                      ).length
                    }
                  </p>
                  <p className="text-xs text-emerald-600">Stok Aman</p>
                </CardContent>
              </Card>
            </div>

            {criticalStockCount === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
                <h3 className="mb-2 text-lg font-medium">
                  Semua stok dalam kondisi aman
                </h3>
                <p className="text-sm text-muted-foreground">
                  Tidak ada bahan yang perlu di-restock saat ini.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {outOfStockMaterials.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      Stok Habis ({outOfStockMaterials.length})
                    </h3>
                    <div className="overflow-hidden rounded-xl border border-red-200">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-red-50">
                            <TableHead className="text-xs font-semibold sm:text-sm">
                              Nama Bahan
                            </TableHead>
                            <TableHead className="text-xs font-semibold sm:text-sm">
                              Satuan
                            </TableHead>
                            <TableHead className="text-center text-xs font-semibold sm:text-sm">
                              Stok
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {outOfStockMaterials.map((item) => (
                            <TableRow key={item.id} className="bg-red-50/30">
                              <TableCell className="text-xs font-medium sm:text-sm">
                                {item.name}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                {item.usedStockUnit
                                  ? BAHAN_UNIT_LABELS[
                                      item.usedStockUnit as BahanUnit
                                    ]
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  {item.totalStock}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {lowStockMaterials.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-amber-600">
                      <AlertCircle className="h-4 w-4" />
                      Stok Rendah ({lowStockMaterials.length})
                    </h3>
                    <div className="overflow-hidden rounded-xl border border-amber-200">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-amber-50">
                            <TableHead className="text-xs font-semibold sm:text-sm">
                              Nama Bahan
                            </TableHead>
                            <TableHead className="text-xs font-semibold sm:text-sm">
                              Satuan
                            </TableHead>
                            <TableHead className="text-center text-xs font-semibold sm:text-sm">
                              Stok
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lowStockMaterials.map((item) => (
                            <TableRow key={item.id} className="bg-amber-50/30">
                              <TableCell className="text-xs font-medium sm:text-sm">
                                {item.name}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                {item.usedStockUnit
                                  ? BAHAN_UNIT_LABELS[
                                      item.usedStockUnit as BahanUnit
                                    ]
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-amber-100 text-xs text-amber-700">
                                  {item.totalStock}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {expiredMaterials.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-600">
                      <AlertCircle className="h-4 w-4" />
                      Expired ({expiredMaterials.length})
                    </h3>
                    <div className="overflow-hidden rounded-xl border border-gray-200">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="text-xs font-semibold sm:text-sm">
                              Nama Bahan
                            </TableHead>
                            <TableHead className="text-xs font-semibold sm:text-sm">
                              Expired Date
                            </TableHead>
                            <TableHead className="text-center text-xs font-semibold sm:text-sm">
                              Stok
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {expiredMaterials.map((item) => (
                            <TableRow key={item.id} className="bg-gray-50/30">
                              <TableCell className="text-xs font-medium sm:text-sm">
                                {item.name}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                {item.expiredDate
                                  ? new Date(
                                      item.expiredDate,
                                    ).toLocaleDateString("id-ID")
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-gray-100 text-xs text-gray-700">
                                  {item.totalStock}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="mt-6 rounded-lg bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Catatan:</strong> Bahan dengan status "Hampir Habis"
                dianggap stok rendah. Stok dikelola melalui dashboard inventory.
                Hubungi admin untuk melakukan restocking.
              </p>
            </div>
          </TabsContent>

          {/* Catatan Tab */}
          <TabsContent value="catatan" className="p-3 pt-4 sm:p-4 sm:pt-6">
            <div className="flex h-125 flex-col">
              <ScrollArea className="mb-4 flex-1 pr-4">
                <div className="space-y-4">
                  {notes?.length === 0 ? (
                    <div className="py-12 text-center">
                      <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Belum ada catatan untuk worksheet ini
                      </p>
                    </div>
                  ) : (
                    notes?.map((note) => (
                      <div key={note.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-muted">
                            {note.createdBy.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="max-w-[80%] flex-1">
                          <div
                            className={`inline-block rounded-2xl px-4 py-2 ${
                              note.severity === "warning"
                                ? "bg-amber-100 text-amber-900"
                                : note.severity === "danger"
                                  ? "bg-red-100 text-red-900"
                                  : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{note.note}</p>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium">
                              {note.createdBy.name}
                            </span>
                            <span>
                              {new Date(note.createdAt).toLocaleString("id-ID")}
                            </span>
                            {note.severity !== "info" && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  note.severity === "warning"
                                    ? "border-amber-300 text-amber-600"
                                    : "border-red-300 text-red-600"
                                }`}
                              >
                                {note.severity === "warning"
                                  ? "Peringatan"
                                  : "Error"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="border-t pt-4">
                <div className="mb-2 flex gap-2">
                  <Select
                    value={noteSeverity}
                    onValueChange={(v) =>
                      setNoteSeverity(v as WorksheetNoteStatus)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKSHEET_NOTE_STATUS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Tulis catatan baru..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-15 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendNote();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendNote}
                    size="icon"
                    className="size-15"
                    disabled={!newNote.trim() || addNoteMutation.isPending}
                  >
                    {addNoteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Tekan Enter untuk mengirim, Shift+Enter untuk baris baru
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
