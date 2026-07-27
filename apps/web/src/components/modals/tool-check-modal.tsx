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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { queryClient, trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  TOOLS_CONDITIONS,
  TOOLS_CONDITIONS_LABELS,
} from "@tepian-k3/constants";
import toolCheckSchema from "@tepian-k3/schema/pengujian/tool-check.schema";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import type { ToolCheck } from "@tepian-k3/types/pengujian/tool-check.types";
import {
  SkeletonButton,
  SkeletonInput,
} from "@/components/ui/skeleton-generator";

export function ToolCheckModal({
  row,
  open,
  onOpenChange,
}: {
  row: ToolCheck;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Status Alat</DialogTitle>
          <DialogDescription>
            Isi form di bawah untuk menyimpan perubahan status alat.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ToolCheckForm statusId={row.id} toolId={row.toolId} setOpen={onOpenChange} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ToolCheckForm({
  statusId,
  toolId,
  setOpen,
}: {
  statusId: string;
  toolId: string;
  setOpen: (open: boolean) => void;
}) {
  const { data: toolCheckDetails, isLoading } = useQuery(
    trpc.pengujian.tool.getToolCheckDetails.queryOptions({
      id: statusId,
    }),
  );

  const form = useForm<z.infer<typeof toolCheckSchema.updateToolCheckSchema>>({
    resolver: zodResolver(toolCheckSchema.updateToolCheckSchema),
    defaultValues: {
      id: statusId,
      checkAlatMenyala: false,
      checkPenyimpangan: false,
      checkKelengkapanAlat: false,
      checkKondisiFisikAlat: false,
      checkConditionResult: "baik",
    },
    values: toolCheckDetails as any,
  });

  const updateToolCheckMutation = useMutation(
    trpc.pengujian.tool.updateToolCheck.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.tool.getPaginatedChecks.queryOptions({ toolId }),
        );
        globalSuccessToast("Status alat berhasil diperbarui");
        setOpen(false);
      },
      onError: (error) => {
        globalErrorToast("Gagal memperbarui status alat: " + error.message);
      },
    }),
  );

  const handleSubmit = (
    data: z.infer<typeof toolCheckSchema.updateToolCheckSchema>,
  ) => {
    updateToolCheckMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 py-4">
        <SkeletonInput className="w-full" />
        <SkeletonInput className="w-full" />
        <SkeletonInput className="w-full" />
        <SkeletonInput className="w-full" />
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
          name="checkAlatMenyala"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              className="space-y-1"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  id="form-rhf-checkbox-checkAlatMenyala"
                  name={field.name}
                  aria-invalid={fieldState.invalid}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FieldLabel
                  htmlFor="form-rhf-checkbox-checkAlatMenyala"
                  className="font-normal"
                >
                  Alat Menyala
                </FieldLabel>
              </div>
              {fieldState.error && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="checkPenyimpangan"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              className="space-y-1"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  id="form-rhf-checkbox-checkPenyimpangan"
                  name={field.name}
                  aria-invalid={fieldState.invalid}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FieldLabel
                  htmlFor="form-rhf-checkbox-checkPenyimpangan"
                  className="font-normal"
                >
                  Penyimpangan Alat +- 5% dari nilai standar
                </FieldLabel>
              </div>
              {fieldState.error && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="checkKelengkapanAlat"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              className="space-y-1"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  id="form-rhf-checkbox-checkKelengkapanAlat"
                  name={field.name}
                  aria-invalid={fieldState.invalid}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FieldLabel
                  htmlFor="form-rhf-checkbox-checkKelengkapanAlat"
                  className="font-normal"
                >
                  Kelengkapan Alat
                </FieldLabel>
              </div>
              {fieldState.error && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="checkKondisiFisikAlat"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              className="space-y-1"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  id="form-rhf-checkbox-checkKondisiFisikAlat"
                  name={field.name}
                  aria-invalid={fieldState.invalid}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FieldLabel
                  htmlFor="form-rhf-checkbox-checkKondisiFisikAlat"
                  className="font-normal"
                >
                  Kondisi Fisik Alat
                </FieldLabel>
              </div>
              {fieldState.error && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="checkConditionResult"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              className="space-y-1"
            >
              <FieldLabel className="ml-1 text-sm font-bold">
                Kondisi Alat
              </FieldLabel>
              <Select
                name={field.name}
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger
                  className="w-full"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder="Pilih Kondisi Alat" />
                </SelectTrigger>
                <SelectContent>
                  {TOOLS_CONDITIONS.map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {TOOLS_CONDITIONS_LABELS[condition]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      </FieldGroup>

      <Button
        type="submit"
        className="w-full"
        disabled={updateToolCheckMutation.isPending}
      >
        {updateToolCheckMutation.isPending ? <Spinner /> : null}
        Simpan Perubahan
      </Button>
    </form>
  );
}
