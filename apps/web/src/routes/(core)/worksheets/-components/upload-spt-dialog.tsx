import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { queryClient, trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type z from "zod";
import documentSchema from "@tepian-k3/schema/platform/document.schema";
import { toFormData } from "@/utils/form-data-mapper";
import SingleFileUpload from "@/components/ui/single-file-upload";

interface UploadSPTDialogProps {
  worksheetId: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function UploadSPTDialog({
  worksheetId,
  isOpen,
  setIsOpen,
}: UploadSPTDialogProps) {
  const form = useForm<z.infer<typeof documentSchema.createSPTDocumentSchema>>({
    resolver: zodResolver(documentSchema.createSPTDocumentSchema),
    defaultValues: {
      worksheetId,
    },
  });

  const uploadSPTMutation = useMutation(
    trpc.pengujian.document.uploadSPT.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.worksheet.getWorksheetDocument.queryOptions({
            worksheetId,
            documentType: "assignment_letter",
          }),
        );
        globalSuccessToast("Surat SPT berhasil diupload");
        setIsOpen(false);
      },
      onError: (error) => {
        globalErrorToast(
          "Gagal mengupload surat SPT : " + (error?.message || ""),
        );
      },
    }),
  );

  function handleSubmit(
    data: z.infer<typeof documentSchema.createSPTDocumentSchema>,
  ) {
    const formData = toFormData(data);
    uploadSPTMutation.mutate(formData);
  }

  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Surat SPT</DialogTitle>
          <DialogDescription>
            Upload surat perintah tugas untuk semua personil pada worksheet ini.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4">
          <FieldGroup>
            <Controller
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-1">
                  <FieldLabel className="ml-1 text-sm font-bold">
                    Judul Surat SPT
                  </FieldLabel>
                  <Input
                    type="text"
                    placeholder="Masukkan judul surat SPT"
                    className="h-10 text-sm"
                    {...field}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="file"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-1">
                  <FieldLabel className="ml-1 text-sm font-bold">
                    File Surat SPT (PDF, max 10MB)
                  </FieldLabel>
                  <SingleFileUpload
                    accept="application/pdf"
                    {...field}
                    error={fieldState.error?.message}
                  />
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Batal
              </Button>
            </DialogClose>
            <Button type="submit" disabled={uploadSPTMutation.isPending}>
              {uploadSPTMutation.isPending ? <Spinner /> : null}
              Upload Surat SPT
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
