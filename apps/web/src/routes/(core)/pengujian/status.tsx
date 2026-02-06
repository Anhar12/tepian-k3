import { OrderDetailSkeleton } from "@/components/order-detail-skeleton";
import { OrderTimeline } from "@/components/order-timeline";
import {
  StatusState0,
  StatusState1,
  StatusState2,
  StatusState3,
  StatusState4,
  StatusState5,
  StatusState6,
  StatusState7,
  StatusState8,
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

// TODO: When order is cancelled, make sure all related documents/worksheets are handled properly (maybe soft delete or archive)
// TODO: Approval Doc should not be uploaded by admin/user its from offering doc that has been signed by both parties

export const Route = createFileRoute("/(core)/pengujian/status")({
  validateSearch: z.object({
    orderId: z.uuidv7(),
  }),
  head: () => pageHead("Pengujian - Status"),
  beforeLoad: async ({ search }) => {
    // check if orderId exists
    if (!search.orderId) {
      throw redirect({
        to: "/pengujian",
      });
    }
  },
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
    trpc.order.getOrderWithDocuments.queryOptions({
      orderId,
    }),
  );

  const acceptOfferMutation = useMutation(
    trpc.order.acceptOffer.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.order.getOrderWithDocuments.queryOptions({
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
    trpc.order.reviseOrder.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.order.getOrderWithDocuments.queryOptions({
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
    trpc.order.cancelOrder.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.order.getOrderWithDocuments.queryOptions({
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

      await trpcClient.order.uploadApprovalLetter.mutate(formData);
      await queryClient.invalidateQueries(
        trpc.order.getOrderWithDocuments.queryOptions({
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

      await trpcClient.order.uploadPaymentDocuments.mutate(formData);
      await queryClient.invalidateQueries(
        trpc.order.getOrderWithDocuments.queryOptions({
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
    const approvalLetterDoc = orderDetail?.documents.find(
      (doc) => doc.type === "approval_letter",
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

  // Status flags
  const isRevisionStatus = orderDetail.status === "revision";
  const isApproved = !!orderDetail.approvedAt;
  const hasApprovalLetter = !!approvalLetterUserDoc;
  const hasInvoice = !!invoiceDoc;
  const hasCooperationAgreement = !!cooperationAgreementDoc;
  const hasCooperationAgreementUser = !!cooperationAgreementUserDoc;
  const hasBothCooperationAgreement =
    !!cooperationAgreementDoc && !!cooperationAgreementUserDoc;
  const hasPaymentProof = !!paymentProofDoc;
  const isPendingPaymentVerification =
    orderDetail.paymentStatus === "pending_verification";
  const isPaymentVerified = orderDetail.paymentStatus === "paid";
  // Check if order is in testing/sampling phase (any of the testing-related statuses)
  const isInProgress =
    orderDetail.status === "menunggu_penerbitan_spt_jadwal" ||
    orderDetail.status === "proses_pengambilan_sampel" ||
    orderDetail.status === "sampel_dalam_proses_penyerahan" ||
    orderDetail.status === "sampel_telah_dianalisis" ||
    orderDetail.status === "sampel_selesai_dianalisis" ||
    orderDetail.status === "laporan_diterbitkan";
  const isCompleted = orderDetail.status === "completed";
  const freshlySubmitted = orderDetail.status === "pending" && !offeringDoc;

  // Worksheet status flags (new flow: worksheet created BEFORE offering)
  const hasWorksheet = !!orderDetail.worksheet;
  const worksheetStatus = orderDetail.worksheet?.status;
  const isWorksheetInReview =
    hasWorksheet &&
    (worksheetStatus === "draft" || worksheetStatus === "pending_verification");
  const isWorksheetVerified = hasWorksheet && worksheetStatus === "verified";

  // Determine the current workflow state (updated for new flow)
  // 0. Freshly submitted - no worksheet yet, waiting for kaji ulang
  // 0a. Worksheet in review (draft/pending_verification)
  // 0b. Worksheet verified, waiting for offering document
  // 1. Offer sent, waiting for customer to approve
  // 2. Customer approved, needs to upload approval letter
  // 3. Approval letter uploaded, waiting for invoice & cooperation agreement
  // 4. Invoice ready, user uploads payment proof & signed cooperation agreement
  // 5. Payment pending verification
  // 6. Payment verified, waiting for SPT & schedule
  // 7. Testing in progress
  // 8. Completed

  // Get revision notes from the latest revision status history
  const revisionHistory = orderDetail.statusHistory
    ?.filter((h) => h.status === "revision")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];

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
              {isCompleted ? (
                // State 8: Testing Completed
                <StatusState8 orderDetail={orderDetail} />
              ) : isInProgress ? (
                // State 7: Testing in Progress
                <StatusState7 orderDetail={orderDetail} />
              ) : isPaymentVerified && !isInProgress ? (
                // State 6: Payment verified, waiting for SPT & schedule
                <StatusState6 />
              ) : isPendingPaymentVerification ? (
                // State 5: Payment pending verification
                <StatusState5
                  cooperationAgreementUserDoc={cooperationAgreementUserDoc}
                  paymentProofDoc={paymentProofDoc}
                />
              ) : isApproved &&
                hasApprovalLetter &&
                hasInvoice &&
                hasCooperationAgreement &&
                !hasPaymentProof ? (
                // State 4: Invoice ready, user uploads payment proof & signed cooperation agreement
                <StatusState4
                  invoiceDoc={invoiceDoc}
                  cooperationAgreementDoc={cooperationAgreementDoc}
                  paymentProofFile={paymentProofFile.file}
                  setPaymentProofFile={paymentProofFile.setFile}
                  cooperationAgreementFile={cooperationAgreementFile.file}
                  setCooperationAgreementFile={cooperationAgreementFile.setFile}
                  uploadingPaymentDocs={
                    paymentProofFile.uploading ||
                    cooperationAgreementFile.uploading
                  }
                  handleUploadPaymentDocs={handleUploadPaymentDocs}
                />
              ) : isRevisionStatus && revisionHistory ? (
                // State: Waiting for revision
                <StatusStateWaitingForRevision
                  orderDetail={orderDetail}
                  revisionHistory={revisionHistory}
                />
              ) : isApproved && !hasApprovalLetter ? (
                // State 2: Customer approved, needs to upload approval letter
                <StatusState2
                  approvalLetterFile={approvalLetterFile.file}
                  setApprovalLetterFile={approvalLetterFile.setFile}
                  uploadingApprovalLetter={approvalLetterFile.uploading}
                  handleUploadApprovalLetter={handleUploadApprovalLetter}
                />
              ) : isApproved &&
                hasApprovalLetter &&
                (!hasInvoice || !hasCooperationAgreement) ? (
                // State 3: Approval letter uploaded, waiting for invoice & cooperation agreement
                <StatusState3 />
              ) : isWorksheetInReview ? (
                // State 0a: Worksheet in review (kaji ulang phase)
                <StatusStateWorksheetInReview
                  orderDetail={orderDetail}
                  worksheetStatus={worksheetStatus || "draft"}
                />
              ) : isWorksheetVerified && !offeringDoc ? (
                // State 0b: Worksheet verified, waiting for offering document
                <StatusStateWorksheetVerified orderDetail={orderDetail} />
              ) : freshlySubmitted && !hasWorksheet ? (
                // State 0: Freshly submitted, no worksheet yet
                <StatusState0 orderDetail={orderDetail} />
              ) : (
                // State 1: Offer sent, waiting for customer to approve
                <StatusState1
                  orderDetail={orderDetail}
                  offeringDoc={offeringDoc}
                />
              )}
            </div>

            {/* Action Buttons - Bottom Right (only show when offer is available and not approved yet) */}
            {!isRevisionStatus &&
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
