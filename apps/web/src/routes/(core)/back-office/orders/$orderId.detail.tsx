import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Download,
  FileText,
  Loader2,
  Mail,
  Plus,
  Eye,
  Upload,
  X,
} from "lucide-react";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { queryClient } from "@/utils/trpc";
import { format } from "date-fns";
import { requirePermission } from "@/utils/require-permission";
import { PermissionGate } from "@/components/permission-gate";
import { getClusterColor } from "@/lib/cluster-colors";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useFileUpload } from "@/hooks/use-file-upload";
import { getPublicUrl } from "@/utils/url";
import { useUploadDocumentMutation } from "@/hooks/use-upload-document-mutation";
import useDialogs from "@/hooks/use-dialog";
import z from "zod";
import ImageWithFallback from "@/components/image-with-fallback";

// TODO: Approval Doc should not be uploaded by admin/user its from offering doc that has been signed by both parties

export const Route = createFileRoute(
  "/(core)/back-office/orders/$orderId/detail",
)({
  beforeLoad: async ({ context }) => {
    await requirePermission(context, { permission: "orders.read" });
  },
  component: RouteComponent,
});

// Helper functions for status styling
function getOrderStatusBadge(status: string) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    in_progress: "bg-purple-100 text-purple-800",
    completed: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
    revision: "bg-orange-100 text-orange-800",
  };
  return styles[status] || "bg-gray-100 text-gray-800";
}

function getApprovalStatusBadge(status: string) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };
  return styles[status] || "bg-gray-100 text-gray-800";
}

function getPaymentStatusBadge(status: string) {
  const styles: Record<string, string> = {
    unpaid: "bg-orange-100 text-orange-800",
    pending_verification: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };
  return styles[status] || "bg-gray-100 text-gray-800";
}

function RouteComponent() {
  const navigate = useNavigate();
  const { orderId } = Route.useParams();

  const dialogs = useDialogs({
    reject: z.object({
      reason: z
        .string()
        .min(1, "Reason is required")
        .min(10, "Reason must be at least 10 characters")
        .max(500, "Reason must not exceed 500 characters"),
    }),
    rejectPayment: z.object({
      reason: z
        .string()
        .min(1, "Reason is required")
        .min(20, "Payment rejection must be at least 20 characters")
        .max(1000, "Reason must not exceed 1000 characters"),
    }),
  } as const);

  // Document upload states
  const offeringLetter = useFileUpload();
  const cooperationAgreement = useFileUpload();
  const invoice = useFileUpload();

  const { data: order, isLoading } = useQuery(
    trpc.order.getOrderWithDocumentsAdmin.queryOptions({
      orderId,
    }),
  );

  // Fetch worksheet for this order
  const { data: worksheet, isLoading: worksheetLoading } = useQuery(
    trpc.worksheet.getByOrderId.queryOptions({
      orderId,
    }),
  );

  // Approval mutations
  const approveMutation = useMutation(
    trpc.order.approveOrder.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.order.getOrderWithDocumentsAdmin.queryOptions({ orderId }),
        );
        globalSuccessToast("Order berhasil disetujui");
      },
      onError: (error) => {
        globalErrorToast("Gagal menyetujui order: " + error.message);
      },
    }),
  );

  const rejectApprovalMutation = useMutation(
    trpc.order.rejectOrderApproval.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.order.getOrderWithDocumentsAdmin.queryOptions({ orderId }),
        );
        dialogs.close("reject");
        dialogs.reset("reject");
        globalSuccessToast("Order berhasil ditolak");
      },
      onError: (error) => {
        globalErrorToast("Gagal menolak order: " + error.message);
      },
    }),
  );

  // Payment verification mutations
  const verifyPaymentMutation = useMutation(
    trpc.order.verifyPayment.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.order.getOrderWithDocumentsAdmin.queryOptions({ orderId }),
        );
        globalSuccessToast("Pembayaran berhasil diverifikasi");
      },
      onError: (error) => {
        globalErrorToast("Gagal memverifikasi pembayaran: " + error.message);
      },
    }),
  );

  const rejectPaymentMutation = useMutation(
    trpc.order.rejectPayment.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.order.getOrderWithDocumentsAdmin.queryOptions({ orderId }),
        );
        dialogs.close("rejectPayment");
        dialogs.updateData("rejectPayment", { reason: "" });
        globalSuccessToast("Pembayaran berhasil ditolak");
      },
      onError: (error) => {
        globalErrorToast("Gagal menolak pembayaran: " + error.message);
      },
    }),
  );

  // Document upload mutation
  const { uploadDocument } = useUploadDocumentMutation({ orderId });

  // Notify customer mutation
  const notifyCustomerMutation = useMutation(
    trpc.order.notifyCustomer.mutationOptions({
      onSuccess: () => {
        globalSuccessToast("Notifikasi berhasil dikirim ke pelanggan");
      },
      onError: (error) => {
        globalErrorToast("Gagal mengirim notifikasi: " + error.message);
      },
    }),
  );

  // Create testing mutation
  const createTestingMutation = useMutation(
    trpc.order.createTesting.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.order.getOrderWithDocumentsAdmin.queryOptions({ orderId }),
        );
        await queryClient.invalidateQueries(
          trpc.worksheet.getByOrderId.queryOptions({ orderId }),
        );
        globalSuccessToast("Testing berhasil dibuat");
      },
      onError: (error) => {
        globalErrorToast("Gagal membuat testing: " + error.message);
      },
    }),
  );

  // Create worksheet mutation (kaji ulang phase)
  const createWorksheetMutation = useMutation(
    trpc.worksheet.createFromOrder.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(
          trpc.order.getOrderWithDocumentsAdmin.queryOptions({ orderId }),
        );
        await queryClient.invalidateQueries(
          trpc.worksheet.getByOrderId.queryOptions({ orderId }),
        );
        globalSuccessToast("Worksheet berhasil dibuat");
        // Navigate to worksheet detail
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

  // Submit worksheet for verification
  const submitWorksheetMutation = useMutation(
    trpc.worksheet.submitForVerification.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.worksheet.getByOrderId.queryOptions({ orderId }),
        );
        globalSuccessToast("Worksheet berhasil diajukan untuk verifikasi");
      },
      onError: (error) => {
        globalErrorToast("Gagal mengajukan worksheet: " + error.message);
      },
    }),
  );

  // Verify worksheet (coordinator action)
  const verifyWorksheetMutation = useMutation(
    trpc.worksheet.verify.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.worksheet.getByOrderId.queryOptions({ orderId }),
        );
        globalSuccessToast("Worksheet berhasil diverifikasi");
      },
      onError: (error) => {
        globalErrorToast("Gagal memverifikasi worksheet: " + error.message);
      },
    }),
  );

  // Handlers
  const handleApprove = () => {
    approveMutation.mutate({ orderId });
  };

  const handleRejectApproval = () => {
    const result = dialogs.validate("reject");

    if (!result.success) {
      globalErrorToast(
        dialogs.getErrors("reject").reason || "Alasan penolakan tidak valid",
      );
      return;
    }

    const { reason } = result.data;

    rejectApprovalMutation.mutate({ orderId, reason });
  };

  const handleVerifyPayment = () => {
    verifyPaymentMutation.mutate({ orderId });
  };

  const handleRejectPayment = () => {
    const result = dialogs.validate("rejectPayment");

    if (!result.success) {
      globalErrorToast(
        dialogs.getErrors("rejectPayment").reason ||
          "Alasan penolakan tidak valid",
      );
      return;
    }

    const { reason } = result.data;

    rejectPaymentMutation.mutate({ orderId, reason });
  };

  const handleUploadOfferingLetter = async () => {
    if (!offeringLetter.file) return;

    await uploadDocument({
      title: "Surat Penawaran",
      type: "offering_document",
      file: offeringLetter.file,
      onMutate: () => {
        offeringLetter.setUploading(true);
      },
      onSuccess: () => {
        offeringLetter.reset();
      },
      onSettled: () => {
        offeringLetter.setUploading(false);
      },
    });
  };

  const handleUploadCooperationAgreement = async () => {
    if (!cooperationAgreement.file) return;

    await uploadDocument({
      title: "Perjanjian Kerjasama",
      type: "cooperation_agreement",
      file: cooperationAgreement.file,
      onMutate: () => {
        cooperationAgreement.setUploading(true);
      },
      onSuccess: () => {
        cooperationAgreement.reset();
      },
      onSettled: () => {
        cooperationAgreement.setUploading(false);
      },
    });
  };

  const handleUploadInvoice = async () => {
    if (!invoice.file) return;

    await uploadDocument({
      title: "Invoice",
      type: "invoice",
      file: invoice.file,
      onMutate: () => {
        invoice.setUploading(true);
      },
      onSuccess: () => {
        invoice.reset();
      },
      onSettled: () => {
        invoice.setUploading(false);
      },
    });
  };

  const handleNotifyCustomer = () => {
    notifyCustomerMutation.mutate({ orderId });
  };

  const handleCreateTesting = () => {
    createTestingMutation.mutate({ orderId });
  };

  const handleCreateWorksheet = () => {
    createWorksheetMutation.mutate({
      orderId,
      startDate: new Date().toISOString(),
    });
  };

  const handleSubmitWorksheetForVerification = () => {
    if (!worksheet?.id) return;
    submitWorksheetMutation.mutate({ worksheetId: worksheet.id });
  };

  const handleVerifyWorksheet = () => {
    if (!worksheet?.id) return;
    verifyWorksheetMutation.mutate({ worksheetId: worksheet.id });
  };

  if (isLoading || !order) {
    return (
      <Card className="container min-h-[calc(100vh-8rem)]">
        <div className="border-b px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const hasOfferingLetter = order.documents.some(
    (doc) => doc.type === "offering_document",
  );
  const hasApprovalLetterUserDocument = order.documents.some(
    (doc) => doc.type === "approval_letter_user",
  );
  const hasCooperationAgreement = order.documents.some(
    (doc) => doc.type === "cooperation_agreement",
  );
  const hasCooperationAgreementUserDocument = order.documents.some(
    (doc) => doc.type === "cooperation_agreement_user",
  );
  const hasInvoice = order.documents.some((doc) => doc.type === "invoice");
  const hasBothDocuments =
    hasOfferingLetter && hasInvoice && hasApprovalLetterUserDocument;

  // Determine current workflow state
  const isPendingApproval = order.approvalStatus === "pending";
  const isRevisionRequested = order.status === "revision";
  const isApprovedNeedsDocs =
    order.approvalStatus === "approved" &&
    !hasBothDocuments &&
    !isRevisionRequested;
  const isAcceptingDocuments =
    order.approvalStatus === "approved" &&
    order.status === "surat_persetujuan_diproses" &&
    !isRevisionRequested;
  const isAwaitingPayment =
    order.approvalStatus === "approved" &&
    hasBothDocuments &&
    order.paymentStatus === "unpaid" &&
    !isRevisionRequested;
  const isPendingPaymentVerification =
    order.paymentStatus === "pending_verification";
  const isPaymentVerifiedNeedsTesting =
    order.paymentStatus === "paid" && !order.testing;
  const hasTestingCreated = !!order.testing;

  // Worksheet status flags (new flow: worksheet created during kaji ulang)
  const hasWorksheet = !!worksheet;
  const worksheetStatus = worksheet?.status;
  const needsWorksheet = isPendingApproval && !hasWorksheet;
  const worksheetInDraft = hasWorksheet && worksheetStatus === "draft";
  const worksheetPendingVerification =
    hasWorksheet && worksheetStatus === "pending_verification";
  const worksheetVerified = hasWorksheet && worksheetStatus === "verified";

  // Get revision notes from the latest revision status history
  const revisionHistory = order.statusHistory
    ?.filter((h) => h.status === "revision")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];

  return (
    <Card className="container min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Order Detail</h1>
            <p className="text-sm text-muted-foreground">
              Order #{order.orderNumber}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className={getOrderStatusBadge(order.status)}>
              {order.status}
            </Badge>
            <Badge className={getApprovalStatusBadge(order.approvalStatus)}>
              {order.approvalStatus}
            </Badge>
            <Badge className={getPaymentStatusBadge(order.paymentStatus)}>
              {order.paymentStatus}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Order Info */}
          <div className="space-y-6 lg:col-span-2">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
                <CardDescription>
                  {order.items.length} item(s) dalam order ini
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parameter</TableHead>
                      <TableHead>Cluster</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.parameter.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              getClusterColor(
                                item.parameter.category.cluster.name,
                              ),
                            )}
                          >
                            {item.parameter.category.cluster.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          Rp {item.price.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          Rp{" "}
                          {(item.price * item.quantity).toLocaleString("id-ID")}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-bold">
                        Total
                      </TableCell>
                      <TableCell className="text-right text-lg font-bold">
                        Rp {order.totalAmount.toLocaleString("id-ID")}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Workflow State Content */}
            {isPendingApproval && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Pending Approval</CardTitle>
                  <CardDescription>
                    Tinjau detail order dan setujui untuk melanjutkan ke tahap
                    penerbitan dokumen penawaran.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end gap-3">
                    <PermissionGate permission="orders.update">
                      <Button
                        variant="outline"
                        className="border-red-400 bg-red-50 text-red-500 hover:bg-red-100"
                        onClick={() => dialogs.open("reject")}
                      >
                        Tolak Order
                      </Button>
                    </PermissionGate>
                    <PermissionGate permission="orders.approve">
                      <Button
                        className="bg-green-500 hover:bg-green-600"
                        onClick={handleApprove}
                        disabled={approveMutation.isPending}
                      >
                        {approveMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Setujui Order
                      </Button>
                    </PermissionGate>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Worksheet Management Card - Kaji Ulang Phase */}
            {(needsWorksheet ||
              worksheetInDraft ||
              worksheetPendingVerification ||
              worksheetVerified) && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {needsWorksheet && "Buat Worksheet untuk Kaji Ulang"}
                    {worksheetInDraft && "Worksheet dalam Draft"}
                    {worksheetPendingVerification &&
                      "Worksheet Menunggu Verifikasi"}
                    {worksheetVerified && "Worksheet Terverifikasi"}
                  </CardTitle>
                  <CardDescription>
                    {needsWorksheet &&
                      "Buat worksheet untuk melakukan kaji ulang sebelum menerbitkan surat penawaran."}
                    {worksheetInDraft &&
                      "Worksheet sedang diisi. Ajukan untuk verifikasi setelah selesai."}
                    {worksheetPendingVerification &&
                      "Worksheet telah diajukan dan menunggu verifikasi dari koordinator."}
                    {worksheetVerified &&
                      "Worksheet telah diverifikasi. Lanjutkan ke tahap penerbitan surat penawaran."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Worksheet Info */}
                    {hasWorksheet && worksheet && (
                      <div className="rounded-lg border bg-muted/50 p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <Label className="text-muted-foreground">
                              ID Worksheet
                            </Label>
                            <p className="font-medium">
                              {worksheet.id.slice(0, 8).toUpperCase()}
                            </p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">
                              Status
                            </Label>
                            <div className="mt-1">
                              <Badge
                                className={
                                  worksheetStatus === "draft"
                                    ? "bg-gray-100 text-gray-800"
                                    : worksheetStatus === "pending_verification"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : worksheetStatus === "verified"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-blue-100 text-blue-800"
                                }
                              >
                                {worksheetStatus}
                              </Badge>
                            </div>
                          </div>
                          {worksheet.startDate && (
                            <div>
                              <Label className="text-muted-foreground">
                                Tanggal Mulai
                              </Label>
                              <p className="font-medium">
                                {format(new Date(worksheet.startDate), "PPP")}
                              </p>
                            </div>
                          )}
                          {worksheet.mainSupervisor && (
                            <div>
                              <Label className="text-muted-foreground">
                                Pengawas Utama
                              </Label>
                              <p className="font-medium">
                                {worksheet.mainSupervisor.name}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3">
                      {needsWorksheet && (
                        <PermissionGate permission="worksheets.create">
                          <Button
                            className="bg-blue-500 hover:bg-blue-600"
                            onClick={handleCreateWorksheet}
                            disabled={createWorksheetMutation.isPending}
                          >
                            {createWorksheetMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="mr-2 h-4 w-4" />
                            )}
                            Buat Worksheet
                          </Button>
                        </PermissionGate>
                      )}

                      {worksheetInDraft && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() =>
                              navigate({
                                to: "/worksheets",
                                search: { worksheetId: worksheet!.id },
                              })
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Lihat Detail
                          </Button>
                          <PermissionGate permission="worksheets.update">
                            <Button
                              className="bg-yellow-500 hover:bg-yellow-600"
                              onClick={handleSubmitWorksheetForVerification}
                              disabled={submitWorksheetMutation.isPending}
                            >
                              {submitWorksheetMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <FileText className="mr-2 h-4 w-4" />
                              )}
                              Ajukan Verifikasi
                            </Button>
                          </PermissionGate>
                        </>
                      )}

                      {worksheetPendingVerification && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() =>
                              navigate({
                                to: "/worksheets",
                                search: { worksheetId: worksheet!.id },
                              })
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Lihat Detail
                          </Button>
                          <PermissionGate permission="worksheets.verify">
                            <Button
                              className="bg-green-500 hover:bg-green-600"
                              onClick={handleVerifyWorksheet}
                              disabled={verifyWorksheetMutation.isPending}
                            >
                              {verifyWorksheetMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <FileText className="mr-2 h-4 w-4" />
                              )}
                              Verifikasi Worksheet
                            </Button>
                          </PermissionGate>
                        </>
                      )}

                      {worksheetVerified && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            navigate({
                              to: "/worksheets",
                              search: { worksheetId: worksheet!.id },
                            })
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Lihat Worksheet
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isRevisionRequested && (
              <Card>
                <CardHeader>
                  <CardTitle>Permintaan Revisi Dokumen</CardTitle>
                  <CardDescription>
                    Pelanggan meminta revisi dokumen penawaran. Upload dokumen
                    yang sudah direvisi.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Revision Notes from Customer */}
                  {revisionHistory?.note && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                          <FileText className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-amber-800">
                            Catatan Revisi dari Pelanggan
                          </h3>
                          <p className="mt-2 text-sm text-amber-700">
                            {revisionHistory.note}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Offering Letter Upload */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                          <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <Label className="text-base font-medium">
                            Surat Penawaran (Revisi)
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Format: PDF
                          </p>
                        </div>
                      </div>
                      {hasOfferingLetter && !offeringLetter.file && (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800">
                            Dokumen Lama
                          </Badge>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() =>
                              window.open(
                                getPublicUrl(
                                  order.documents.find(
                                    (doc) => doc.type === "offering_document",
                                  )!.fileUrl,
                                ),
                                "_blank",
                              )
                            }
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.type !== "application/pdf") {
                                globalErrorToast("Format file harus PDF");
                                return;
                              }
                              offeringLetter.setFile(file);
                            }
                          }}
                          className="flex-1"
                        />
                        {offeringLetter.file && (
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => offeringLetter.setFile(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {offeringLetter.file && (
                        <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                          <span className="text-sm">
                            {offeringLetter.file.name}
                          </span>
                          <PermissionGate permission="documents.create">
                            <Button
                              size="sm"
                              onClick={handleUploadOfferingLetter}
                              disabled={offeringLetter.uploading}
                            >
                              {offeringLetter.uploading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="mr-2 h-4 w-4" />
                              )}
                              Upload
                            </Button>
                          </PermissionGate>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <PermissionGate permission="notifications.create">
                      <Button
                        className="bg-blue-500 hover:bg-blue-600"
                        onClick={handleNotifyCustomer}
                        disabled={notifyCustomerMutation.isPending}
                      >
                        {notifyCustomerMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="mr-2 h-4 w-4" />
                        )}
                        Kirim Dokumen Revisi ke Pelanggan
                      </Button>
                    </PermissionGate>
                  </div>
                </CardContent>
              </Card>
            )}

            {isApprovedNeedsDocs && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload Surat Penawaran</CardTitle>
                  <CardDescription>
                    Unggah surat penawaran untuk melanjutkan ke tahap
                    selanjutnya.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Offering Letter Upload */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                          <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <Label className="text-base font-medium">
                            Surat Penawaran
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Format: PDF
                          </p>
                        </div>
                      </div>
                      {hasOfferingLetter ? (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800">
                            Sudah Diunggah
                          </Badge>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() =>
                              window.open(
                                getPublicUrl(
                                  order.documents.find(
                                    (doc) => doc.type === "offering_document",
                                  )!.fileUrl,
                                ),
                                "_blank",
                              )
                            }
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Belum Diunggah
                        </Badge>
                      )}
                    </div>

                    {!hasOfferingLetter && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.type !== "application/pdf") {
                                  globalErrorToast("Format file harus PDF");
                                  return;
                                }
                                offeringLetter.setFile(file);
                              }
                            }}
                            className="flex-1"
                          />
                          {offeringLetter.file && (
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => offeringLetter.setFile(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {offeringLetter.file && (
                          <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                            <span className="text-sm">
                              {offeringLetter.file.name}
                            </span>
                            <PermissionGate permission="documents.create">
                              <Button
                                size="sm"
                                onClick={handleUploadOfferingLetter}
                                disabled={offeringLetter.uploading}
                              >
                                {offeringLetter.uploading ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Upload className="mr-2 h-4 w-4" />
                                )}
                                Upload
                              </Button>
                            </PermissionGate>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {hasOfferingLetter && (
                    <div className="flex justify-end pt-4">
                      <PermissionGate permission="notifications.create">
                        <Button
                          className="bg-blue-500 hover:bg-blue-600"
                          onClick={handleNotifyCustomer}
                          disabled={notifyCustomerMutation.isPending}
                        >
                          {notifyCustomerMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Mail className="mr-2 h-4 w-4" />
                          )}
                          Kirim Dokumen ke Pelanggan
                        </Button>
                      </PermissionGate>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isAcceptingDocuments && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Upload Invoice dan Surat Perjanjian Kerjasama
                  </CardTitle>
                  <CardDescription>
                    Unggah dokumen invoice dan perjanjian kerjasama untuk
                    melanjutkan ke tahap selanjutnya.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* cooperation agreement upload */}
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                            <FileText className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <Label className="text-base font-medium">
                              Invoice
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Format: PDF
                            </p>
                          </div>
                        </div>
                        {hasInvoice ? (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800">
                              Sudah Diunggah
                            </Badge>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() =>
                                window.open(
                                  getPublicUrl(
                                    order.documents.find(
                                      (doc) =>
                                        doc.type === "cooperation_agreement",
                                    )!.fileUrl,
                                  ),
                                  "_blank",
                                )
                              }
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Belum Diunggah
                          </Badge>
                        )}
                      </div>
                      {!hasInvoice && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.type !== "application/pdf") {
                                    globalErrorToast("Format file harus PDF");
                                    return;
                                  }
                                  invoice.setFile(file);
                                }
                              }}
                              className="flex-1"
                            />
                            {invoice.file && (
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => invoice.setFile(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {invoice.file && (
                            <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                              <span className="text-sm">
                                {invoice.file.name}
                              </span>
                              <Button
                                size="sm"
                                onClick={handleUploadInvoice}
                                disabled={invoice.uploading}
                              >
                                {invoice.uploading ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Upload className="mr-2 h-4 w-4" />
                                )}
                                Upload
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                            <FileText className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <Label className="text-base font-medium">
                              Surat Perjanjian Kerjasama
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Format: PDF
                            </p>
                          </div>
                        </div>
                        {hasCooperationAgreement ? (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800">
                              Sudah Diunggah
                            </Badge>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() =>
                                window.open(
                                  getPublicUrl(
                                    order.documents.find(
                                      (doc) =>
                                        doc.type === "cooperation_agreement",
                                    )!.fileUrl,
                                  ),
                                  "_blank",
                                )
                              }
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Belum Diunggah
                          </Badge>
                        )}
                      </div>
                      {!hasCooperationAgreement && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.type !== "application/pdf") {
                                    globalErrorToast("Format file harus PDF");
                                    return;
                                  }
                                  cooperationAgreement.setFile(file);
                                }
                              }}
                              className="flex-1"
                            />
                            {cooperationAgreement.file && (
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() =>
                                  cooperationAgreement.setFile(null)
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {cooperationAgreement.file && (
                            <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                              <span className="text-sm">
                                {cooperationAgreement.file.name}
                              </span>
                              <Button
                                size="sm"
                                onClick={handleUploadCooperationAgreement}
                                disabled={cooperationAgreement.uploading}
                              >
                                {cooperationAgreement.uploading ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Upload className="mr-2 h-4 w-4" />
                                )}
                                Upload
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isAwaitingPayment && (
              <Card>
                <CardHeader>
                  <CardTitle>Menunggu Pembayaran Pelanggan</CardTitle>
                  <CardDescription>
                    Dokumen penagihan sudah dikirim. Menunggu pelanggan
                    mengunggah bukti pembayaran.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                      <div className="inline-flex flex-1 items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                          <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <span className="flex-1 font-medium">
                          Surat Penawaran
                        </span>
                        <Button
                          size="icon"
                          className="h-10 w-10 rounded-lg bg-blue-500"
                          onClick={() =>
                            window.open(
                              getPublicUrl(
                                order.documents.find(
                                  (doc) => doc.type === "offering_document",
                                )!.fileUrl,
                              ),
                              "_blank",
                            )
                          }
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="inline-flex flex-1 items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                          <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <span className="flex-1 font-medium">Invoice</span>
                        <Button
                          size="icon"
                          className="h-10 w-10 rounded-lg bg-blue-500"
                          onClick={() =>
                            window.open(
                              getPublicUrl(
                                order.documents.find(
                                  (doc) => doc.type === "invoice",
                                )!.fileUrl,
                              ),
                              "_blank",
                            )
                          }
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="inline-flex flex-1 items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                          <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <span className="flex-1 font-medium">
                          Surat Perjanjian Kerjasama
                        </span>
                        <Button
                          size="icon"
                          className="h-10 w-10 rounded-lg bg-blue-500"
                          onClick={() =>
                            window.open(
                              getPublicUrl(
                                order.documents.find(
                                  (doc) => doc.type === "cooperation_agreement",
                                )!.fileUrl,
                              ),
                              "_blank",
                            )
                          }
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        variant="outline"
                        onClick={handleNotifyCustomer}
                        disabled={notifyCustomerMutation.isPending}
                      >
                        {notifyCustomerMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="mr-2 h-4 w-4" />
                        )}
                        Kirim Ulang Dokumen
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isPendingPaymentVerification && (
              <Card>
                <CardHeader>
                  <CardTitle>Verifikasi Pembayaran</CardTitle>
                  <CardDescription>
                    Pelanggan telah mengunggah bukti pembayaran. Silakan
                    verifikasi pembayaran.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">
                        Diunggah pada
                      </Label>
                      <p className="font-medium">
                        {order.documents.find(
                          (doc) => doc.type === "proof_of_payment",
                        )
                          ? format(
                              new Date(
                                order.documents.find(
                                  (doc) => doc.type === "proof_of_payment",
                                )!.createdAt,
                              ),
                              "PPpp",
                            )
                          : "-"}
                      </p>
                    </div>

                    {order.documents.find(
                      (doc) => doc.type === "proof_of_payment",
                    ) && (
                      <div className="rounded-lg border p-4">
                        {order.documents
                          .find((doc) => doc.type === "proof_of_payment")!
                          .fileUrl.endsWith(".pdf") ? (
                          <div className="flex items-center gap-4">
                            <FileText className="h-12 w-12 text-blue-500" />
                            <div>
                              <p className="font-medium">
                                Bukti Pembayaran (PDF)
                              </p>
                              <Button
                                variant="link"
                                className="h-auto p-0"
                                onClick={() =>
                                  window.open(
                                    getPublicUrl(
                                      order.documents.find(
                                        (doc) =>
                                          doc.type === "proof_of_payment",
                                      )!.fileUrl,
                                    ),
                                    "_blank",
                                  )
                                }
                              >
                                Lihat Dokumen
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <ImageWithFallback
                            src={getPublicUrl(
                              order.documents.find(
                                (doc) => doc.type === "proof_of_payment",
                              )!.fileUrl,
                            )}
                            alt="Bukti pembayaran"
                            className="max-h-96 w-full cursor-pointer rounded object-contain"
                            onClick={() =>
                              window.open(
                                getPublicUrl(
                                  order.documents.find(
                                    (doc) => doc.type === "proof_of_payment",
                                  )!.fileUrl,
                                ),
                                "_blank",
                              )
                            }
                          />
                        )}
                      </div>
                    )}

                    <div>
                      <Label className="text-muted-foreground">
                        Jumlah yang Harus Dibayar
                      </Label>
                      <p className="text-2xl font-bold">
                        Rp {order.totalAmount.toLocaleString("id-ID")}
                      </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        variant="outline"
                        className="border-red-400 bg-red-50 text-red-500 hover:bg-red-100"
                        onClick={() => dialogs.open("rejectPayment")}
                      >
                        Tolak Pembayaran
                      </Button>
                      <Button
                        className="bg-green-500 hover:bg-green-600"
                        onClick={handleVerifyPayment}
                        disabled={verifyPaymentMutation.isPending}
                      >
                        {verifyPaymentMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Verifikasi Pembayaran
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isPaymentVerifiedNeedsTesting && (
              <Card>
                <CardHeader>
                  <CardTitle>Pembayaran Terverifikasi - Buat Testing</CardTitle>
                  <CardDescription>
                    Pembayaran telah diverifikasi. Buat testing record untuk
                    memulai proses pengujian.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div>
                            <Label className="text-muted-foreground">
                              Jumlah Dibayar
                            </Label>
                            <p className="text-2xl font-bold">
                              Rp {order.totalAmount.toLocaleString("id-ID")}
                            </p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">
                              Dibayar pada
                            </Label>
                            <p>
                              {order.paidAt
                                ? format(new Date(order.paidAt), "PPpp")
                                : "-"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>
                          Item Testing ({order.items.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {order.items.slice(0, 5).map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between border-b py-2"
                            >
                              <span className="font-medium">
                                {item.parameter.name}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                Qty: {item.quantity}
                              </span>
                            </div>
                          ))}
                          {order.items.length > 5 && (
                            <p className="pt-2 text-center text-sm text-muted-foreground">
                              +{order.items.length - 5} item lainnya
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-end pt-4">
                      <Button
                        className="bg-blue-500 hover:bg-blue-600"
                        onClick={handleCreateTesting}
                        disabled={createTestingMutation.isPending}
                      >
                        {createTestingMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        Buat Testing Record
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {hasTestingCreated && (
              <Card>
                <CardHeader>
                  <CardTitle>Testing Sedang Berjalan</CardTitle>
                  <CardDescription>
                    Testing record telah dibuat. Lihat detail atau buat
                    worksheet.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div>
                        <Label className="text-muted-foreground">
                          Nomor Testing
                        </Label>
                        <p className="font-medium">
                          {order.testing?.testingNumber ||
                            `TEST-${order.testing?.id.slice(0, 8).toUpperCase()}`}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Status</Label>
                        <div>
                          <Badge className="bg-purple-100 text-purple-800">
                            {order.testing?.status || "pending"}
                          </Badge>
                        </div>
                      </div>
                      {order.worksheet && (
                        <div>
                          <Label className="text-muted-foreground">
                            Worksheet ({order.worksheet.id})
                          </Label>
                          <Button
                            variant="link"
                            className="h-auto p-0"
                            onClick={() =>
                              navigate({
                                to: "/worksheets",

                                search: {
                                  worksheetId: order.worksheet.id,
                                },
                              })
                            }
                          >
                            Lihat Worksheet
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() =>
                          navigate({
                            to: "/back-office/testings/$testingId/detail",
                            params: { testingId: order.testing!.id },
                          })
                        }
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Lihat Detail Testing
                      </Button>
                      {!order.worksheet && (
                        <Button
                          className="bg-blue-500 hover:bg-blue-600"
                          onClick={() =>
                            navigate({
                              to: "/back-office/testings/$testingId/detail",
                              params: { testingId: order.testing!.id },
                              search: { createWorksheet: "true" },
                            })
                          }
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Buat Worksheet
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Customer & Location Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Pelanggan</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-muted-foreground">Nama</dt>
                    <dd className="font-medium">{order.user.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Email</dt>
                    <dd className="font-medium">{order.user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">
                      Perusahaan
                    </dt>
                    <dd className="font-medium">{order.company.name}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* <Card>
              <CardHeader>
                <CardTitle>Lokasi Pengujian</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-muted-foreground">Lokasi</dt>
                    <dd className="font-medium">
                      {order.testingLocation.name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Alamat</dt>
                    <dd className="text-sm">{order.testingLocation.address}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card> */}

            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Dibuat</dt>
                    <dd>
                      {order.createdAt
                        ? format(new Date(order.createdAt), "PPpp")
                        : "-"}
                    </dd>
                  </div>
                  {order.approvedAt && (
                    <div>
                      <dt className="text-muted-foreground">Disetujui</dt>
                      <dd>{format(new Date(order.approvedAt), "PPpp")}</dd>
                    </div>
                  )}
                  {order.paidAt && (
                    <div>
                      <dt className="text-muted-foreground">Dibayar</dt>
                      <dd>{format(new Date(order.paidAt), "PPpp")}</dd>
                    </div>
                  )}
                  {order.completedAt && (
                    <div>
                      <dt className="text-muted-foreground">Selesai</dt>
                      <dd>{format(new Date(order.completedAt), "PPpp")}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Reject Approval Dialog */}
      <AlertDialog
        open={dialogs.isOpen("reject")}
        onOpenChange={(open) =>
          open ? dialogs.open("reject") : dialogs.close("reject")
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Order</AlertDialogTitle>
            <AlertDialogDescription>
              Berikan alasan penolakan order ini. Pelanggan akan menerima
              notifikasi beserta alasan penolakan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              value={dialogs.getData("reject")?.reason ?? ""}
              onChange={(e) =>
                dialogs.updateData("reject", { reason: e.target.value })
              }
              placeholder="Tuliskan alasan penolakan (minimal 10 karakter)"
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectApproval}
              className="bg-red-500 hover:bg-red-600"
              disabled={rejectApprovalMutation.isPending}
            >
              {rejectApprovalMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Tolak Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Payment Dialog */}
      <AlertDialog
        open={dialogs.isOpen("rejectPayment")}
        onOpenChange={(open) =>
          open ? dialogs.open("rejectPayment") : dialogs.close("rejectPayment")
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Pembayaran</AlertDialogTitle>
            <AlertDialogDescription>
              Berikan alasan penolakan pembayaran. Pelanggan akan menerima
              notifikasi beserta alasan penolakan dan dapat mengunggah ulang
              bukti pembayaran.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              value={dialogs.getData("rejectPayment")?.reason ?? ""}
              onChange={(e) =>
                dialogs.updateData("rejectPayment", { reason: e.target.value })
              }
              placeholder="Tuliskan alasan penolakan (minimal 10 karakter)"
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectPayment}
              className="bg-red-500 hover:bg-red-600"
              disabled={rejectPaymentMutation.isPending}
            >
              {rejectPaymentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Tolak Pembayaran
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
