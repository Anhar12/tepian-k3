import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { queryClient, trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import clusterSchema from "@tepian-k3/schema/pengujian/cluster.schema";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import type { Clusters } from "@tepian-k3/types/pengujian/clusters.types";
import {
  SkeletonButton,
  SkeletonInput,
  SkeletonTextArea,
} from "@/components/ui/skeleton-generator";

export function ClusterModal({
  row,
  open,
  onOpenChange,
}: {
  row: Clusters;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Perbarui Cluster</DialogTitle>
          <DialogDescription>
            Isi form di bawah untuk memperbarui cluster.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ClusterForm clusterId={row.id} setOpen={onOpenChange} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ClusterForm({
  clusterId,
  setOpen,
}: {
  clusterId: string;
  setOpen: (open: boolean) => void;
}) {
  const { data: cluster, isLoading } = useQuery(
    trpc.pengujian.cluster.getClusterById.queryOptions({ id: clusterId }),
  );

  const form = useForm<z.infer<typeof clusterSchema.updateClusterSchema>>({
    resolver: zodResolver(clusterSchema.updateClusterSchema),
    defaultValues: {
      id: clusterId,
      name: "",
      description: undefined,
    },
    values: cluster ? {
      id: cluster.id,
      name: cluster.name,
      description: cluster.description ?? undefined,
    } : undefined,
  });

  const updateClusterMutation = useMutation(
    trpc.pengujian.cluster.updateCluster.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.cluster.getPaginatedClusters.queryOptions({}),
        );
        globalSuccessToast("Berhasil memperbarui cluster");
        setOpen(false);
      },
      onError: (error) => {
        globalErrorToast("Gagal memperbarui cluster: " + error.message);
      },
    }),
  );

  function handleSubmit(
    data: z.infer<typeof clusterSchema.updateClusterSchema>,
  ) {
    updateClusterMutation.mutate(data);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 py-4">
        <SkeletonInput className="w-full" />
        <SkeletonTextArea className="w-full" />
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
          name="name"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              className="space-y-1"
            >
              <FieldLabel className="ml-1 text-sm font-bold">
                Nama Cluster
              </FieldLabel>
              <Input
                type="text"
                placeholder="Masukkan nama cluster"
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
                Deskripsi Cluster
              </FieldLabel>
              <Textarea
                placeholder="Masukkan deskripsi cluster"
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

        <Button
          type="submit"
          className="mt-2 h-10 w-full text-sm"
          disabled={updateClusterMutation.isPending}
        >
          {updateClusterMutation.isPending ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Perbarui Cluster
        </Button>
      </FieldGroup>
    </form>
  );
}
