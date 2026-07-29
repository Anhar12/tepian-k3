import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { openBase64InNewTab } from "@/utils/download";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import generateDocumentSchema from "@tepian-k3/schema/pengujian/generate-document.schema";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft, ArrowRight, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type z from "zod";
import {
  QRSignaturePlacer,
  type SignaturePosition,
  type SignerInfo,
} from "@/components/document-signing";

interface GenerateSPKDialogProps {
  worksheetId: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function GenerateSPKDialog({
  worksheetId,
  isOpen,
  setIsOpen,
}: GenerateSPKDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [signatures, setSignatures] = useState<SignaturePosition[]>([]);

  const meQuery = useQuery(trpc.platform.auth.me.queryOptions());
  const currentUser = meQuery.data;

  const defaultSigners: SignerInfo[] = currentUser
    ? [
        {
          userId: currentUser.id,
          userName: currentUser.name || "Kepala Balai K3",
          purpose: "Kepala Balai K3",
        },
      ]
    : [];

  const form = useForm<
    z.input<typeof generateDocumentSchema.generateSpkDocumentSchema>
  >({
    resolver: zodResolver(generateDocumentSchema.generateSpkDocumentSchema),
    defaultValues: {
      worksheetId,
      signatures: [],
    },
  });

  const generateSpkMutation = useMutation(
    trpc.pengujian.generateDocument.generateSpkDocument.mutationOptions({
      onSuccess: (data) => {
        globalSuccessToast("Surat SPK berhasil dibuat");
        openBase64InNewTab(data.base64, data.contentType);
        setIsOpen(false);
      },
      onError: (error) => {
        globalErrorToast("Gagal membuat surat SPK : " + (error?.message || ""));
      },
    }),
  );

  function handleSubmit(
    data: z.input<typeof generateDocumentSchema.generateSpkDocumentSchema>,
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
    generateSpkMutation.mutate(finalData);
  }

  const handleNextToSignature = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    if (signatures.length === 0 && currentUser) {
      setSignatures([
        {
          userId: currentUser.id,
          userName: currentUser.name || "Kepala Balai K3",
          purpose: "Kepala Balai K3",
          page: 0,
          x: 600,
          y: 900,
          width: 100,
          height: 100,
        },
      ]);
    }

    setStep(2);
  };

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSignatures([]);
    } else {
      form.reset({ worksheetId });
    }
  }, [isOpen, worksheetId, form]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className={step === 2 ? "max-w-4xl" : "max-w-md"}>
        <DialogHeader>
          <DialogTitle>
            {step === 1
              ? "Buat Surat SPK"
              : "Posisi Tanda Tangan Digital (QR Code)"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Isi form berikut untuk membuat surat SPK."
              : "Atur posisi dan ukuran QR Code tanda tangan digital pada dokumen."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNextToSignature();
            }}
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
                      Nomor Surat
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan nomor surat"
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
                name="agreementDate"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Tanggal Perjanjian
                    </FieldLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-60 pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value
                            ? format(new Date(field.value), "PPP")
                            : "Pick a date"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={(value) => {
                            field.onChange(value?.toISOString() ?? null);
                          }}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                  generateSpkMutation.mutate({
                    ...data,
                    signatures: [],
                  });
                })}
                disabled={generateSpkMutation.isPending}
              >
                Cetak Tanpa QR
              </Button>
              <Button type="submit">
                Atur Posisi TTD <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <QRSignaturePlacer
              signers={defaultSigners}
              positions={signatures}
              onChange={setSignatures}
              maxPages={5}
            />
            <DialogFooter className="flex gap-2">
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
                disabled={generateSpkMutation.isPending}
              >
                {generateSpkMutation.isPending ? (
                  <Spinner className="mr-2" />
                ) : (
                  <QrCode className="mr-2 h-4 w-4" />
                )}
                Buat SPK Bertanda Tangan
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
