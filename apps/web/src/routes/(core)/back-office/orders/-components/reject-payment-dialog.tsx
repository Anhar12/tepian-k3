import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface RejectPaymentDialogProps {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Dialog konfirmasi penolakan pembayaran oleh Bendahara.
 * Membutuhkan catatan alasan penolakan sebelum diproses.
 */
export function RejectPaymentDialog({
  orderId,
  open,
  onOpenChange,
  onSuccess,
}: RejectPaymentDialogProps) {
  const [reason, setReason] = useState("");

  const rejectPaymentMutation = useMutation(
    trpc.pengujian.order.rejectPayment.mutationOptions({
      onSuccess: () => {
        globalSuccessToast("Bukti pembayaran berhasil ditolak.");
        setReason("");
        onOpenChange(false);
        onSuccess?.();
      },
      onError: (error: any) => {
        globalErrorToast(`Gagal menolak pembayaran: ${error.message}`);
      },
    })
  );

  const handleConfirm = () => {
    if (!reason.trim() || reason.trim().length < 5) {
      globalErrorToast("Harap masukkan alasan penolakan (minimal 5 karakter).");
      return;
    }
    rejectPaymentMutation.mutate({
      orderId,
      reason: reason.trim(),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Tolak Bukti Pembayaran</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menolak bukti pembayaran untuk order ini? Berikan alasan agar pelanggan dapat mengunggah bukti yang sesuai.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-2 space-y-2">
          <Label htmlFor="reject-reason" className="text-sm font-medium">
            Alasan Penolakan <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="reject-reason"
            placeholder="Contoh: Bukti transfer tidak terbaca / nominal tidak sesuai"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={rejectPaymentMutation.isPending}>
            Batal
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={rejectPaymentMutation.isPending || !reason.trim()}
          >
            {rejectPaymentMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Konfirmasi Penolakan
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
