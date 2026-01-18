import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WorksheetHeaderCard } from "@/components/worksheet-header-card";
import { getClusterColor } from "@/lib/cluster-colors";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { requirePermission } from "@/utils/require-permission";
import { queryClient, trpc, trpcClient } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import {
  TESTING_DOCUMENT_TYPES,
  TESTING_STATUSES,
  TESTING_STATUS_COLORS,
  TESTING_STATUS_LABELS,
  WORKSHEET_STATUS_COLORS,
  WORKSHEET_STATUS_LABELS,
  type TestingDocumentType,
  type TestingStatus,
  type WorksheetStatus,
} from "@tepian-k3/constants";
import {
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  FileText,
  FlaskConical,
  Loader2,
  MapPin,
  Plus,
  Upload,
  UserCheck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import z from "zod";

const searchSchema = z.object({
  createWorksheet: z.string().optional(),
});

export const Route = createFileRoute(
  "/(core)/back-office/testing/$testingId/detail",
)({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "testing.read" }),
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const navigate = useNavigate();
  const { testingId } = Route.useParams();
  const { createWorksheet } = Route.useSearch();

  const [activeTab, setActiveTab] = useState<
    "info" | "items" | "worksheets" | "documents"
  >("info");

  // Worksheet creation dialog
  const [worksheetDialogOpen, setWorksheetDialogOpen] = useState(false);
  const [worksheetStartDate, setWorksheetStartDate] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [selectedMainSupervisor, setSelectedMainSupervisor] =
    useState<string>("");
  const [selectedAccompanyingSupervisor, setSelectedAccompanyingSupervisor] =
    useState<string>("");

  // Document upload states
  const [selectedDocType, setSelectedDocType] =
    useState<TestingDocumentType>("testing_report");
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: testing, isLoading } = useQuery(
    trpc.testing.getTestingWithDocuments.queryOptions({ testingId }),
  );

  // Get worksheets for this testing
  const { data: worksheets, isLoading: worksheetsLoading } = useQuery(
    trpc.worksheet.getWorksheetsByTestingId.queryOptions({ testingId }),
  );

  // Get employees for supervisor selection
  const { data: employees } = useQuery(trpc.employee.getAll.queryOptions());

  // Open worksheet dialog if URL param is set
  useEffect(() => {
    if (createWorksheet === "true") {
      setWorksheetDialogOpen(true);
      setActiveTab("worksheets");
    }
  }, [createWorksheet]);

  const updateStatusMutation = useMutation(
    trpc.testing.updateStatus.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.testing.getTestingWithDocuments.queryOptions({ testingId }),
        );
        globalSuccessToast("Status testing berhasil diperbarui");
      },
      onError: (error) => {
        globalErrorToast("Gagal memperbarui status: " + error.message);
      },
    }),
  );

  const createWorksheetMutation = useMutation(
    trpc.worksheet.createFromTesting.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(
          trpc.worksheet.getWorksheetsByTestingId.queryOptions({ testingId }),
        );
        await queryClient.invalidateQueries(
          trpc.testing.getTestingWithDocuments.queryOptions({ testingId }),
        );
        setWorksheetDialogOpen(false);
        globalSuccessToast("Worksheet berhasil dibuat");
        // Navigate to the new worksheet detail
        navigate({
          to: "/worksheets",
          search: {
            worksheetId: data.id,
          },
        });
      },
      onError: (error) => {
        globalErrorToast("Gagal membuat worksheet: " + error.message);
      },
    }),
  );

  const handleUploadDocument = async () => {
    if (!documentFile || !documentTitle.trim()) {
      globalErrorToast("Judul dan file dokumen wajib diisi");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("testingId", testingId);
      formData.append("documentType", selectedDocType);
      formData.append("title", documentTitle);
      formData.append("file", documentFile);

      await trpcClient.testing.uploadDocument.mutate(formData);

      await queryClient.invalidateQueries(
        trpc.testing.getTestingWithDocuments.queryOptions({ testingId }),
      );

      // Reset form
      setDocumentTitle("");
      setDocumentFile(null);
      globalSuccessToast("Dokumen berhasil diunggah");
    } catch (error) {
      globalErrorToast(
        "Gagal mengunggah dokumen: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setUploading(false);
    }
  };

  const handleCreateWorksheet = () => {
    createWorksheetMutation.mutate({
      testingId,
      startDate: new Date(worksheetStartDate).toISOString(),
      mainSupervisorId: selectedMainSupervisor || undefined,
      accompanyingSupervisorId: selectedAccompanyingSupervisor || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!testing) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <FlaskConical className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">Testing tidak ditemukan</p>
        <Button variant="outline" onClick={() => router.history.back()}>
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  const documents = testing.documents || [];

  return (
    <div className="flex flex-col gap-4">
      <WorksheetHeaderCard
        title={`Testing ${testing.testingNumber}`}
        subtitle={`${testing.order?.company?.name || "Perusahaan"} - ${TESTING_STATUS_LABELS[testing.status as TestingStatus]}`}
      />

      <Card>
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="w-full"
        >
          <div className="scrollbar-hide overflow-x-auto px-3">
            <TabsList className="h-auto w-full min-w-max flex-nowrap justify-start bg-muted/30 p-1">
              <TabsTrigger
                value="info"
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:gap-2 sm:px-4 sm:text-sm"
              >
                <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Informasi</span>
              </TabsTrigger>
              <TabsTrigger
                value="items"
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:gap-2 sm:px-4 sm:text-sm"
              >
                <ClipboardList className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Parameter</span>
                {testing.items && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 px-1.5 text-xs"
                  >
                    {testing.items.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="worksheets"
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:gap-2 sm:px-4 sm:text-sm"
              >
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Worksheet</span>
                {worksheets && worksheets.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 px-1.5 text-xs"
                  >
                    {worksheets.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:gap-2 sm:px-4 sm:text-sm"
              >
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Dokumen</span>
                {documents.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 px-1.5 text-xs"
                  >
                    {documents.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Info Tab */}
          <TabsContent value="info" className="p-3 pt-4 sm:p-4 sm:pt-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Testing Info */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold">
                    <FlaskConical className="h-5 w-5 text-primary" />
                    Informasi Testing
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        No. Testing
                      </span>
                      <span className="font-mono text-sm font-medium">
                        {testing.testingNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Status
                      </span>
                      <Badge
                        className={`${TESTING_STATUS_COLORS[testing.status]} text-xs`}
                      >
                        {TESTING_STATUS_LABELS[testing.status]}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Tanggal Dibuat
                      </span>
                      <span className="text-sm">
                        {new Date(testing.createdAt).toLocaleDateString(
                          "id-ID",
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                    {testing.note && (
                      <div className="border-t pt-3">
                        <span className="text-sm text-muted-foreground">
                          Catatan:
                        </span>
                        <p className="mt-1 text-sm">{testing.note}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Company Info */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold">
                    <Building2 className="h-5 w-5 text-primary" />
                    Informasi Perusahaan
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Nama
                      </span>
                      <span className="text-sm font-medium">
                        {testing.order?.company?.name || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        No. Order
                      </span>
                      <span className="font-mono text-sm">
                        {testing.order?.orderNumber || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        User
                      </span>
                      <span className="text-sm">
                        {testing.order?.user?.name || "-"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Update Status */}
              <Card className="border-0 shadow-sm md:col-span-2">
                <CardContent className="p-4">
                  <h3 className="mb-4 font-semibold">Update Status</h3>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <Label className="mb-2 block text-sm">Status Baru</Label>
                      <Select
                        value={testing.status}
                        onValueChange={(value) =>
                          updateStatusMutation.mutate({
                            testingId,
                            status: value as TestingStatus,
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TESTING_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {TESTING_STATUS_LABELS[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {updateStatusMutation.isPending && (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Items Tab */}
          <TabsContent value="items" className="p-3 pt-4 sm:p-4 sm:pt-6">
            {!testing.items?.length ? (
              <div className="py-12 text-center">
                <ClipboardList className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-medium">
                  Tidak ada parameter testing
                </h3>
                <p className="text-sm text-muted-foreground">
                  Testing ini belum memiliki item parameter.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-semibold sm:text-sm">
                          Parameter
                        </TableHead>
                        <TableHead className="hidden text-xs font-semibold sm:text-sm md:table-cell">
                          Cluster
                        </TableHead>
                        <TableHead className="text-xs font-semibold sm:text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            Lokasi
                          </div>
                        </TableHead>
                        <TableHead className="text-center text-xs font-semibold sm:text-sm">
                          Qty
                        </TableHead>
                        <TableHead className="hidden text-right text-xs font-semibold sm:text-sm lg:table-cell">
                          Harga
                        </TableHead>
                        <TableHead className="text-right text-xs font-semibold sm:text-sm">
                          Subtotal
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testing.items.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/30">
                          <TableCell className="text-xs font-medium sm:text-sm">
                            {item.parameter?.name || "-"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge
                              className={`${getClusterColor(item.parameter?.category?.cluster?.name || "")} text-xs`}
                            >
                              {item.parameter?.category?.cluster?.name || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {item.location?.name || "-"}
                          </TableCell>
                          <TableCell className="text-center text-xs sm:text-sm">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="hidden text-right text-xs lg:table-cell">
                            {Number(item.price).toLocaleString("id-ID", {
                              style: "currency",
                              currency: "IDR",
                              minimumFractionDigits: 0,
                            })}
                          </TableCell>
                          <TableCell className="text-right text-xs font-medium sm:text-sm">
                            {Number(item.subTotal).toLocaleString("id-ID", {
                              style: "currency",
                              currency: "IDR",
                              minimumFractionDigits: 0,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Worksheets Tab */}
          <TabsContent value="worksheets" className="p-3 pt-4 sm:p-4 sm:pt-6">
            {/* Create Worksheet Button */}
            <div className="mb-4 flex justify-end">
              <Button
                onClick={() => setWorksheetDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Buat Worksheet Baru
              </Button>
            </div>

            {worksheetsLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Memuat worksheet...
                </p>
              </div>
            ) : !worksheets?.length ? (
              <div className="py-12 text-center">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-medium">
                  Belum ada worksheet
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Buat worksheet untuk memulai proses pengujian.
                </p>
                <Button
                  onClick={() => setWorksheetDialogOpen(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Buat Worksheet
                </Button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-semibold sm:text-sm">
                          ID
                        </TableHead>
                        <TableHead className="text-xs font-semibold sm:text-sm">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            Supervisor Utama
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
                      {worksheets.map((worksheet) => (
                        <TableRow
                          key={worksheet.id}
                          className="cursor-pointer transition-colors hover:bg-muted/30"
                        >
                          <TableCell className="font-mono text-xs font-medium sm:text-sm">
                            {worksheet.id.slice(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            {worksheet.mainSupervisor?.user?.name || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${WORKSHEET_STATUS_COLORS[worksheet.status]} text-xs`}
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
                                {new Date(
                                  worksheet.startDate,
                                ).toLocaleDateString("id-ID", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              {worksheet.endDate && (
                                <span>
                                  Selesai:{" "}
                                  {new Date(
                                    worksheet.endDate,
                                  ).toLocaleDateString("id-ID", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button asChild size="sm" variant="outline">
                              <Link
                                to="/worksheets"
                                search={{ worksheetId: worksheet.id }}
                              >
                                <Eye className="mr-1 h-4 w-4" />
                                <span className="hidden sm:inline">Detail</span>
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="p-3 pt-4 sm:p-4 sm:pt-6">
            {/* Upload Form */}
            <Card className="mb-6 border-dashed border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <Upload className="h-5 w-5 text-primary" />
                  Unggah Dokumen Testing
                </h3>
                <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                  <div>
                    <Label className="mb-2 block text-sm">Tipe Dokumen</Label>
                    <Select
                      value={selectedDocType}
                      onValueChange={(v) =>
                        setSelectedDocType(v as TestingDocumentType)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TESTING_DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm">Judul Dokumen</Label>
                    <Input
                      placeholder="Masukkan judul dokumen"
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm">File</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        onChange={(e) =>
                          setDocumentFile(e.target.files?.[0] || null)
                        }
                        className="flex-1"
                      />
                      {documentFile && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDocumentFile(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {documentFile && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {documentFile.name} (
                        {(documentFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleUploadDocument}
                      disabled={uploading || !documentFile || !documentTitle}
                      className="w-full gap-2"
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Unggah
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents List */}
            {documents.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-medium">Belum ada dokumen</h3>
                <p className="text-sm text-muted-foreground">
                  Unggah dokumen testing menggunakan form di atas.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-semibold sm:text-sm">
                          Dokumen
                        </TableHead>
                        <TableHead className="hidden text-xs font-semibold sm:text-sm md:table-cell">
                          Tipe
                        </TableHead>
                        <TableHead className="hidden text-xs font-semibold sm:text-sm lg:table-cell">
                          Tanggal
                        </TableHead>
                        <TableHead className="text-xs font-semibold sm:text-sm">
                          Status
                        </TableHead>
                        <TableHead className="text-center text-xs font-semibold sm:text-sm">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <div>
                                <p className="text-xs font-medium sm:text-sm">
                                  {doc.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {doc.fileName}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="text-xs">
                              {TESTING_DOCUMENT_TYPES.find(
                                (t) => t.value === doc.type,
                              )?.label || doc.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                            {new Date(doc.createdAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                doc.status === "signed" ||
                                doc.status === "verified"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }
                            >
                              {doc.status === "signed" ? (
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                              ) : null}
                              {doc.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                                className="h-8 w-8 p-0"
                              >
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Eye className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                                className="h-8 w-8 p-0"
                              >
                                <a href={doc.fileUrl} download>
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Create Worksheet Dialog */}
      <Dialog open={worksheetDialogOpen} onOpenChange={setWorksheetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Worksheet Baru</DialogTitle>
            <DialogDescription>
              Buat worksheet untuk testing {testing.testingNumber}. Worksheet
              akan berisi semua parameter dari testing items.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <Input
                type="datetime-local"
                value={worksheetStartDate}
                onChange={(e) => setWorksheetStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Supervisor Utama (Opsional)</Label>
              <Select
                value={selectedMainSupervisor}
                onValueChange={setSelectedMainSupervisor}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih supervisor utama" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tidak ada</SelectItem>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.user?.name} - {emp.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Supervisor Pendamping (Opsional)</Label>
              <Select
                value={selectedAccompanyingSupervisor}
                onValueChange={setSelectedAccompanyingSupervisor}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih supervisor pendamping" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tidak ada</SelectItem>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.user?.name} - {emp.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">
                <strong>{testing.items?.length || 0}</strong> parameter akan
                ditambahkan ke worksheet.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWorksheetDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleCreateWorksheet}
              disabled={createWorksheetMutation.isPending}
            >
              {createWorksheetMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Buat Worksheet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
