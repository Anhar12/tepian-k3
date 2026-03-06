import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { toFormData } from "@/utils/form-data-mapper";
import { trpc } from "@/utils/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DocumentEntityType, DocumentType } from "@tepian-k3/constants";

interface UseUploadDocumentMutationProps {
  orderId: string;
}

interface UploadDocumentParams {
  title: string;
  type: DocumentType;
  file: File;
  entityType?: DocumentEntityType;
  entityId?: string;
  onMutate?: () => void;
  onSuccess?: () => void | Promise<void>;
  onError?: (error: Error) => void;
  onSettled?: () => void | Promise<void>; // Runs on both success and error
}

export const useUploadDocumentMutation = ({
  orderId,
}: UseUploadDocumentMutationProps) => {
  const queryClient = useQueryClient();

  const uploadDocumentMutation = useMutation(
    trpc.pengujian.document.uploadDocument.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.order.getOrderWithDocumentsAdmin.queryOptions({
            orderId,
          }),
        );
        globalSuccessToast("Dokumen berhasil diunggah");
      },
      onError: (error) => {
        globalErrorToast("Gagal mengunggah dokumen: " + error.message);
      },
    }),
  );

  const uploadDocument = async ({
    title,
    type,
    file,
    entityType = "order",
    entityId = orderId,
    onMutate,
    onSuccess,
    onError,
    onSettled,
  }: UploadDocumentParams) => {
    onMutate?.();
    try {
      const formData = toFormData({
        title,
        entityType,
        entityId,
        type,
        file,
      });

      await uploadDocumentMutation.mutateAsync(formData);

      await onSuccess?.();
    } catch (error) {
      onError?.(error as Error);
      throw error;
    } finally {
      await onSettled?.();
    }
  };

  return {
    uploadDocument,
    isUploading: uploadDocumentMutation.isPending,
    mutation: uploadDocumentMutation,
  };
};
