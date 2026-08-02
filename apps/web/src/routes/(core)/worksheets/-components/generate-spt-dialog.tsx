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
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type z from "zod";
import { ArrowLeft, ArrowRight, QrCode } from "lucide-react";
import {
  QRSignaturePlacer,
  type SignaturePosition,
  type SignerInfo,
} from "@/components/document-signing";

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
  const [step, setStep] = useState<1 | 2>(1);
  const [signatures, setSignatures] = useState<SignaturePosition[]>([]);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | undefined>(
    undefined,
  );

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

  function handleSubmit(
    data: z.input<typeof generateDocumentSchema.generateAssignmentLetter>,
  ) {
    const finalData = {
      ...data,
      signatures: signatures.map((s) => ({
        userId: s.userId,
        userName: s.userName,
        purpose: s.purpose,
        page: s.page ?? 0,
        x: s.x ?? 450,
        y: s.y ?? 700,
        width: s.width ?? 100,
        height: s.height ?? 100,
      })),
    };
    generateAssignmentLetterMutation.mutate(finalData);
  }

  const handleNextToSignature = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    if (signatures.length === 0 && currentUser) {
      setSignatures([
        {
          userId: currentUser.id,
          userName: currentUser.name || "Pejabat Penandatangan SPT",
          purpose: "Pejabat Penandatangan SPT",
          page: 0,
          x: 600,
          y: 900,
          width: 100,
          height: 100,
        },
      ]);
    }

    setPdfPreviewUrl(undefined);
    generateAssignmentLetterMutation.mutate(
      {
        ...form.getValues(),
        signatures: [],
      },
      {
        onSuccess: (data) => {
          setPdfPreviewUrl(base64ToBlobUrl(data.base64, data.contentType));
        },
      },
    );

    setStep(2);
  };

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSignatures([]);
      if (offeringLetterNumber)
        form.setValue("letterNumber", offeringLetterNumber);
    } else {
      form.reset({ worksheetId });
    }
  }, [isOpen, offeringLetterNumber, worksheetId, form]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className={
          step === 2
            ? "flex max-h-[90vh] w-[95vw] max-w-5xl flex-col overflow-hidden p-0"
            : "max-w-md"
        }
      >
        <DialogHeader className={step === 2 ? "border-b px-6 py-4" : ""}>
          <DialogTitle>
            {step === 1
              ? "Buat Surat SPT"
              : "Posisi Tanda Tangan Digital (QR Code)"}
          </DialogTitle>
          <DialogDescription className={step === 2 ? "hidden" : ""}>
            {step === 1
              ? "Isi form berikut untuk membuat surat SPT."
              : "Atur posisi dan ukuran QR Code tanda tangan digital pada dokumen."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNextToSignature();
            }}
            className="grid gap-4 p-6 pt-0"
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
                  setSignatures([]);
                  generateAssignmentLetterMutation.mutate({
                    ...data,
                    signatures: [],
                  });
                })}
                disabled={generateAssignmentLetterMutation.isPending}
              >
                Cetak Tanpa QR
              </Button>
              <Button type="submit">
                Atur Posisi TTD <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <QRSignaturePlacer
                signers={defaultSigners}
                positions={signatures}
                onChange={setSignatures}
                pdfPreviewUrl={pdfPreviewUrl}
                maxPages={5}
              />
            </div>
            <DialogFooter className="border-t bg-muted/20 px-6 py-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Kembali
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit(handleSubmit)}
                disabled={generateAssignmentLetterMutation.isPending}
              >
                {generateAssignmentLetterMutation.isPending ? (
                  <Spinner className="mr-2" />
                ) : (
                  <QrCode className="mr-1.5 h-4 w-4" />
                )}
                Cetak Dokumen Bertanda Tangan
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
