import { OrderDetailSkeleton } from "@/components/order-detail-skeleton";
import { OrderTimeline } from "@/components/order-timeline";
import {
  StatusStateAwaitingInvoice,
  StatusStateAwaitingSchedule,
  StatusStateCancelled,
  StatusStateCompleted,
  StatusStateOfferPublished,
  StatusStatePendingPaymentVerification,
  StatusStatePendingReview,
  StatusStateRejected,
  StatusStateTestingInProgress,
  StatusStateUploadApproval,
  StatusStateUploadPayment,
  StatusStateContactRevisionRequested,
  StatusStateRequestReview,
  StatusStateWaitingForRevision,
  StatusStateWorksheetInReview,
  StatusStateWorksheetVerified,
} from "@/components/status-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useFileUpload } from "@/hooks/use-file-upload";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { pageHead } from "@/utils/page-head";
import { queryClient, trpc, trpcClient } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import z from "zod";

export const Route = createFileRoute("/(core)/pengujian/status")({
  validateSearch: z.object({
    orderId: z.uuidv7(),
  }),
  beforeLoad: async ({ search }) => {
    // check if orderId exists
    if (!search.orderId) {
      throw redirect({
        to: "/pengujian",
      });
    }
  },
  head: () => pageHead("Pengujian - Status"),
  component: RouteComponent,
});

function RouteComponent() {
  const { orderId } = Route.useSearch();

  // Dialog State
  const [openAcceptDialog, setOpenAcceptDialog] = useState(false);
  const [openReviseDialog, setOpenReviseDialog] = useState(false);
  const [reviseReason, setReviseReason] = useState("");
  const [openCancelDialog, setOpenCancelDialog] = useState(false);

  // File upload state
  const approvalLetterFile = useFileUpload();

  // Payment upload state
  const paymentProofFile = useFileUpload();
  const cooperationAgreementFile = useFileUpload();

  const { data: orderDetail, isLoading } = useQuery(
    trpc.pengujian.order.getOrderWithDocuments.queryOptions({
      orderId,
    }),
  );

  const acceptOfferMutation = useMutation(
    trpc.pengujian.order.acceptOffer.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.order.getOrderWithDocuments.queryOptions({
            orderId,
          }),
        );
        globalSuccessToast("Penawaran berhasil disetujui.");
      },
      onError: (error) => {
        globalErrorToast("Gagal menyetujui penawaran: " + error.message);
      },
      onSettled: () => {
        setOpenAcceptDialog(false);
      },
    }),
  );

  const reviseOfferMutation = useMutation(
    trpc.pengujian.order.reviseOrder.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.order.getOrderWithDocuments.queryOptions({
            orderId,
          }),
        );
        globalSuccessToast("Permintaan revisi berhasil dikirim.");
      },
      onError: (error) => {
        globalErrorToast("Gagal mengirim permintaan revisi: " + error.message);
      },
      onSettled: () => {
        setOpenReviseDialog(false);
        setReviseReason("");
      },
    }),
  );

  const cancelOrderMutation = useMutation(
    trpc.pengujian.order.cancelOrder.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.order.getOrderWithDocuments.queryOptions({
            orderId,
          }),
        );
        globalSuccessToast("Order pengujian berhasil dibatalkan.");
      },
      onError: (error) => {
        globalErrorToast("Gagal membatalkan order pengujian: " + error.message);
      },
      onSettled: () => {
        setOpenCancelDialog(false);
      },
    }),
  );

  const handleUploadApprovalLetter = async () => {
    if (!approvalLetterFile.file) return;

    approvalLetterFile.setUploading(true);
    try {
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("file", approvalLetterFile.file);

      await trpcClient.pengujian.order.uploadApprovalLetter.mutate(formData);
      await queryClient.invalidateQueries(
        trpc.pengujian.order.getOrderWithDocuments.queryOptions({
          orderId,
        }),
      );
      globalSuccessToast("Surat persetujuan berhasil diunggah.");
      approvalLetterFile.reset();
    } catch (error) {
      globalErrorToast(
        "Gagal mengunggah surat persetujuan: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      approvalLetterFile.setUploading(false);
    }
  };

  const handleUploadPaymentDocs = async () => {
    if (!paymentProofFile.file || !cooperationAgreementFile.file) return;

    paymentProofFile.setUploading(true);
    cooperationAgreementFile.setUploading(true);
    try {
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("paymentProof", paymentProofFile.file);
      formData.append("cooperationAgreement", cooperationAgreementFile.file);

      await trpcClient.pengujian.order.uploadPaymentDocuments.mutate(formData);
      await queryClient.invalidateQueries(
        trpc.pengujian.order.getOrderWithDocuments.queryOptions({
          orderId,
        }),
      );
      globalSuccessToast("Dokumen pembayaran berhasil diunggah.");
      paymentProofFile.reset();
      cooperationAgreementFile.reset();
    } catch (error) {
      globalErrorToast(
        "Gagal mengunggah dokumen pembayaran: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      paymentProofFile.setUploading(false);
      cooperationAgreementFile.setUploading(false);
    }
  };

  const {
    offeringDoc,
    approvalLetterUserDoc,
    cooperationAgreementDoc,
    cooperationAgreementUserDoc,
    invoiceDoc,
    paymentProofDoc,
  } = useMemo(() => {
    const offeringDoc = orderDetail?.documents.find(
      (doc) => doc.type === "offering_document",
    );
    const approvalLetterUserDoc = orderDetail?.documents.find(
      (doc) => doc.type === "approval_letter_user",
    );
    const cooperationAgreementDoc = orderDetail?.documents.find(
      (doc) => doc.type === "cooperation_agreement",
    );
    const cooperationAgreementUserDoc = orderDetail?.documents.find(
      (doc) => doc.type === "cooperation_agreement_user",
    );
    const invoiceDoc = orderDetail?.documents.find(
      (doc) => doc.type === "invoice",
    );
    const paymentProofDoc = orderDetail?.documents.find(
      (doc) => doc.type === "proof_of_payment",
    );

    return {
      offeringDoc,
      approvalLetterUserDoc,
      cooperationAgreementDoc,
      cooperationAgreementUserDoc,
      invoiceDoc,
      paymentProofDoc,
    };
  }, [orderDetail?.documents]);

  if (isLoading || !orderDetail) {
    return <OrderDetailSkeleton />;
  }

  // Order status flags
  const isCompleted = orderDetail.status === "completed";
  const isRejected = orderDetail.status === "rejected";
  const isCancelled = orderDetail.status === "cancelled";
  const isRevisionStatus = orderDetail.status === "revision";
  const isApprovalRevision = orderDetail.approvalStatus === "revision";
  const isApprovalRequestReview =
    orderDetail.approvalStatus === "request_review";
  const isApproved = !!orderDetail.approvedAt;
  const hasApprovalLetter = !!approvalLetterUserDoc;
  const hasInvoice = !!invoiceDoc;
  const hasCooperationAgreement = !!cooperationAgreementDoc;
  const hasPaymentProof = !!paymentProofDoc;
  const isPaymentRejected = orderDetail.paymentStatus === "rejected";
  const isPendingPaymentVerification =
    orderDetail.paymentStatus === "pending_verification";
  const isPaymentVerified = orderDetail.paymentStatus === "paid";
  const isInProgress =
    orderDetail.status === "menunggu_penerbitan_spt_jadwal" ||
    orderDetail.status === "proses_pengambilan_sampel" ||
    orderDetail.status === "sampel_dalam_proses_penyerahan" ||
    orderDetail.status === "sampel_telah_dianalisis" ||
    orderDetail.status === "sampel_selesai_dianalisis" ||
    orderDetail.status === "laporan_diterbitkan";
  const freshlySubmitted = orderDetail.status === "pending" && !offeringDoc;

  // Worksheet status flags
  const hasWorksheet = !!orderDetail.worksheet;
  const worksheetStatus = orderDetail.worksheet?.status;
  const isWorksheetInReview =
    hasWorksheet &&
    (worksheetStatus === "draft" || worksheetStatus === "pending_verification");
  const isWorksheetRevision = hasWorksheet && worksheetStatus === "revision";
  const isWorksheetRejected = hasWorksheet && worksheetStatus === "rejected";
  const isWorksheetVerified = hasWorksheet && worksheetStatus === "verified";

  // Get revision notes from the latest revision status history
  const revisionHistory = orderDetail.statusHistory
    ?.filter((h) => h.status === "revision")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];

  function renderStatusContent() {
    if (!orderDetail) return null;
    if (isCompleted) {
      return <StatusStateCompleted orderDetail={orderDetail} />;
    }
    if (isRejected) {
      return <StatusStateRejected orderDetail={orderDetail} />;
    }
    if (isCancelled) {
      return <StatusStateCancelled orderDetail={orderDetail} />;
    }
    if (isInProgress) {
      return <StatusStateTestingInProgress orderDetail={orderDetail} />;
    }
    if (isPaymentVerified) {
      return <StatusStateAwaitingSchedule />;
    }
    if (isPaymentRejected) {
      return (
        <StatusStateUploadPayment
          invoiceDoc={invoiceDoc}
          cooperationAgreementDoc={cooperationAgreementDoc}
          paymentProofFile={paymentProofFile.file}
          setPaymentProofFile={paymentProofFile.setFile}
          cooperationAgreementFile={cooperationAgreementFile.file}
          setCooperationAgreementFile={cooperationAgreementFile.setFile}
          uploadingPaymentDocs={
            paymentProofFile.uploading || cooperationAgreementFile.uploading
          }
          handleUploadPaymentDocs={handleUploadPaymentDocs}
          rejectionReason={orderDetail.paymentRejectedReason}
        />
      );
    }
    if (isPendingPaymentVerification) {
      return (
        <StatusStatePendingPaymentVerification
          cooperationAgreementUserDoc={cooperationAgreementUserDoc}
          paymentProofDoc={paymentProofDoc}
        />
      );
    }
    if (
      isApproved &&
      hasApprovalLetter &&
      hasInvoice &&
      hasCooperationAgreement &&
      !hasPaymentProof
    ) {
      return (
        <StatusStateUploadPayment
          invoiceDoc={invoiceDoc}
          cooperationAgreementDoc={cooperationAgreementDoc}
          paymentProofFile={paymentProofFile.file}
          setPaymentProofFile={paymentProofFile.setFile}
          cooperationAgreementFile={cooperationAgreementFile.file}
          setCooperationAgreementFile={cooperationAgreementFile.setFile}
          uploadingPaymentDocs={
            paymentProofFile.uploading || cooperationAgreementFile.uploading
          }
          handleUploadPaymentDocs={handleUploadPaymentDocs}
        />
      );
    }
    if (isApprovalRequestReview) {
      return <StatusStateRequestReview orderDetail={orderDetail} />;
    }
    if (isApprovalRevision) {
      return <StatusStateContactRevisionRequested orderDetail={orderDetail} />;
    }
    if (isRevisionStatus && revisionHistory) {
      return (
        <StatusStateWaitingForRevision
          orderDetail={orderDetail}
          revisionHistory={revisionHistory}
        />
      );
    }
    if (isApproved && !hasApprovalLetter) {
      return (
        <StatusStateUploadApproval
          approvalLetterFile={approvalLetterFile.file}
          setApprovalLetterFile={approvalLetterFile.setFile}
          uploadingApprovalLetter={approvalLetterFile.uploading}
          handleUploadApprovalLetter={handleUploadApprovalLetter}
        />
      );
    }
    if (
      isApproved &&
      hasApprovalLetter &&
      (!hasInvoice || !hasCooperationAgreement)
    ) {
      return <StatusStateAwaitingInvoice />;
    }
    if (isWorksheetRevision || isWorksheetRejected) {
      return (
        <StatusStateWorksheetInReview
          orderDetail={orderDetail}
          worksheetStatus={worksheetStatus ?? "revision"}
        />
      );
    }
    if (isWorksheetInReview) {
      return (
        <StatusStateWorksheetInReview
          orderDetail={orderDetail}
          worksheetStatus={worksheetStatus ?? "draft"}
        />
      );
    }
    if (isWorksheetVerified && !offeringDoc) {
      return <StatusStateWorksheetVerified orderDetail={orderDetail} />;
    }
    if (freshlySubmitted || !hasWorksheet) {
      return <StatusStatePendingReview orderDetail={orderDetail} />;
    }
    return (
      <StatusStateOfferPublished
        orderDetail={orderDetail}
        offeringDoc={offeringDoc}
      />
    );
  }

  return (
    <Card className="container min-h-[calc(100vh-8rem)] pt-0">
      {/* Header Badge */}
      <div>
        <span className="inline-block rounded-md rounded-tr-none rounded-bl-none bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white">
          Layanan Pengujian
        </span>
      </div>

      {/* Main Content Grid */}
      <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:flex-row md:px-6">
        {/* Timeline Section - Left Side (horizontal scroll on mobile) */}
        <div className="w-full overflow-x-auto md:w-auto md:overflow-visible">
          <OrderTimeline
            history={orderDetail?.statusHistory ?? []}
            className="min-w-max md:min-w-0"
          />
        </div>

        {/* Content Card - Right Side */}
        <Card className="flex flex-1 flex-col rounded-2xl p-6 shadow-sm">
          <div className="flex h-full flex-col">
            {/* Card Content */}
            <div className="flex h-full flex-1 overflow-auto">
              {renderStatusContent()}
            </div>

            {/* Action Buttons — only when offer is active and user can still respond */}
            {!isRejected &&
              !isCancelled &&
              !isRevisionStatus &&
              !isApproved &&
              !freshlySubmitted &&
              !isWorksheetInReview &&
              isWorksheetVerified &&
              offeringDoc && (
                <div className="mt-8 flex justify-end gap-3 pt-6">
                  {/* Batal Dialog */}
                  <AlertDialog open={openCancelDialog}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="min-w-30 border-red-400 bg-red-50 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => setOpenCancelDialog(true)}
                      >
                        Batal
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Batalkan Order Pengujian
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin membatalkan order pengujian
                          ini? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          onClick={() => setOpenCancelDialog(false)}
                        >
                          Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            cancelOrderMutation.mutate({ orderId })
                          }
                          className="border border-red-400 bg-red-50 text-red-500 hover:bg-red-50 hover:text-red-600"
                          disabled={cancelOrderMutation.isPending}
                        >
                          {cancelOrderMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Tolak Order
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Revisi Dialog */}
                  <AlertDialog open={openReviseDialog}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="min-w-30 border-amber-400 bg-amber-50 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                        onClick={() => setOpenReviseDialog(true)}
                      >
                        Revisi
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Revisi Order Pengujian
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin merevisi order pengujian ini?
                          Tindakan ini akan mengirimkan notifikasi kepada pihak
                          terkait.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="py-4">
                        <Textarea
                          value={reviseReason}
                          onChange={(e) => setReviseReason(e.target.value)}
                          placeholder="Tuliskan alasan revisi order pengujian... (min. 10 karakter)"
                          rows={4}
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          onClick={() => setOpenReviseDialog(false)}
                        >
                          Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            reviseOfferMutation.mutate({
                              orderId,
                              revisionNotes: reviseReason,
                            })
                          }
                          className="border border-amber-400 bg-amber-50 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                          disabled={
                            reviseOfferMutation.isPending ||
                            reviseReason.length < 10
                          }
                        >
                          {reviseOfferMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Revisi Order
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Accept Dialog */}
                  <AlertDialog open={openAcceptDialog}>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="min-w-30 bg-amber-400 text-white hover:bg-amber-500"
                        onClick={() => setOpenAcceptDialog(true)}
                      >
                        Setuju
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Setuju Order Pengujian
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menyetujui order pengujian
                          ini? Tindakan ini akan mengirimkan notifikasi kepada
                          pihak terkait. Setelah disetujui, Anda tidak dapat
                          mengubah keputusan ini. Pastikan semua detail sudah
                          benar sebelum melanjutkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel
                          onClick={() => setOpenAcceptDialog(false)}
                        >
                          Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            acceptOfferMutation.mutate({ orderId })
                          }
                          className="bg-amber-400 hover:bg-amber-500"
                          disabled={acceptOfferMutation.isPending}
                        >
                          {acceptOfferMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Setuju
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
          </div>
        </Card>
      </div>
    </Card>
  );
}
