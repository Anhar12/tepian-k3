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
import { createFileRoute } from "@tanstack/react-router";
import {
  TOOLS_AVAILABILITY,
  TOOLS_AVAILABILITY_LABELS,
  TOOLS_CONDITIONS,
  TOOLS_CONDITIONS_LABELS,
  type ToolsAvailability,
  type ToolsCondition,
} from "@tepian-k3/constants";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  Package,
  Search,
  Send,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import z from "zod";

export const Route = createFileRoute("/(core)/worksheets/")({
  validateSearch: z.object({
    tabs: z
      .enum(["parameter", "alat", "bahan", "stok", "catatan"])
      .default("parameter"),
  }),
  component: RouteComponent,
});

interface Tool {
  id: string;
  code: string;
  name: string;
  condition: ToolsCondition;
  availability: ToolsAvailability;
  selected?: boolean;
}

interface Consumable {
  id: number;
  name: string;
  unit: string;
  required: number;
  stock: number;
  status: "sufficient" | "low";
  parameterIds: number[]; // Which parameters need this material
}

interface Parameter {
  id: number;
  cluster: string;
  jenisPengujian: string;
  parameter: string;
  jumlah: number;
  acuan: string;
  peralatan: string;
  jumlahPeralatan: number;
  ready: boolean;
}

const initialToolsData: Tool[] = [
  {
    id: "TL001",
    code: "SLM-001",
    name: "Sound Level Meter",
    condition: "baik",
    availability: "ready",
    selected: false,
  },
  {
    id: "TL002",
    code: "SLM-002",
    name: "Sound Level Meter",
    condition: "baik",
    availability: "kalibrasi",
    selected: false,
  },
  {
    id: "TL003",
    code: "LUX-001",
    name: "Lux Meter",
    condition: "baik",
    availability: "ready",
    selected: false,
  },
  {
    id: "TL004",
    code: "LUX-002",
    name: "Lux Meter",
    condition: "diperingatkan",
    availability: "maintenance",
    selected: false,
  },
  {
    id: "TL005",
    code: "HSM-001",
    name: "Heat Stress Monitor",
    condition: "baik",
    availability: "ready",
    selected: false,
  },
  {
    id: "TL006",
    code: "HSM-002",
    name: "Heat Stress Monitor",
    condition: "rusak",
    availability: "not_ready",
    selected: false,
  },
  {
    id: "TL007",
    code: "VBM-001",
    name: "Vibration Meter WB/HA",
    condition: "baik",
    availability: "ready",
    selected: false,
  },
  {
    id: "TL008",
    code: "VBM-002",
    name: "Vibration Meter WB/HA",
    condition: "baik",
    availability: "dipinjam",
    selected: false,
  },
  {
    id: "TL009",
    code: "UVM-001",
    name: "UV Meter A",
    condition: "baik",
    availability: "ready",
    selected: false,
  },
  {
    id: "TL010",
    code: "UVM-002",
    name: "UV Meter B",
    condition: "tidak_menyala",
    availability: "not_ready",
    selected: false,
  },
  {
    id: "TL011",
    code: "NDM-001",
    name: "Noise Dosimeter",
    condition: "baik",
    availability: "ready",
    selected: false,
  },
  {
    id: "TL012",
    code: "IMP-001",
    name: "Impinger",
    condition: "baik",
    availability: "ready",
    selected: false,
  },
  {
    id: "TL013",
    code: "IMP-002",
    name: "Impinger",
    condition: "baik",
    availability: "kalibrasi",
    selected: false,
  },
  {
    id: "TL014",
    code: "VCP-001",
    name: "Vacuum Pump",
    condition: "baik",
    availability: "ready",
    selected: false,
  },
  {
    id: "TL015",
    code: "MAS-001",
    name: "Microbiology Air Sampler",
    condition: "baik",
    availability: "maintenance",
    selected: false,
  },
];

const initialConsumablesData: Consumable[] = [
  {
    id: 1,
    name: "Parameter SO2",
    unit: "pcs",
    required: 0,
    stock: 50,
    status: "sufficient",
    parameterIds: [7],
  }, // SO2 parameter
  {
    id: 2,
    name: "Parameter O3",
    unit: "pcs",
    required: 0,
    stock: 30,
    status: "sufficient",
    parameterIds: [7],
  }, // Related to SO2
  {
    id: 3,
    name: "Filter Membran",
    unit: "box",
    required: 0,
    stock: 12,
    status: "sufficient",
    parameterIds: [4, 6],
  }, // Debu Total, Opasitas
  {
    id: 4,
    name: "Silica Gel",
    unit: "kg",
    required: 0,
    stock: 8,
    status: "sufficient",
    parameterIds: [4, 5, 7],
  }, // Debu Total, Gas CO, SO2
  {
    id: 5,
    name: "Aquades",
    unit: "liter",
    required: 0,
    stock: 25,
    status: "sufficient",
    parameterIds: [7, 8, 9],
  }, // SO2, pH, BOD
  {
    id: 6,
    name: "HCL",
    unit: "liter",
    required: 0,
    stock: 3,
    status: "low",
    parameterIds: [7],
  }, // SO2
  {
    id: 7,
    name: "H2SO4",
    unit: "liter",
    required: 0,
    stock: 5,
    status: "sufficient",
    parameterIds: [7, 9],
  }, // SO2, BOD
  {
    id: 8,
    name: "NaOH",
    unit: "kg",
    required: 0,
    stock: 2,
    status: "low",
    parameterIds: [8],
  }, // pH
  {
    id: 9,
    name: "Indikator pH",
    unit: "botol",
    required: 0,
    stock: 15,
    status: "sufficient",
    parameterIds: [8],
  }, // pH
  {
    id: 10,
    name: "Kertas Saring",
    unit: "pack",
    required: 0,
    stock: 20,
    status: "sufficient",
    parameterIds: [4, 6],
  }, // Debu Total, Opasitas
  {
    id: 11,
    name: "Charcoal Tube",
    unit: "pcs",
    required: 0,
    stock: 100,
    status: "sufficient",
    parameterIds: [5],
  }, // Gas CO
  {
    id: 12,
    name: "Calibration Gas",
    unit: "tabung",
    required: 0,
    stock: 5,
    status: "sufficient",
    parameterIds: [5],
  }, // Gas CO
  {
    id: 13,
    name: "Media Agar",
    unit: "pack",
    required: 0,
    stock: 10,
    status: "sufficient",
    parameterIds: [9],
  }, // BOD
  {
    id: 14,
    name: "Alkohol 70%",
    unit: "liter",
    required: 0,
    stock: 8,
    status: "sufficient",
    parameterIds: [1, 2, 3, 10],
  }, // General cleaning
];

const initialNotes = [
  {
    id: 1,
    author: "Arif Budiman",
    initials: "AB",
    message: "Pastikan penyimpanan charcoal pada coolbox sebelum pengujian.",
    timestamp: "25/12/2025 09:30",
    type: "note",
  },
  {
    id: 2,
    author: "Muttaqin",
    initials: "MQ",
    message:
      "Sound Level Meter unit 3 sedang dalam perbaikan, estimasi selesai 2 hari.",
    timestamp: "25/12/2025 10:15",
    type: "warning",
  },
  {
    id: 3,
    author: "Siti Rahma",
    initials: "SR",
    message: "Stok Silica Gel perlu ditambah sebelum pengujian minggu depan.",
    timestamp: "25/12/2025 11:00",
    type: "note",
  },
  {
    id: 4,
    author: "Arif Budiman",
    initials: "AB",
    message:
      "Kaji ulang parameter Kebisingan untuk lokasi workshop, perlu tambahan titik sampling.",
    timestamp: "25/12/2025 14:20",
    type: "important",
  },
];

const initialTestingData: Parameter[] = [
  {
    id: 1,
    cluster: "Lingkungan kerja",
    jenisPengujian: "Faktor Fisik",
    parameter: "Kebisingan",
    jumlah: 2,
    acuan: "Permenaker 05 thn 2018",
    peralatan: "Sound Maker level",
    jumlahPeralatan: 2,
    ready: false,
  },
  {
    id: 2,
    cluster: "Lingkungan kerja",
    jenisPengujian: "Faktor Fisik",
    parameter: "Pencahayaan",
    jumlah: 3,
    acuan: "Permenaker 05 thn 2018",
    peralatan: "Lux Meter",
    jumlahPeralatan: 3,
    ready: true,
  },
  {
    id: 3,
    cluster: "Lingkungan kerja",
    jenisPengujian: "Faktor Fisik",
    parameter: "Iklim Kerja",
    jumlah: 2,
    acuan: "Permenaker 05 thn 2018",
    peralatan: "Heat Stress Monitor",
    jumlahPeralatan: 2,
    ready: false,
  },
  {
    id: 4,
    cluster: "Lingkungan kerja",
    jenisPengujian: "Faktor Kimia",
    parameter: "Debu Total",
    jumlah: 4,
    acuan: "Permenaker 05 thn 2018",
    peralatan: "Personal Dust Sampler",
    jumlahPeralatan: 4,
    ready: true,
  },
  {
    id: 5,
    cluster: "Lingkungan kerja",
    jenisPengujian: "Faktor Kimia",
    parameter: "Gas CO",
    jumlah: 2,
    acuan: "Permenaker 05 thn 2018",
    peralatan: "Gas Detector",
    jumlahPeralatan: 2,
    ready: false,
  },
  {
    id: 6,
    cluster: "Emisi Udara",
    jenisPengujian: "Faktor Fisik",
    parameter: "Opasitas",
    jumlah: 1,
    acuan: "PermenLHK 2021",
    peralatan: "Smoke Meter",
    jumlahPeralatan: 1,
    ready: true,
  },
  {
    id: 7,
    cluster: "Emisi Udara",
    jenisPengujian: "Faktor Kimia",
    parameter: "SO2",
    jumlah: 2,
    acuan: "PermenLHK 2021",
    peralatan: "Impinger Set",
    jumlahPeralatan: 2,
    ready: false,
  },
  {
    id: 8,
    cluster: "Air Limbah",
    jenisPengujian: "Faktor Kimia",
    parameter: "pH",
    jumlah: 5,
    acuan: "PermenLHK 2019",
    peralatan: "pH Meter",
    jumlahPeralatan: 5,
    ready: true,
  },
  {
    id: 9,
    cluster: "Air Limbah",
    jenisPengujian: "Faktor Kimia",
    parameter: "BOD",
    jumlah: 3,
    acuan: "PermenLHK 2019",
    peralatan: "BOD Incubator",
    jumlahPeralatan: 3,
    ready: true,
  },
  {
    id: 10,
    cluster: "Lingkungan kerja",
    jenisPengujian: "Faktor Fisik",
    parameter: "Getaran",
    jumlah: 2,
    acuan: "Permenaker 05 thn 2018",
    peralatan: "Vibration Meter",
    jumlahPeralatan: 2,
    ready: false,
  },
];

const clusters = [
  "Semua Cluster",
  "Lingkungan kerja",
  "Emisi Udara",
  "Air Limbah",
];

function RouteComponent() {
  const [selectedCluster, setSelectedCluster] = useState("Semua Cluster");
  const [data, setData] = useState<Parameter[]>(initialTestingData);
  const [notes, setNotes] = useState(initialNotes);
  const [newNote, setNewNote] = useState("");
  const [tools, setTools] = useState<Tool[]>(initialToolsData);
  const [toolSearch, setToolSearch] = useState("");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [consumables, setConsumables] = useState<Consumable[]>(
    initialConsumablesData,
  );
  const [activeSubTab, setActiveSubTab] = useState<
    "parameter" | "alat" | "bahan" | "stok-habis" | "catatan"
  >("parameter");

  const [parameterPage, setParameterPage] = useState(1);
  const [parameterPageSize, setParameterPageSize] = useState(5);
  const [toolPage, setToolPage] = useState(1);
  const [toolPageSize, setToolPageSize] = useState(5);
  const [bahanPage, setBahanPage] = useState(1);
  const [bahanPageSize, setBahanPageSize] = useState(5);

  const filteredData = useMemo(() => {
    return selectedCluster === "Semua Cluster"
      ? data
      : data.filter((item) => item.cluster === selectedCluster);
  }, [data, selectedCluster]);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesSearch =
        tool.id.toLowerCase().includes(toolSearch.toLowerCase()) ||
        tool.code.toLowerCase().includes(toolSearch.toLowerCase()) ||
        tool.name.toLowerCase().includes(toolSearch.toLowerCase());
      const matchesCondition =
        conditionFilter === "all" || tool.condition === conditionFilter;
      const matchesAvailability =
        availabilityFilter === "all" ||
        tool.availability === availabilityFilter;
      return matchesSearch && matchesCondition && matchesAvailability;
    });
  }, [tools, toolSearch, conditionFilter, availabilityFilter]);

  const readyParameterIds = data.filter((p) => p.ready).map((p) => p.id);

  const filteredConsumables = useMemo(() => {
    return consumables.filter((c) =>
      c.parameterIds.some((pId) => readyParameterIds.includes(pId)),
    );
  }, [consumables, readyParameterIds]);

  const parameterPagination = usePagination(
    filteredData,
    parameterPageSize,
    parameterPage,
  );
  const toolPagination = usePagination(filteredTools, toolPageSize, toolPage);
  const bahanPagination = usePagination(
    filteredConsumables,
    bahanPageSize,
    bahanPage,
  );

  const getLinkedParameterNames = (parameterIds: number[]) => {
    return data
      .filter((p) => parameterIds.includes(p.id) && p.ready)
      .map((p) => p.parameter)
      .join(", ");
  };

  const handleReadyChange = (id: number, checked: boolean) => {
    setData(
      data.map((item) => (item.id === id ? { ...item, ready: checked } : item)),
    );
  };

  const handleJumlahChange = (id: number, value: string) => {
    const numValue = Number.parseInt(value) || 0;
    setData(
      data.map((item) =>
        item.id === id ? { ...item, jumlah: numValue } : item,
      ),
    );
  };

  const handleJumlahPeralatanChange = (id: number, value: string) => {
    const numValue = Number.parseInt(value) || 0;
    setData(
      data.map((item) =>
        item.id === id ? { ...item, jumlahPeralatan: numValue } : item,
      ),
    );
  };

  const handleSendNote = () => {
    if (newNote.trim()) {
      const note = {
        id: notes.length + 1,
        author: "You",
        initials: "YO",
        message: newNote,
        timestamp: new Date().toLocaleString("id-ID"),
        type: "note" as const,
      };
      setNotes([...notes, note]);
      setNewNote("");
    }
  };

  const handleToolSelect = (toolId: string, checked: boolean) => {
    setTools(
      tools.map((t) => (t.id === toolId ? { ...t, selected: checked } : t)),
    );
  };

  const handleSelectAllTools = (checked: boolean) => {
    const filteredIds = filteredTools.map((t) => t.id);
    setTools(
      tools.map((t) =>
        filteredIds.includes(t.id) ? { ...t, selected: checked } : t,
      ),
    );
  };

  const selectedToolsCount = tools.filter((t) => t.selected).length;
  const allToolsSelected =
    filteredTools.length > 0 && filteredTools.every((t) => t.selected);
  const someToolsSelected = filteredTools.some((t) => t.selected);

  const handleRequiredChange = (id: number, value: string) => {
    const numValue = Number.parseInt(value) || 0;
    setConsumables(
      consumables.map((c) => {
        if (c.id === id) {
          const newStatus = numValue > c.stock ? "low" : "sufficient";
          return { ...c, required: numValue, status: newStatus };
        }
        return c;
      }),
    );
  };

  const readyParametersCount = data.filter((p) => p.ready).length;

  const outOfStockMaterials = consumables.filter((c) => c.stock === 0);
  const lowStockMaterials = consumables.filter(
    (c) => c.stock > 0 && c.stock <= 5,
  );
  const criticalStockCount =
    outOfStockMaterials.length + lowStockMaterials.length;
  return (
    <div className="flex flex-col gap-4">
      <WorksheetHeaderCard
        title="Rincian parameter"
        subtitle="Sistem manajemen worksheet parameter pengujian"
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
                {filteredConsumables.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 px-1.5 text-xs"
                  >
                    {filteredConsumables.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="stok-habis"
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:gap-2 sm:px-4 sm:text-sm"
              >
                <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Stok Habis</span>
                <span className="sm:hidden">Habis</span>
                {criticalStockCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-1 h-5 px-1.5 text-xs"
                  >
                    {criticalStockCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="catatan"
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:gap-2 sm:px-4 sm:text-sm"
              >
                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Catatan</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Parameter Tab */}
          <TabsContent value="parameter" className="p-3 pt-4 sm:p-4 sm:pt-6">
            <div className="mb-4">
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
            </div>

            <Alert className="mb-4 border-primary/20 bg-primary/5">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                Centang "Ready" pada parameter untuk menampilkan bahan yang
                dibutuhkan di tab <strong>Bahan</strong>. Saat ini{" "}
                <strong>{readyParametersCount}</strong> parameter siap.
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
                        Jenis Pengujian
                      </TableHead>
                      <TableHead className="text-xs font-semibold sm:text-sm">
                        Parameter
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold sm:text-sm">
                        Jumlah
                      </TableHead>
                      <TableHead className="hidden text-xs font-semibold sm:text-sm lg:table-cell">
                        Acuan
                      </TableHead>
                      <TableHead className="hidden text-xs font-semibold sm:text-sm xl:table-cell">
                        Peralatan
                      </TableHead>
                      <TableHead className="hidden text-center text-xs font-semibold sm:table-cell sm:text-sm">
                        Jml Alat
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold sm:text-sm">
                        Ready
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parameterPagination.paginatedData.map((item) => (
                      <TableRow
                        key={item.id}
                        className={`hover:bg-muted/30 ${item.ready ? "bg-emerald-50/50" : ""}`}
                      >
                        <TableCell>
                          <Badge
                            className={`${getClusterColor(item.cluster)} text-xs`}
                          >
                            {item.cluster}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-xs sm:text-sm md:table-cell">
                          {item.jenisPengujian}
                        </TableCell>
                        <TableCell className="text-xs font-medium sm:text-sm">
                          {item.parameter}
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            value={item.jumlah}
                            onChange={(e) =>
                              handleJumlahChange(item.id, e.target.value)
                            }
                            className="mx-auto h-8 w-16 text-center text-xs sm:text-sm"
                            min={0}
                          />
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                          {item.acuan}
                        </TableCell>
                        <TableCell className="hidden text-xs sm:text-sm xl:table-cell">
                          {item.peralatan}
                        </TableCell>
                        <TableCell className="hidden text-center sm:table-cell">
                          <Input
                            type="number"
                            value={item.jumlahPeralatan}
                            onChange={(e) =>
                              handleJumlahPeralatanChange(
                                item.id,
                                e.target.value,
                              )
                            }
                            className="mx-auto h-8 w-16 text-center text-xs sm:text-sm"
                            min={0}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={item.ready}
                            onCheckedChange={(checked) =>
                              handleReadyChange(item.id, checked as boolean)
                            }
                            className="data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
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
                        ID
                      </TableHead>
                      <TableHead className="text-xs font-semibold sm:text-sm">
                        Kode
                      </TableHead>
                      <TableHead className="text-xs font-semibold sm:text-sm">
                        Nama Alat
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
                        className={`cursor-pointer hover:bg-muted/30 ${tool.selected ? "bg-primary/5" : ""}`}
                        onClick={() =>
                          handleToolSelect(tool.id, !tool.selected)
                        }
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={tool.selected}
                            onCheckedChange={(checked) =>
                              handleToolSelect(tool.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {tool.id}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {tool.code}
                        </TableCell>
                        <TableCell className="text-xs font-medium sm:text-sm">
                          {tool.name}
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
            {filteredConsumables.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-medium">
                  Tidak ada bahan yang dibutuhkan
                </h3>
                <p className="text-sm text-muted-foreground">
                  Centang "Ready" pada parameter di tab Parameter untuk
                  menampilkan bahan yang dibutuhkan.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-2 text-center sm:p-3">
                      <p className="text-lg font-bold sm:text-xl">
                        {filteredConsumables.length}
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
                          filteredConsumables.filter(
                            (c) => c.required <= c.stock,
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
                        {
                          filteredConsumables.filter(
                            (c) => c.required > c.stock,
                          ).length
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stok Kurang
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-2 text-center sm:p-3">
                      <p className="text-lg font-bold text-primary sm:text-xl">
                        {filteredConsumables.reduce(
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

                <div className="overflow-hidden rounded-xl border">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs font-semibold sm:text-sm">
                            Nama Bahan
                          </TableHead>
                          <TableHead className="hidden text-xs font-semibold sm:table-cell sm:text-sm">
                            Untuk Parameter
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
                            <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                              {getLinkedParameterNames(item.parameterIds)}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              {item.unit}
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
                                {item.stock}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {item.required === 0 ? (
                                <span className="text-xs text-muted-foreground">
                                  -
                                </span>
                              ) : item.required <= item.stock ? (
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
                    {consumables.length}
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
                    {consumables.filter((c) => c.stock > 5).length}
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
                                {item.unit}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  0
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
                                {item.unit}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-amber-100 text-xs text-amber-700">
                                  {item.stock}
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
                <strong>Catatan:</strong> Bahan dengan stok ≤ 5 dianggap
                menipis. Stok dikelola melalui dashboard inventory. Hubungi
                admin untuk melakukan restocking.
              </p>
            </div>
          </TabsContent>

          {/* Catatan Tab */}
          <TabsContent value="catatan" className="p-3 pt-4 sm:p-4 sm:pt-6">
            <div className="flex h-125 flex-col">
              <ScrollArea className="mb-4 flex-1 pr-4">
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className={`flex gap-3 ${note.author === "You" ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback
                          className={
                            note.author === "You"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }
                        >
                          {note.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`max-w-[80%] flex-1 ${note.author === "You" ? "text-right" : ""}`}
                      >
                        <div
                          className={`inline-block rounded-2xl px-4 py-2 ${
                            note.author === "You"
                              ? "bg-primary text-primary-foreground"
                              : note.type === "warning"
                                ? "bg-amber-100 text-amber-900"
                                : note.type === "important"
                                  ? "bg-red-100 text-red-900"
                                  : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{note.message}</p>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          {note.author !== "You" && (
                            <span className="font-medium">{note.author}</span>
                          )}
                          <span>{note.timestamp}</span>
                          {note.type !== "note" && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                note.type === "warning"
                                  ? "border-amber-300 text-amber-600"
                                  : "border-red-300 text-red-600"
                              }`}
                            >
                              {note.type === "warning"
                                ? "Peringatan"
                                : "Penting"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t pt-4">
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
                    disabled={!newNote.trim()}
                  >
                    <Send className="h-4 w-4" />
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
