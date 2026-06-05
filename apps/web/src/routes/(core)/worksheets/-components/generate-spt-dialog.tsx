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
import { trpc } from "@/utils/trpc";
// import { getPublicUrl } from "@/utils/url";
import { openBase64InNewTab } from "@/utils/download";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import generateDocumentSchema from "@tepian-k3/schema/pengujian/generate-document.schema";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type z from "zod";

interface GenerateSPTDialogProps {
  worksheetId: string;
  /** Pre-fill Nomor Surat Penawaran from the previously generated offering */
  offeringLetterNumber?: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function GenerateSPTDialog({
  worksheetId,
  offeringLetterNumber,
  isOpen,
  setIsOpen,
}: GenerateSPTDialogProps) {
  const form = useForm<
    z.infer<typeof generateDocumentSchema.generateAssignmentLetter>
  >({
    resolver: zodResolver(generateDocumentSchema.generateAssignmentLetter),
    defaultValues: {
      worksheetId,
    },
  });

  const generateAssignmentLetterMutation = useMutation(
    trpc.pengujian.generateDocument.generateAssignmentLetter.mutationOptions({
      onSuccess: (data) => {
        globalSuccessToast("Surat SPT berhasil dibuat");
        openBase64InNewTab(data.base64, data.contentType);
        setIsOpen(false);
      },
      onError: (error) => {
        globalErrorToast("Gagal membuat surat SPT : " + (error?.message || ""));
      },
    }),
  );

  function handleSubmit(
    data: z.infer<typeof generateDocumentSchema.generateAssignmentLetter>,
  ) {
    generateAssignmentLetterMutation.mutate(data);
  }

  useEffect(() => {
    if (isOpen) {
      if (offeringLetterNumber)
        form.setValue("letterNumber", offeringLetterNumber);
    } else {
      form.reset({ worksheetId });
    }
  }, [isOpen, offeringLetterNumber, worksheetId, form]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <form>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Surat SPT</DialogTitle>
            <DialogDescription>
              Isi form berikut untuk membuat surat SPT.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid gap-4"
          >
            <FieldGroup>
              <Controller
                control={form.control}
                name="letterNumber"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Nomor Surat Penawaran
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan nomor surat penawaran"
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
                name="assignmentLetterNumber"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Nomor Surat Tugas
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan nomor surat tugas"
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
            </FieldGroup>
            <DialogFooter>
              <DialogClose>Batal</DialogClose>
              <Button
                type="submit"
                disabled={generateAssignmentLetterMutation.isPending}
              >
                {generateAssignmentLetterMutation.isPending ? (
                  <Spinner />
                ) : null}
                Buat SPT
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </form>
    </Dialog>
  );
}
