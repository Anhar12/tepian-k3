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
  WorksheetHeaderCard,
  WorksheetHeaderCardSkeleton,
} from "@/components/worksheet-header-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getClusterColor } from "@/lib/cluster-colors";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { queryClient, trpc, trpcClient } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  TESTING_DOCUMENT_TYPES,
  TESTING_STATUSES,
  TESTING_STATUS_COLORS,
  TESTING_STATUS_LABELS,
  type TestingDocumentType,
  type TestingStatus,
} from "@tepian-k3/constants";
import { format } from "date-fns";
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  FileText,
  FlaskConical,
  Loader2,
  MapPin,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import z from "zod";

const searchSchema = z.object({
  createWorksheet: z.string().optional(),
});

export const Route = createFileRoute(
  "/(core)/back-office/testings/$testingId/detail",
)({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "testing.read" }),
  head: () => pageHead("Detail Pengujian"),
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const { testingId } = Route.useParams();
  const { createWorksheet } = Route.useSearch();

  const [activeTab, setActiveTab] = useState<
    "info" | "items" | "worksheets" | "documents"
  >("info");

  // Document upload states
  const [selectedDocType, setSelectedDocType] =
    useState<TestingDocumentType>("testing_report");
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: testing, isLoading } = useQuery(
    trpc.pengujian.testing.getTestingWithDocuments.queryOptions({ testingId }),
  );

  // Open worksheet dialog if URL param is set
  useEffect(() => {
    if (createWorksheet === "true") {
      setActiveTab("worksheets");
    }
  }, [createWorksheet]);

  const updateStatusMutation = useMutation(
    trpc.pengujian.testing.updateStatus.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.testing.getTestingWithDocuments.queryOptions({
            testingId,
          }),
        );
        globalSuccessToast("Status testing berhasil diperbarui");
      },
      onError: (error) => {
        globalErrorToast("Gagal memperbarui status: " + error.message);
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

      await trpcClient.pengujian.testing.uploadDocument.mutate(formData);

      await queryClient.invalidateQueries(
        trpc.pengujian.testing.getTestingWithDocuments.queryOptions({
          testingId,
        }),
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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <WorksheetHeaderCardSkeleton />
        <Card>
          <div className="px-3 py-2">
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-24" />
              ))}
            </div>
          </div>
          <CardContent className="p-4">
            <div className="grid gap-6 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="space-y-3 p-4">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!testing) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <FlaskConical className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">Pengujian tidak ditemukan</p>
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
        title={`Pengujian ${testing.testingNumber}`}
        subtitle={`${testing.order?.company?.name || "Perusahaan"} - ${TESTING_STATUS_LABELS[testing.status as TestingStatus]}`}
        actionButton={[]}
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
              {/* Pengujian Info */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold">
                    <FlaskConical className="h-5 w-5 text-primary" />
                    Informasi Pengujian
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        No. Pengujian
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
                        {format(testing.createdAt, "dd MMM yyyy HH:mm")}
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
                  Pengujian ini belum memiliki item parameter.
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

          {/* Documents Tab */}
          <TabsContent value="documents" className="p-3 pt-4 sm:p-4 sm:pt-6">
            {/* Upload Form */}
            <Card className="mb-6 border-dashed border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <Upload className="h-5 w-5 text-primary" />
                  Unggah Dokumen Pengujian
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
                            {format(doc.createdAt, "dd MMM yyyy")}
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
    </div>
  );
}
