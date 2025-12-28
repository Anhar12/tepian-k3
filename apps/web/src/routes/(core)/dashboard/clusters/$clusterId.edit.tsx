import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { requirePermission } from "@/utils/require-permission";
import { queryClient, trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import clusterSchema from "@tepian-k3/schema/cluster.schema";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

export const Route = createFileRoute(
  "/(core)/dashboard/clusters/$clusterId/edit",
)({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "clusters.update" }),
  params: z.object({
    clusterId: z.uuidv7(),
  }),
  loader: async ({ context, params }) =>
    context.queryClient.ensureQueryData(
      context.trpc.cluster.getClusterById.queryOptions({
        id: params.clusterId,
      }),
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const { clusterId } = Route.useParams();
  const router = useRouter();

  const { data: cluster } = useSuspenseQuery(
    trpc.cluster.getClusterById.queryOptions({ id: clusterId }),
  );

  const form = useForm<z.infer<typeof clusterSchema.updateClusterSchema>>({
    resolver: zodResolver(clusterSchema.updateClusterSchema),
    defaultValues: {
      id: cluster.id,
      name: cluster.name,
      description: cluster.description ?? undefined,
    },
  });

  const updateClusterMutation = useMutation(
    trpc.cluster.updateCluster.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.cluster.getClusterById.queryOptions({ id: clusterId }),
        );
        globalSuccessToast("Berhasil memperbarui cluster");
        router.history.back();
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

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Perbarui Cluster</CardTitle>
          <CardDescription>
            Isi form di bawah untuk memperbarui cluster.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid gap-4"
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
        </CardContent>
      </Card>
    </div>
  );
}
