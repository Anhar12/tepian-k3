import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { queryClient, trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import toolCodeSchema from "@tepian-k3/schema/pengujian/tool-code.schema";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { ToolCodes } from "@tepian-k3/types/pengujian/tool-codes.types";
import {
  SkeletonButton,
  SkeletonInput,
  SkeletonTextArea,
} from "@/components/ui/skeleton-generator";

export function ToolCodeModal({
  row,
  open,
  onOpenChange,
}: {
  row: ToolCodes;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Kode Alat</DialogTitle>
          <DialogDescription>
            Isi form di bawah untuk mengedit kode alat.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ToolCodeForm toolCodeId={row.id} setOpen={onOpenChange} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ToolCodeForm({
  toolCodeId,
  setOpen,
}: {
  toolCodeId: string;
  setOpen: (open: boolean) => void;
}) {
  const { data: toolCode, isLoading } = useQuery(
    trpc.pengujian.toolCode.getToolCodeById.queryOptions({
      id: toolCodeId,
    }),
  );

  const form = useForm<z.infer<typeof toolCodeSchema.updateToolCodeSchema>>({
    resolver: zodResolver(toolCodeSchema.updateToolCodeSchema),
    defaultValues: {
      id: toolCodeId,
      code: "",
      description: undefined,
      isActive: true,
    },
    values: toolCode ? {
      id: toolCode.id,
      code: toolCode.code,
      description: toolCode.description ?? undefined,
      isActive: toolCode.isActive,
    } : undefined,
  });

  const updateToolCodeMutation = useMutation(
    trpc.pengujian.toolCode.updateToolCode.mutationOptions({
      onSuccess: async () => {
        globalSuccessToast("Kode alat berhasil diperbarui");
        await queryClient.invalidateQueries(
          trpc.pengujian.toolCode.getPaginatedToolCodes.queryOptions({}),
        );
        setOpen(false);
      },
      onError: (error) => {
        globalErrorToast(`Gagal memperbarui kode alat: ${error.message}`);
      },
    }),
  );

  const handleSubmit = (
    data: z.infer<typeof toolCodeSchema.updateToolCodeSchema>,
  ) => {
    updateToolCodeMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 py-4">
        <SkeletonInput className="w-full" />
        <SkeletonTextArea className="w-full" />
        <SkeletonInput className="w-full" />
        <SkeletonButton className="w-full" />
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="grid gap-4 py-4"
    >
      <FieldGroup>
        <Controller
          control={form.control}
          name="code"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              className="space-y-1"
            >
              <FieldLabel className="ml-1 text-sm font-bold">
                Kode Alat
              </FieldLabel>
              <Input
                type="text"
                placeholder="Masukkan kode alat"
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
          name="description"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              className="space-y-1"
            >
              <FieldLabel className="ml-1 text-sm font-bold">
                Deskripsi Kode Alat
              </FieldLabel>
              <Textarea
                placeholder="Masukkan deskripsi kode alat"
                className="h-10 text-sm"
                {...field}
                value={field.value ?? ""}
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
          name="isActive"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              className="space-y-1"
              orientation="horizontal"
            >
              <Checkbox
                id={`form-rhf-checkbox-isActive`}
                name={field.name}
                aria-invalid={fieldState.invalid}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <FieldLabel
                htmlFor={`form-rhf-checkbox-isActive`}
                className="font-normal"
              >
                Aktifkan Kode Alat
              </FieldLabel>
            </Field>
          )}
        />

        <Button
          type="submit"
          className="mt-2 h-10 w-full text-sm"
          disabled={updateToolCodeMutation.isPending}
        >
          {updateToolCodeMutation.isPending ? <Spinner /> : null}
          Perbarui Kode Alat
        </Button>
      </FieldGroup>
    </form>
  );
}
