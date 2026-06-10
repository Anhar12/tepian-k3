import { ConfirmationDialog } from "@/components/confirmation-dialog";
import ImageWithFallback from "@/components/image-with-fallback";
import { PermissionGate } from "@/components/permission-gate";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useDialogs from "@/hooks/use-dialog";
import { usePermissions } from "@/hooks/use-permissions";
import { getClusterColor } from "@/lib/cluster-colors";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { openBase64InNewTab } from "@/utils/download";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { queryClient, trpc } from "@/utils/trpc";
import { getPublicUrl } from "@/utils/url";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ORDER_STATUS_LABELS } from "@tepian-k3/constants";
import { format } from "date-fns";
import {
  Check,
  Download,
  Eye,
  FileText,
  Loader2,
  Mail,
  Plus,
} from "lucide-react";
import { useState } from "react";
import z from "zod";
import AdminDocumentsCard from "./-components/admin-documents-card";
import PublishInvoiceDialog from "./-components/publish-invoice-dialog";

export const Route = createFileRoute(
  "/(core)/back-office/orders/$orderId/detail",
)({
  beforeLoad: async ({ context }) => {
    await requirePermission(context, { permission: "orders.read" });
  },
  head: () => pageHead("Detail Pesanan"),
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
    revision: "bg-orange-100 text-orange-800",
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
    reviseWorksheet: z.object({
      revisionNotes: z
        .string()
        .min(1, "Revision notes are required")
        .min(20, "Revision notes must be at least 20 characters")
        .max(1000, "Revision notes must not exceed 1000 characters"),
    }),
    requestContactRevision: z.object({
      revisionNote: z
        .string()
        .min(1, "Catatan revisi wajib diisi")
        .min(10, "Catatan revisi minimal 10 karakter")
        .max(500, "Catatan revisi maksimal 500 karakter"),
    }),
  } as const);

  const [publishInvoiceOpen, setPublishInvoiceOpen] = useState(false);

  const { hasPermission } = usePermissions();

  const { data: order, isLoading } = useQuery(
    trpc.pengujian.order.getOrderWithDocumentsAdmin.queryOptions({
      orderId,
    }),
  );

  // Fetch worksheet for this order
  const { data: worksheet } = useQuery(
    trpc.pengujian.worksheet.getByOrderId.queryOptions({
      orderId,
    }),
  );

  // Approval mutations
  const approveMutation = useMutation(
    trpc.pengujian.order.approveOrder.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.order.getOrderWithDocumentsAdmin.queryOptions({
            orderId,
          }),
        );
        globalSuccessToast("Order berhasil disetujui");
      },
      onError: (error) => {
        globalErrorToast("Gagal menyetujui order: " + error.message);
      },
    }),
  );

  const revertRevisionMutation = useMutation(
    trpc.pengujian.order.adminRevertRevisionToPending.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.order.getOrderWithDocumentsAdmin.queryOptions({
            orderId,
          }),
        );
        globalSuccessToast("Order dikembalikan ke antrean persetujuan");
      },
      onError: (error) => {
        globalErrorToast("Gagal mengembalikan order: " + error.message);
      },
    }),
  );

  const rejectApprovalMutation = useMutation(
    trpc.pengujian.order.rejectOrderApproval.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.order.getOrderWithDocumentsAdmin.queryOptions({
            orderId,
          }),
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

  const requestContactRevisionMutation = useMutation(
    trpc.pengujian.order.requestApprovalRevision.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.order.getOrderWithDocumentsAdmin.queryOptions({
            orderId,
          }),
        );
        dialogs.close("requestContactRevision");
        dialogs.reset("requestContactRevision");
        globalSuccessToast("Permintaan koreksi data berhasil dikirim");
      },
      onError: (error) => {
        globalErrorToast("Gagal mengirim permintaan koreksi: " + error.message);
      },
    }),
  );

  // Kepala Balai offering review (status === "penawaran_review")
  const [reviseOfferingOpen, setReviseOfferingOpen] = useState(false);
  const [reviseOfferingNote, setReviseOfferingNote] = useState("");

  const previewOfferingMutation = useMutation(
    trpc.pengujian.generateDocument.generateOfferingLetter.mutationOptions({
      onSuccess: (data: { base64: string; contentType: string }) => {
        openBase64InNewTab(data.base64, data.contentType);
      },
      onError: (error: { message: string }) => {
        globalErrorToast("Gagal membuka pratinjau penawaran: " + error.message);
      },
    }),
  );

  const approveOfferingMutation = useMutation(
    trpc.pengujian.order.approveOffering.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.order.getOrderWithDocumentsAdmin.queryOptions({
            orderId,
          }),
        );
        globalSuccessToast(
          "Penawaran disetujui. Admin dapat mencetak penawaran.",
        );
      },
      onError: (error) => {
        globalErrorToast("Gagal menyetujui penawaran: " + error.message);
      },
    }),
  );

  const reviseOfferingMutation = useMutation(
    trpc.pengujian.order.reviseOffering.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.order.getOrderWithDocumentsAdmin.queryOptions({
            orderId,
          }),
        );
        setReviseOfferingOpen(false);
        setReviseOfferingNote("");
        globalSuccessToast("Penawaran dikembalikan ke Admin untuk revisi.");
      },
      onError: (error) => {
        globalErrorToast("Gagal meminta revisi penawaran: " + error.message);
      },
    }),
  );

  // Payment verification mutations
  const verifyPaymentMutation = useMutation(
    trpc.pengujian.order.verifyPayment.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.order.getOrderWithDocumentsAdmin.queryOptions({
            orderId,
          }),
        );
        globalSuccessToast("Pembayaran berhasil diverifikasi");
      },
      onError: (error) => {
        globalErrorToast("Gagal memverifikasi pembayaran: " + error.message);
      },
    }),
  );

  const rejectPaymentMutation = useMutation(
    trpc.pengujian.order.rejectPayment.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.order.getOrderWithDocumentsAdmin.queryOptions({
            orderId,
          }),
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

  // Notify customer mutation — documentType selects which document's notification to send.
  // To support a new document type, add an entry to order.notification-config.ts on the API.
  const notifyCustomerMutation = useMutation(
    trpc.pengujian.order.notifyCustomer.mutationOptions({
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
    trpc.pengujian.order.createTesting.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.order.getOrderWithDocumentsAdmin.queryOptions({
            orderId,
          }),
        );
        await queryClient.invalidateQueries(
          trpc.pengujian.worksheet.getByOrderId.queryOptions({ orderId }),
        );
        globalSuccessToast("Pengujian berhasil dibuat");
      },
      onError: (error) => {
        globalErrorToast("Gagal membuat pengujian: " + error.message);
      },
    }),
  );

  // Create worksheet mutation (kaji ulang phase)
  const createWorksheetMutation = useMutation(
    trpc.pengujian.worksheet.createFromOrder.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(
          trpc.pengujian.order.getOrderWithDocumentsAdmin.queryOptions({
            orderId,
          }),
        );
        await queryClient.invalidateQueries(
          trpc.pengujian.worksheet.getByOrderId.queryOptions({ orderId }),
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
    trpc.pengujian.worksheet.submitForVerification.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.worksheet.getByOrderId.queryOptions({ orderId }),
        );
        globalSuccessToast("Worksheet berhasil diajukan untuk verifikasi");
      },
      onError: (error) => {
        globalErrorToast("Gagal mengajukan worksheet: " + error.message);
      },
    }),
  );

  // Revise worksheet (coordinator action)
  const reviseWorksheetMutation = useMutation(
    trpc.pengujian.worksheet.requestRevision.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.worksheet.getByOrderId.queryOptions({ orderId }),
        );

        dialogs.close("reviseWorksheet");
        dialogs.updateData("reviseWorksheet", { revisionNotes: "" });
        globalSuccessToast("Worksheet berhasil direvisi");
      },
      onError: (error) => {
        globalErrorToast("Gagal merevisi worksheet: " + error.message);
      },
    }),
  );

  // Verify worksheet (coordinator action)
  const verifyWorksheetMutation = useMutation(
    trpc.pengujian.worksheet.verify.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.worksheet.getByOrderId.queryOptions({ orderId }),
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
    if (!order?.worksheet)
      return globalErrorToast(
        "Order belum melewati tahapan kaji ulang, worksheet belum dibuat, tidak dapat menyetujui order",
      );

    if (order.worksheet.status !== "verified")
      return globalErrorToast(
        "Worksheet belum diverifikasi, tidak dapat menyetujui order",
      );

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

    if (!order?.worksheet)
      return globalErrorToast(
        "Order belum melewati tahapan kaji ulang, worksheet belum dibuat, tidak dapat menolak order",
      );

    const { reason } = result.data;

    rejectApprovalMutation.mutate({ orderId, reason });
  };

  const handleRequestContactRevision = () => {
    const result = dialogs.validate("requestContactRevision");

    if (!result.success) {
      globalErrorToast(
        dialogs.getErrors("requestContactRevision").revisionNote ||
          "Catatan revisi tidak valid",
      );
      return;
    }

    requestContactRevisionMutation.mutate({
      orderId,
      revisionNote: result.data.revisionNote,
    });
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

  const handleReviseWorksheet = () => {
    const result = dialogs.validate("reviseWorksheet");

    if (!result.success) {
      globalErrorToast(
        dialogs.getErrors("reviseWorksheet").revisionNotes ||
          "Catatan revisi tidak valid",
      );
      return;
    }

    const { revisionNotes } = result.data;

    if (!worksheet?.id) {
      globalErrorToast("Worksheet tidak ditemukan");
      return;
    }

    reviseWorksheetMutation.mutate({
      worksheetId: worksheet.id,
      revisionNotes,
    });
  };

  const handleNotifyCustomer = (
    documentType: Parameters<
      typeof notifyCustomerMutation.mutate
    >[0]["documentType"],
  ) => {
    notifyCustomerMutation.mutate({ orderId, documentType });
  };

  const handleCreateTesting = () => {
    if (!worksheet?.isPersonnelDateSet)
      return globalErrorToast(
        "Jadwal dan personel belum ditetapkan oleh Tim Penjadwalan. Tidak dapat membuat testing.",
      );

    if (!order?.documents.some((doc) => doc.type === "assignment_letter"))
      return globalErrorToast(
        "Dokumen SPT belum diunggah. Tidak dapat membuat testing.",
      );

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
  const hasInvoice = order.documents.some((doc) => doc.type === "invoice");

  // Determine current workflow state
  const isPendingApproval = order.approvalStatus === "pending";
  const isApprovalRevisionRequested = order.approvalStatus === "revision";
  const isApprovalRequestReview = order.approvalStatus === "request_review";
  const isRevisionRequested = order.status === "revision";
  const isAwaitingPayment =
    order.approvalStatus === "approved" &&
    hasOfferingLetter &&
    hasInvoice &&
    order.paymentStatus === "unpaid" &&
    !isRevisionRequested;
  const isPendingPaymentVerification =
    hasInvoice &&
    hasApprovalLetterUserDocument &&
    order.paymentStatus === "pending_verification";
  const isPaymentVerified = order.paymentStatus === "paid";
  const isPaymentVerifiedNeedsTesting =
    order.paymentStatus === "paid" && !order.testing;
  const hasTestingCreated = !!order.testing;

  // "Buat Pengujian" may only run after Tim Penjadwalan has set the schedule +
  // personnel and the SPT document has been uploaded — keeping the milestone
  // order jadwal → SPT → pengujian.
  const isSchedulingDone = !!worksheet?.isPersonnelDateSet;
  const hasSPTDocument = order.documents.some(
    (doc) => doc.type === "assignment_letter",
  );
  const canCreateTesting = isSchedulingDone && hasSPTDocument;
  const createTestingLockReason = !isSchedulingDone
    ? "Tunggu Tim Penjadwalan menetapkan jadwal dan personel."
    : "Tunggu dokumen SPT diunggah terlebih dahulu.";

  // Worksheet status flags (new flow: worksheet created during kaji ulang)
  const hasWorksheet = !!worksheet;
  const worksheetStatus = worksheet?.status;
  const needsWorksheet = isPendingApproval && !hasWorksheet;
  const worksheetInDraft = hasWorksheet && worksheetStatus === "draft";
  const worksheetInRevision = hasWorksheet && worksheetStatus === "revision";
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
                          {item.parameter?.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              getClusterColor(
                                item.parameter?.category?.cluster?.name ?? "",
                              ),
                            )}
                          >
                            {item.parameter?.category?.cluster?.name ?? "-"}
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

            {/* Admin document hub: Cetak + Upload for Penawaran/Invoice/SPK/SPT */}
            <AdminDocumentsCard
              orderId={orderId}
              orderStatus={order.status}
              orderNumber={order.orderNumber}
              orderDate={order.createdAt}
              documents={order.documents}
              worksheetId={worksheet?.id}
              offeringLetterNumber={worksheet?.offeringLetterNumber}
              offeringLetterDate={worksheet?.offeringLetterDate}
              billingCode={worksheet?.billingCode}
              billingExpiryDate={worksheet?.billingExpiryDate}
            />

            {/* Kepala Balai: review the offering submitted by Admin Manager */}
            {order.status === "penawaran_review" && (
              <PermissionGate
                permission={[
                  "documents-penawaran.review",
                  "documents-penawaran.approve",
                ]}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Persetujuan Penawaran
                    </CardTitle>
                    <CardDescription>
                      Admin telah mengajukan penawaran. Tinjau pratinjau lalu
                      setujui agar Admin dapat mencetak, atau kembalikan untuk
                      revisi.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      variant="outline"
                      disabled={
                        !worksheet?.id || previewOfferingMutation.isPending
                      }
                      onClick={() => {
                        if (worksheet?.id) {
                          previewOfferingMutation.mutate({
                            worksheetId: worksheet.id,
                            letterNumber: worksheet.offeringLetterNumber ?? "-",
                            adminEmail: "",
                            adminContact: "",
                          });
                        }
                      }}
                    >
                      {previewOfferingMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="mr-2 h-4 w-4" />
                      )}
                      Lihat Pratinjau Penawaran
                    </Button>

                    <div className="flex gap-2">
                      <PermissionGate permission="documents-penawaran.review">
                        <Button
                          variant="outline"
                          className="border-amber-400 bg-amber-50 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                          onClick={() => setReviseOfferingOpen(true)}
                        >
                          Revisi
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="documents-penawaran.approve">
                        <Button
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                          disabled={approveOfferingMutation.isPending}
                          onClick={() =>
                            approveOfferingMutation.mutate({ orderId })
                          }
                        >
                          {approveOfferingMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="mr-2 h-4 w-4" />
                          )}
                          Setujui Penawaran
                        </Button>
                      </PermissionGate>
                    </div>
                  </CardContent>
                </Card>

                {/* Revise offering dialog */}
                <AlertDialog open={reviseOfferingOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revisi Penawaran</AlertDialogTitle>
                      <AlertDialogDescription>
                        Penawaran akan dikembalikan ke Admin Manager untuk
                        diperbaiki. Tuliskan catatan revisi (min. 10 karakter).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-2">
                      <Textarea
                        value={reviseOfferingNote}
                        onChange={(e) => setReviseOfferingNote(e.target.value)}
                        placeholder="Tuliskan alasan revisi penawaran..."
                        rows={4}
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => setReviseOfferingOpen(false)}
                      >
                        Batal
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="border border-amber-400 bg-amber-50 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                        disabled={
                          reviseOfferingMutation.isPending ||
                          reviseOfferingNote.trim().length < 10
                        }
                        onClick={() =>
                          reviseOfferingMutation.mutate({
                            orderId,
                            revisionNotes: reviseOfferingNote,
                          })
                        }
                      >
                        {reviseOfferingMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Kirim Revisi
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </PermissionGate>
            )}

            {/* Workflow State Content */}
            {/* Card shows only if the user holds at least one of its actions */}
            <PermissionGate
              permission={[
                "orders-approval.reject",
                "orders-approval.review",
                "orders-approval.approve",
              ]}
            >
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
                      <PermissionGate permission="orders-approval.reject">
                        <Button
                          variant="outline"
                          className="border-red-400 bg-red-50 text-red-500 hover:bg-red-100"
                          onClick={() => dialogs.open("reject")}
                        >
                          Tolak Order
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="orders-approval.review">
                        <Button
                          variant="outline"
                          className="border-orange-400 bg-orange-50 text-orange-600 hover:bg-orange-100"
                          onClick={() => dialogs.open("requestContactRevision")}
                        >
                          Minta Koreksi Data
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="orders-approval.approve">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={0}>
                              <Button
                                className="bg-green-500 hover:bg-green-600"
                                onClick={handleApprove}
                                disabled={
                                  approveMutation.isPending ||
                                  !worksheetVerified
                                }
                              >
                                {approveMutation.isPending && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Setujui Order
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {!worksheetVerified && (
                            <TooltipContent>
                              Worksheet harus diverifikasi terlebih dahulu
                              sebelum menyetujui order.
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </PermissionGate>
                    </div>
                  </CardContent>
                </Card>
              )}
            </PermissionGate>

            {/* Customer Submitted Review Request Card */}
            <PermissionGate permission="orders-approval.review">
              {isApprovalRequestReview && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-blue-800">
                      Pelanggan Telah Mengirimkan Koreksi
                    </CardTitle>
                    <CardDescription className="text-blue-700">
                      Pelanggan telah memperbaiki data kontak dan meminta
                      konfirmasi. Periksa dan terima koreksi untuk melanjutkan
                      proses persetujuan.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {order.revisionNotes && (
                      <div className="rounded-lg border border-blue-200 bg-white p-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          Catatan koreksi sebelumnya:
                        </p>
                        <p className="mt-1 text-sm text-foreground">
                          {order.revisionNotes}
                        </p>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <PermissionGate permission="orders-approval.review">
                        <Button
                          variant="outline"
                          className="border-orange-400 bg-orange-50 text-orange-600 hover:bg-orange-100"
                          onClick={() => dialogs.open("requestContactRevision")}
                        >
                          Kirim Ulang Koreksi
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="orders-approval.review">
                        <Button
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() =>
                            revertRevisionMutation.mutate({ orderId })
                          }
                          disabled={revertRevisionMutation.isPending}
                        >
                          {revertRevisionMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Terima & Kembalikan ke Antrean
                        </Button>
                      </PermissionGate>
                    </div>
                  </CardContent>
                </Card>
              )}
            </PermissionGate>

            {/* Approval Revision Requested Card */}
            <PermissionGate permission="orders-approval.review">
              {isApprovalRevisionRequested && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="text-orange-800">
                      Menunggu Koreksi Data dari Pelanggan
                    </CardTitle>
                    <CardDescription className="text-orange-700">
                      Permintaan koreksi data kontak telah dikirim. Menunggu
                      pelanggan memperbaiki dan mengirim ulang order.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {order.revisionNotes && (
                      <div className="rounded-lg border border-orange-200 bg-white p-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          Catatan yang dikirim ke pelanggan:
                        </p>
                        <p className="mt-1 text-sm text-foreground">
                          {order.revisionNotes}
                        </p>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <PermissionGate permission="orders-approval.review">
                        <Button
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() =>
                            revertRevisionMutation.mutate({ orderId })
                          }
                          disabled={revertRevisionMutation.isPending}
                        >
                          {revertRevisionMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Kembalikan ke Antrean
                        </Button>
                      </PermissionGate>
                    </div>
                  </CardContent>
                </Card>
              )}
            </PermissionGate>

            {/* Worksheet Management Card - Kaji Ulang Phase */}
            <PermissionGate
              permission={[
                "worksheets.read",
                "worksheets.create",
                "worksheets.update",
                "worksheets.verify",
              ]}
            >
              {(needsWorksheet ||
                worksheetInDraft ||
                worksheetInRevision ||
                worksheetPendingVerification ||
                worksheetVerified) && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {needsWorksheet && "Buat Worksheet untuk Kaji Ulang"}
                      {worksheetInDraft && "Worksheet dalam Draft"}
                      {worksheetInRevision && "Worksheet dalam Revisi"}
                      {worksheetPendingVerification &&
                        "Worksheet Menunggu Verifikasi"}
                      {worksheetVerified && "Worksheet Terverifikasi"}
                    </CardTitle>
                    <CardDescription>
                      {needsWorksheet &&
                        "Buat worksheet untuk melakukan kaji ulang sebelum menerbitkan surat penawaran."}
                      {worksheetInDraft &&
                        "Worksheet sedang diisi. Ajukan untuk verifikasi setelah selesai."}
                      {worksheetInRevision &&
                        "Worksheet direvisi oleh koordinator. Perbaiki sesuai catatan revisi dan ajukan kembali."}
                      {worksheetPendingVerification &&
                        "Worksheet telah diajukan dan menunggu verifikasi dari koordinator."}
                      {worksheetVerified &&
                        "Worksheet telah diverifikasi. Lanjutkan ke tahap penerbitan surat penawaran."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Revision Notes from coordinator */}
                      {worksheetInRevision && worksheet?.revisionNotes && (
                        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                          <p className="text-xs font-medium text-muted-foreground">
                            Catatan revisi dari koordinator:
                          </p>
                          <p className="mt-1 text-sm text-foreground">
                            {worksheet.revisionNotes}
                          </p>
                        </div>
                      )}

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
                                      : worksheetStatus ===
                                          "pending_verification"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : worksheetStatus === "verified"
                                          ? "bg-green-100 text-green-800"
                                          : worksheetStatus === "revision"
                                            ? "bg-orange-100 text-orange-800"
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

                        {worksheetInRevision && (
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
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span tabIndex={0}>
                                    <Button
                                      className="bg-yellow-500 hover:bg-yellow-600"
                                      onClick={
                                        handleSubmitWorksheetForVerification
                                      }
                                      disabled={
                                        submitWorksheetMutation.isPending
                                      }
                                    >
                                      {submitWorksheetMutation.isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <FileText className="mr-2 h-4 w-4" />
                                      )}
                                      Ajukan Verifikasi
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                              </Tooltip>
                            </PermissionGate>
                          </>
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
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span tabIndex={0}>
                                    <Button
                                      className="bg-yellow-500 hover:bg-yellow-600"
                                      onClick={
                                        handleSubmitWorksheetForVerification
                                      }
                                      disabled={
                                        submitWorksheetMutation.isPending
                                      }
                                    >
                                      {submitWorksheetMutation.isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <FileText className="mr-2 h-4 w-4" />
                                      )}
                                      Ajukan Verifikasi
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                              </Tooltip>
                            </PermissionGate>
                          </>
                        )}

                        {worksheetPendingVerification && (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => {
                                if (
                                  hasPermission(
                                    "worksheets-transaction-details.read",
                                  )
                                ) {
                                  navigate({
                                    to: "/worksheets/detail-transaksi",
                                    search: { worksheetId: worksheet.id },
                                  });
                                } else if (
                                  hasPermission(
                                    "worksheets-personnel-assignments.read",
                                  )
                                ) {
                                  navigate({
                                    to: "/worksheets/jadwal-personel",
                                    search: { worksheetId: worksheet.id },
                                  });
                                } else if (hasPermission("worksheets.read")) {
                                  navigate({
                                    to: "/worksheets",
                                    search: { worksheetId: worksheet.id },
                                  });
                                }
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Lihat Detail
                            </Button>
                            <PermissionGate permission="worksheets.verify">
                              <ConfirmationDialog
                                open={dialogs.isOpen("reviseWorksheet")}
                                onOpenChange={(isOpen) =>
                                  isOpen
                                    ? dialogs.open("reviseWorksheet")
                                    : dialogs.close("reviseWorksheet")
                                }
                                title="Revisi Worksheet"
                                description="Apakah Anda yakin ingin merevisi worksheet ini? Berikan catatan revisi untuk pelanggan."
                                isLoading={reviseWorksheetMutation.isPending}
                                onConfirm={handleReviseWorksheet}
                                trigger={
                                  <Button className="bg-yellow-500 hover:bg-yellow-600">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Revisi Worksheet
                                  </Button>
                                }
                                children={
                                  <div className="space-y-2">
                                    <Label>Catatan Revisi</Label>
                                    <Textarea
                                      placeholder="Jelaskan apa yang perlu direvisi oleh pelanggan..."
                                      value={
                                        dialogs.getData("reviseWorksheet")
                                          ?.revisionNotes ?? ""
                                      }
                                      onChange={(e) =>
                                        dialogs.updateData("reviseWorksheet", {
                                          revisionNotes: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                }
                              />
                            </PermissionGate>
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
                            onClick={() => {
                              if (
                                hasPermission(
                                  "worksheets-transaction-details.read",
                                )
                              ) {
                                navigate({
                                  to: "/worksheets/detail-transaksi",
                                  search: { worksheetId: worksheet.id },
                                });
                              } else if (
                                hasPermission(
                                  "worksheets-personnel-assignments.read",
                                )
                              ) {
                                navigate({
                                  to: "/worksheets/jadwal-personel",
                                  search: { worksheetId: worksheet.id },
                                });
                              } else if (hasPermission("worksheets.read")) {
                                navigate({
                                  to: "/worksheets",
                                  search: { worksheetId: worksheet.id },
                                });
                              }
                            }}
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
            </PermissionGate>

            <PermissionGate permission="notifications.update">
              {isRevisionRequested && (
                <Card>
                  <CardHeader>
                    <CardTitle>Permintaan Revisi Dokumen</CardTitle>
                    <CardDescription>
                      Pelanggan meminta revisi dokumen penawaran. Cetak ulang
                      penawaran melalui panel dokumen di atas, lalu kirim
                      notifikasi ke pelanggan.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
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

                    <div className="flex justify-end">
                      <Button
                        className="bg-blue-500 hover:bg-blue-600"
                        onClick={() =>
                          handleNotifyCustomer("offering_document")
                        }
                        disabled={notifyCustomerMutation.isPending}
                      >
                        {notifyCustomerMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="mr-2 h-4 w-4" />
                        )}
                        Kirim Dokumen Revisi ke Pelanggan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </PermissionGate>

            <PermissionGate permission="orders-approval.approve">
              {order.approvalStatus === "approved" &&
                !isRevisionRequested &&
                worksheet && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Disetujui</CardTitle>
                      <CardDescription>
                        Order telah disetujui. Tim administrasi sedang
                        menyiapkan dokumen penawaran dan invoice.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          onClick={() =>
                            navigate({
                              to: "/worksheets",
                              search: { worksheetId: worksheet.id },
                            })
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Lihat Detail Transaksi
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
            </PermissionGate>

            {/* Bendahara Penerimaan: issue invoice & SPK */}
            {order.status === "persetujuan_disetujui" && worksheet && (
              <PermissionGate permission="orders-payment.verify">
                <Card>
                  <CardHeader>
                    <CardTitle>Invoice &amp; SPK</CardTitle>
                    <CardDescription>
                      Klik tombol di bawah untuk memasukkan kode billing dan
                      tanggal kadaluarsa agar Admin dapat mencetak dokumen.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setPublishInvoiceOpen(true)}>
                      <Download className="mr-2 h-4 w-4" />
                      Buat Invoice &amp; SPK
                    </Button>
                  </CardContent>
                </Card>
              </PermissionGate>
            )}
            {worksheet && (
              <PublishInvoiceDialog
                worksheetId={worksheet.id}
                orderId={orderId}
                isOpen={publishInvoiceOpen}
                setIsOpen={setPublishInvoiceOpen}
              />
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
                        onClick={() => handleNotifyCustomer("invoice")}
                        disabled={notifyCustomerMutation.isPending}
                      >
                        {notifyCustomerMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="mr-2 h-4 w-4" />
                        )}
                        Kirim Pengingat ke Pelanggan
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <PermissionGate
              permission={["orders-payment.reject", "orders-payment.verify"]}
            >
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
                              className="size-64 cursor-pointer rounded object-contain"
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
                        <PermissionGate permission="orders-payment.reject">
                          <Button
                            variant="outline"
                            className="border-red-400 bg-red-50 text-red-500 hover:bg-red-100"
                            onClick={() => dialogs.open("rejectPayment")}
                          >
                            Tolak Pembayaran
                          </Button>
                        </PermissionGate>
                        <PermissionGate permission="orders-payment.verify">
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
                        </PermissionGate>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </PermissionGate>

            {isPaymentVerified && hasWorksheet && (
              <Card>
                <CardHeader>
                  <CardTitle>Buat Penjadwalan dan SPT</CardTitle>
                  <CardDescription>
                    Worksheet telah dibuat. Lihat detail worksheet dan buat
                    penjadwalan serta SPT untuk memulai proses pengujian.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">
                        Nomor Worksheet
                      </Label>
                      <p className="font-medium">
                        {worksheet.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">
                        Status Worksheet
                      </Label>
                      <div>
                        <Badge className="bg-purple-100 text-purple-800">
                          {worksheet.status ?? "pending"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (
                            hasPermission("worksheets-transaction-details.read")
                          ) {
                            navigate({
                              to: "/worksheets/detail-transaksi",
                              search: { worksheetId: worksheet.id },
                            });
                          } else if (
                            hasPermission(
                              "worksheets-personnel-assignments.read",
                            )
                          ) {
                            navigate({
                              to: "/worksheets/jadwal-personel",
                              search: { worksheetId: worksheet.id },
                            });
                          } else {
                            navigate({
                              to: "/worksheets",
                              search: { worksheetId: worksheet.id },
                            });
                          }
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Lihat Worksheet
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isPaymentVerifiedNeedsTesting && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Pembayaran Terverifikasi - Buat Pengujian
                  </CardTitle>
                  <CardDescription>
                    Pembayaran telah diverifikasi. Buat pengujian untuk memulai
                    proses pengujian.
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
                                {item.parameter?.name ?? "-"}
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
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span tabIndex={0}>
                            <Button
                              className="bg-blue-500 hover:bg-blue-600"
                              onClick={handleCreateTesting}
                              disabled={
                                createTestingMutation.isPending ||
                                !canCreateTesting
                              }
                            >
                              {createTestingMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="mr-2 h-4 w-4" />
                              )}
                              Buat Pengujian
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {!canCreateTesting && (
                          <TooltipContent>
                            {createTestingLockReason}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {hasTestingCreated && (
              <Card>
                <CardHeader>
                  <CardTitle>Pengujian Sedang Berjalan</CardTitle>
                  <CardDescription>
                    Pengujian telah dibuat. Lihat detail atau buat worksheet.
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
                    <dt className="text-sm text-muted-foreground">
                      Perusahaan
                    </dt>
                    <dd className="font-medium">
                      {order.company?.name || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">
                      Alamat Perusahaan
                    </dt>
                    <dd className="font-medium">
                      {order.company?.address || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">
                      Email Perusahaan
                    </dt>
                    <dd className="font-medium">
                      {order.company?.email || "-"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-muted-foreground">
                      Nama Pimpinan
                    </dt>
                    <dd className="font-medium">
                      {order.company?.headOfCompany || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">
                      Jabatan Pimpinan
                    </dt>
                    <dd className="font-medium">
                      {order.company?.headOfCompanyPosition || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Nama PIC</dt>
                    <dd className="font-medium">
                      {order.company?.responsibleTestingPerson || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Email PIC</dt>
                    <dd className="font-medium">
                      {order.company?.responsibleTestingPersonEmail || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">No WA PIC</dt>
                    <dd className="font-medium">
                      {order.company?.responsibleTestingPersonPhone || "-"}
                    </dd>
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
                {order.statusHistory && order.statusHistory.length > 0 ? (
                  <ol className="relative border-l border-muted-foreground/20">
                    {order.statusHistory.map((entry) => (
                      <li key={entry.id} className="mb-6 ml-4 last:mb-0">
                        <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-background bg-muted-foreground/40" />
                        <p className="text-sm font-medium">
                          {ORDER_STATUS_LABELS[
                            entry.status as keyof typeof ORDER_STATUS_LABELS
                          ] ?? entry.status}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(entry.createdAt), "dd MMM yyyy")}
                          {" · "}
                          {format(new Date(entry.createdAt), "HH:mm")}
                        </p>
                        {entry.changedByUser?.name && (
                          <p className="text-xs text-muted-foreground">
                            {entry.changedByUser.name}
                          </p>
                        )}
                        {entry.note && (
                          <p className="mt-1 text-xs text-muted-foreground/80 italic">
                            {entry.note}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Belum ada riwayat status.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Request Contact Revision Dialog */}
      <AlertDialog
        open={dialogs.isOpen("requestContactRevision")}
        onOpenChange={(open) =>
          open
            ? dialogs.open("requestContactRevision")
            : dialogs.close("requestContactRevision")
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Minta Koreksi Data Kontak</AlertDialogTitle>
            <AlertDialogDescription>
              Beritahu pelanggan data kontak mana yang perlu diperbaiki (mis.
              typo pada email atau nama contact person). Pelanggan akan
              memperbaiki profil perusahaan mereka lalu mengirim ulang order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              value={
                dialogs.getData("requestContactRevision")?.revisionNote ?? ""
              }
              onChange={(e) =>
                dialogs.updateData("requestContactRevision", {
                  revisionNote: e.target.value,
                })
              }
              placeholder="Contoh: Email contact person sepertinya salah, mohon diperbaiki (minimal 10 karakter)"
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRequestContactRevision}
              className="border-orange-400 bg-orange-500 hover:bg-orange-600"
              disabled={requestContactRevisionMutation.isPending}
            >
              {requestContactRevisionMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Kirim Permintaan Koreksi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
