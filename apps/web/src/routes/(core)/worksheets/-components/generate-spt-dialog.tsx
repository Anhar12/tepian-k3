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
import { base64ToBlobUrl, openBase64InNewTab } from "@/utils/download";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import generateDocumentSchema from "@tepian-k3/schema/pengujian/generate-document.schema";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type z from "zod";
import { ArrowRight } from "lucide-react";
import { type SignerInfo } from "@/components/document-signing";
import { useNavigate } from "@tanstack/react-router";
import type { DocumentSigningSessionData } from "@/routes/(core)/document-signing";

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
  const navigate = useNavigate();
  const meQuery = useQuery(trpc.platform.auth.me.queryOptions());
  const currentUser = meQuery.data;

  const defaultSigners: SignerInfo[] = currentUser
    ? [
        {
          userId: currentUser.id,
          userName: currentUser.name || "Pejabat Penandatangan SPT",
          purpose: "Pejabat Penandatangan SPT",
        },
      ]
    : [];

  const form = useForm<
    z.input<typeof generateDocumentSchema.generateAssignmentLetter>
  >({
    resolver: zodResolver(generateDocumentSchema.generateAssignmentLetter),
    defaultValues: {
      worksheetId,
      signatures: [],
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

  const previewAssignmentLetterMutation = useMutation(
    trpc.pengujian.generateDocument.previewAssignmentLetter.mutationOptions({
      onError: (error) => {
        globalErrorToast(
          "Gagal memuat pratinjau dokumen: " + (error?.message || ""),
        );
      },
    }),
  );

  const handleGoToSigningPage = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    const data = form.getValues();
    previewAssignmentLetterMutation.mutate(
      { ...data, signatures: [] },
      {
        onSuccess: (res) => {
          const previewUrl = base64ToBlobUrl(res.base64, res.contentType);
          const sessionKey = `doc-sign-${Date.now()}`;
          const sessionData: DocumentSigningSessionData = {
            documentType: "spt",
            title: "Surat SPT",
            formData: data,
            pdfPreviewUrl: previewUrl,
            returnPath: window.location.pathname,
            signers: defaultSigners,
          };
          sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));
          setIsOpen(false);
          navigate({
            to: "/document-signing",
            search: { sessionKey },
          });
        },
      },
    );
  };

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Buat Surat SPT</DialogTitle>
          <DialogDescription>
            Isi form berikut untuk membuat surat SPT.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGoToSigningPage();
          }}
          className="grid gap-4"
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="letterNumber"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-1">
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
                <Field data-invalid={fieldState.invalid} className="space-y-1">
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
          <DialogFooter className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Batal
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="secondary"
              onClick={form.handleSubmit((data) => {
                generateAssignmentLetterMutation.mutate({
                  ...data,
                  signatures: [],
                });
              })}
              disabled={
                generateAssignmentLetterMutation.isPending ||
                previewAssignmentLetterMutation.isPending
              }
            >
              Cetak Tanpa QR
            </Button>
            <Button
              type="submit"
              disabled={
                generateAssignmentLetterMutation.isPending ||
                previewAssignmentLetterMutation.isPending
              }
            >
              {previewAssignmentLetterMutation.isPending ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : null}
              Atur Posisi TTD <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
