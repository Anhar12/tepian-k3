import { Button } from "@/components/ui/button";
import ComboBox from "@/components/ui/combobox";
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
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { useParameterToolDialogStore } from "@/stores/parameter-tool-dialog.stores";
import { queryClient, trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import parameterToolSchema from "@tepian-k3/schema/parameter-tool.schema";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type z from "zod";

interface CreateParameterToolDialogProps {
  parameterId: string;
}

export default function CreateParameterToolDialog({
  parameterId,
}: CreateParameterToolDialogProps) {
  const isCreateDialogOpen = useParameterToolDialogStore(
    (state) => state.isCreateDialogOpen,
  );
  const setIsCreateDialogOpen = useParameterToolDialogStore(
    (state) => state.setIsCreateDialogOpen,
  );

  const [toolOpen, setToolOpen] = useState(false);

  const form = useForm<
    z.infer<typeof parameterToolSchema.createParameterToolSchema>
  >({
    resolver: zodResolver(parameterToolSchema.createParameterToolSchema),
    defaultValues: {
      parameterId,
    },
  });

  const createParameterToolMutation = useMutation(
    trpc.parameterTool.assignToolsToParameter.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.parameterTool.getAllParameterToolsByParameterId.queryOptions({
            parameterId,
          }),
        );
        form.reset();
        globalSuccessToast("Alat berhasil ditambahkan ke parameter.");
        setIsCreateDialogOpen(false);
      },
      onError: (error) => {
        globalErrorToast(
          `Gagal menambahkan alat ke parameter: ${error.message}`,
        );
      },
    }),
  );

  const { data: tools, isLoading } = useQuery(
    trpc.tool.getAllUnassignedTools.queryOptions(),
  );

  function handleSubmit(
    data: z.infer<typeof parameterToolSchema.createParameterToolSchema>,
  ) {
    createParameterToolMutation.mutate(data);
  }

  // Reset form when dialog is closed
  useEffect(() => {
    if (!isCreateDialogOpen) {
      form.reset();
    }
  }, [isCreateDialogOpen, form]);

  return (
    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
      <form>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Tambah Alat Terkait Parameter</DialogTitle>
            <DialogDescription>
              Isi formulir di bawah untuk menambahkan alat baru yang terkait
              dengan parameter
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid gap-4"
          >
            <FieldGroup>
              <Controller
                control={form.control}
                name="toolId"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Alat
                    </FieldLabel>
                    <ComboBox
                      options={
                        tools?.map((tool) => ({
                          id: tool.id,
                          name: `${tool.toolCode} - ${tool.toolName}`,
                        })) ?? []
                      }
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Pilih alat..."
                      searchPlaceholder="Cari alat..."
                      emptyMessage="Tidak ada alat yang ditemukan."
                      open={toolOpen}
                      onOpenChange={setToolOpen}
                      invalid={fieldState.invalid}
                      isLoading={isLoading}
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
                disabled={createParameterToolMutation.isPending}
              >
                {createParameterToolMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Tambahkan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </form>
    </Dialog>
  );
}
