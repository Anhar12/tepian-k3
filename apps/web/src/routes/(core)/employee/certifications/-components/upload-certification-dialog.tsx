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
import { queryClient, trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import type z from "zod";
import employeeCertificationSchemas from "@tepian-k3/schema/platform/employee-certification.schema";
import { toFormData } from "@/utils/form-data-mapper";
import SingleFileUpload from "@/components/ui/single-file-upload";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UploadCertificationDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function UploadCertificationDialog({
  isOpen,
  setIsOpen,
}: UploadCertificationDialogProps) {
  const form = useForm<
    z.infer<
      typeof employeeCertificationSchemas.createEmployeeCertificationSchema
    >
  >({
    resolver: zodResolver(
      employeeCertificationSchemas.createEmployeeCertificationSchema,
    ),
  });

  const uploadCertificateMutation = useMutation(
    trpc.platform.employeeCertification.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.platform.employeeCertification.getMyCertifications.queryOptions(),
        );
        globalSuccessToast("Sertifikasi berhasil diunggah");
        setIsOpen(false);
        form.reset();
      },
      onError: (error) => {
        globalErrorToast(`Gagal mengunggah sertifikasi: ${error.message}`);
      },
    }),
  );

  const handleSubmit = (
    data: z.infer<
      typeof employeeCertificationSchemas.createEmployeeCertificationSchema
    >,
  ) => {
    const formData = toFormData(data);

    uploadCertificateMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <form>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Sertifikasi</DialogTitle>
            <DialogDescription>
              Unggah sertifikasi kompetensi Anda untuk melengkapi profil Anda.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid gap-4"
          >
            <ScrollArea className="max-h-[70vh] px-4">
              <FieldGroup>
                <Controller
                  control={form.control}
                  name="certificationName"
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="space-y-1"
                    >
                      <FieldLabel className="ml-1 text-sm font-bold">
                        Nama Sertifikasi
                      </FieldLabel>
                      <Input
                        type="text"
                        placeholder="Masukkan nama sertifikasi"
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
                  name="issuedBy"
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="space-y-1"
                    >
                      <FieldLabel className="ml-1 text-sm font-bold">
                        Diterbitkan Oleh
                      </FieldLabel>
                      <Input
                        type="text"
                        placeholder="Masukkan nama penerbit sertifikasi"
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
                  name="issueDate"
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="space-y-1"
                    >
                      <FieldLabel className="ml-1 text-sm font-bold">
                        Tanggal Diterbitkan
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
                              : "Pilih tanggal"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={new Date(field.value ?? "")}
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

                <Controller
                  control={form.control}
                  name="expiryDate"
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="space-y-1"
                    >
                      <FieldLabel className="ml-1 text-sm font-bold">
                        Tanggal Kadaluarsa (Opsional)
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
                              : "Pilih tanggal"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={new Date(field.value ?? "")}
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

                <Controller
                  control={form.control}
                  name="file"
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="space-y-1"
                    >
                      <FieldLabel className="ml-1 text-sm font-bold">
                        File Sertifikasi (PDF)
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
            </ScrollArea>
            <DialogFooter>
              <DialogClose>Batal</DialogClose>
              <Button
                type="submit"
                disabled={uploadCertificateMutation.isPending}
              >
                {uploadCertificateMutation.isPending ? <Spinner /> : null}
                Unggah Sertifikasi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </form>
    </Dialog>
  );
}
