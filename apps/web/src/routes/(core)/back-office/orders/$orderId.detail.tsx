/**
 * Admin Order Detail Page
 *
 * Shows order details with 6 workflow states:
 * 1. Pending Approval - Admin reviews and approves/rejects order
 * 2. Approved - Upload Documents - Admin uploads offering letter and invoice
 * 3. Awaiting Payment - Waiting for customer to pay
 * 4. Payment Verification - Admin verifies payment proof from customer
 * 5. Payment Verified - Create Testing - Admin creates testing record
 * 6. Testing Created - Navigate to testing/worksheet management
 */

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
import { useState } from "react";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { queryClient } from "@/utils/trpc";
import { format } from "date-fns";
import { requirePermission } from "@/utils/require-permission";
import { getClusterColor } from "@/lib/cluster-colors";
import { cn } from "@/lib/utils";
import { toFormData } from "@/utils/form-data-mapper";
import { useFileUpload } from "@/hooks/use-file-upload";
import { getPublicUrl } from "@/utils/url";

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

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectPaymentDialogOpen, setRejectPaymentDialogOpen] = useState(false);
  const [paymentRejectReason, setPaymentRejectReason] = useState("");

  // Document upload states
  const offeringLetter = useFileUpload();
  const approvalLetter = useFileUpload();
  const cooperationAgreement = useFileUpload();
  const invoice = useFileUpload();

  const { data: order, isLoading } = useQuery(
    trpc.order.getOrderWithDocumentsAdmin.queryOptions({
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
        setRejectDialogOpen(false);
        setRejectReason("");
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
        setRejectPaymentDialogOpen(false);
        setPaymentRejectReason("");
        globalSuccessToast("Pembayaran berhasil ditolak");
      },
      onError: (error) => {
        globalErrorToast("Gagal menolak pembayaran: " + error.message);
      },
    }),
  );

  // Document upload mutation
  const uploadDocumentMutation = useMutation(
    trpc.document.uploadDocument.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.order.getOrderWithDocumentsAdmin.queryOptions({ orderId }),
        );
        globalSuccessToast("Dokumen berhasil diunggah");
      },
      onError: (error) => {
        globalErrorToast("Gagal mengunggah dokumen: " + error.message);
      },
    }),
  );

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
        globalSuccessToast("Testing berhasil dibuat");
      },
      onError: (error) => {
        globalErrorToast("Gagal membuat testing: " + error.message);
      },
    }),
  );

  // Handlers
  const handleApprove = () => {
    approveMutation.mutate({ orderId });
  };

  const handleRejectApproval = () => {
    if (rejectReason.trim().length < 10) {
      globalErrorToast("Alasan penolakan minimal 10 karakter");
      return;
    }
    rejectApprovalMutation.mutate({ orderId, reason: rejectReason });
  };

  const handleVerifyPayment = () => {
    verifyPaymentMutation.mutate({ orderId });
  };

  const handleRejectPayment = () => {
    if (paymentRejectReason.trim().length < 10) {
      globalErrorToast("Alasan penolakan minimal 10 karakter");
      return;
    }
    rejectPaymentMutation.mutate({ orderId, reason: paymentRejectReason });
  };

  const handleUploadOfferingLetter = async () => {
    if (!offeringLetter.file) return;

    offeringLetter.setUploading(true);
    try {
      const formData = toFormData({
        title: "Surat Penawaran",
        entityType: "order",
        entityId: orderId,
        type: "offering_document",
        file: offeringLetter.file,
      });

      await uploadDocumentMutation.mutateAsync(formData);

      offeringLetter.reset();
    } finally {
      offeringLetter.setUploading(false);
    }
  };

  const handleUploadApprovalLetter = async () => {
    if (!approvalLetter.file) return;

    approvalLetter.setUploading(true);
    try {
      const formData = toFormData({
        title: "Surat Persetujuan",
        entityType: "order",
        entityId: orderId,
        type: "approval_letter",
        file: approvalLetter.file,
      });
      await uploadDocumentMutation.mutateAsync(formData);
      approvalLetter.reset();
    } finally {
      approvalLetter.setUploading(false);
    }
  };

  const handleUploadCooperationAgreement = async () => {
    if (!cooperationAgreement.file) return;

    cooperationAgreement.setUploading(true);
    try {
      const formData = toFormData({
        title: "Perjanjian Kerjasama",
        entityType: "order",
        entityId: orderId,
        type: "cooperation_agreement",
        file: cooperationAgreement.file,
      });
      await uploadDocumentMutation.mutateAsync(formData);
      cooperationAgreement.reset();
    } finally {
      cooperationAgreement.setUploading(false);
    }
  };

  const handleUploadInvoice = async () => {
    if (!invoice.file) return;

    invoice.setUploading(true);
    try {
      const formData = toFormData({
        title: "Invoice",
        entityType: "order",
        entityId: orderId,
        type: "invoice",
        file: invoice.file,
      });
      await uploadDocumentMutation.mutateAsync(formData);
      invoice.reset();
    } finally {
      invoice.setUploading(false);
    }
  };

  const handleNotifyCustomer = () => {
    notifyCustomerMutation.mutate({ orderId });
  };

  const handleCreateTesting = () => {
    createTestingMutation.mutate({ orderId });
  };

  if (isLoading || !order) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasOfferingLetter = order.documents.some(
    (doc) => doc.type === "offering_document",
  );
  const hasApprovalLetter = order.documents.some(
    (doc) => doc.type === "approval_letter",
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
  const hasBothApprovalLetter =
    hasApprovalLetter && hasApprovalLetterUserDocument;
  const hasBothDocuments =
    hasOfferingLetter && hasInvoice && hasBothApprovalLetter;

  // Determine current workflow state
  const isPendingApproval = order.approvalStatus === "pending";
  const isRevisionRequested = order.status === "revision";
  const isApprovedNeedsDocs =
    order.approvalStatus === "approved" &&
    !hasBothDocuments &&
    !isRevisionRequested;
  const isApprovedNeedsApprovalLetter =
    order.approvalStatus === "approved" &&
    hasOfferingLetter &&
    !isRevisionRequested;
  const isAcceptingDocuments =
    order.approvalStatus === "approved" &&
    order.status === "confirmed" &&
    hasBothApprovalLetter &&
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
                    <Button
                      variant="outline"
                      className="border-red-400 bg-red-50 text-red-500 hover:bg-red-100"
                      onClick={() => setRejectDialogOpen(true)}
                    >
                      Tolak Order
                    </Button>
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
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Invoice Upload */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                          <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <Label className="text-base font-medium">
                            Invoice (Revisi)
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Format: PDF
                          </p>
                        </div>
                      </div>
                      {hasInvoice && !invoice.file && (
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
                          <span className="text-sm">{invoice.file.name}</span>
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
                  </div>

                  <div className="flex justify-end pt-4">
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
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {hasOfferingLetter && (
                    <div className="flex justify-end pt-4">
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
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isApprovedNeedsApprovalLetter && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload Surat Persetujuan</CardTitle>
                  <CardDescription>
                    Unggah surat persetujuan untuk melanjutkan ke tahap
                    selanjutnya.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* approval letter upload */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                          <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <Label className="text-base font-medium">
                            Surat Persetujuan
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Format: PDF
                          </p>
                        </div>
                      </div>
                      {hasApprovalLetter ? (
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
                                    (doc) => doc.type === "approval_letter",
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
                    {!hasApprovalLetter && (
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
                                approvalLetter.setFile(file);
                              }
                            }}
                            className="flex-1"
                          />
                          {approvalLetter.file && (
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => approvalLetter.setFile(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {approvalLetter.file && (
                          <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                            <span className="text-sm">
                              {approvalLetter.file.name}
                            </span>
                            <Button
                              size="sm"
                              onClick={handleUploadApprovalLetter}
                              disabled={approvalLetter.uploading}
                            >
                              {approvalLetter.uploading ? (
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
                          <img
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
                        onClick={() => setRejectPaymentDialogOpen(true)}
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
                      {order.testing?.worksheet && (
                        <div>
                          <Label className="text-muted-foreground">
                            Worksheet ({order.testing.worksheet.id})
                          </Label>
                          <Button
                            variant="link"
                            className="h-auto p-0"
                            onClick={() =>
                              navigate({
                                to: "/worksheets",

                                search: {
                                  worksheetId: order.testing!.worksheet.id,
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
                      {!order.testing?.worksheet && (
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
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
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
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
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
        open={rejectPaymentDialogOpen}
        onOpenChange={setRejectPaymentDialogOpen}
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
              value={paymentRejectReason}
              onChange={(e) => setPaymentRejectReason(e.target.value)}
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
