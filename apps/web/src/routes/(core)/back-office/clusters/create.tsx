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
import { useRedirectBackWithTimeout } from "@/lib/redirect-back-with-timeout";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import clusterSchema from "@tepian-k3/schema/cluster.schema";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { pageHead } from "@/utils/page-head";

export const Route = createFileRoute("/(core)/back-office/clusters/create")({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "clusters.create" }),
  component: RouteComponent,
  head: () => pageHead("Buat Klaster Baru"),
});

function RouteComponent() {
  const redirectBack = useRedirectBackWithTimeout();

  const form = useForm<z.infer<typeof clusterSchema.createClusterSchema>>({
    resolver: zodResolver(clusterSchema.createClusterSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createClusterMutation = useMutation(
    trpc.cluster.createCluster.mutationOptions({
      onSuccess: async () => {
        globalSuccessToast("Berhasil membuat cluster");
        form.reset();
        await redirectBack(350);
      },
      onError: (error) => {
        globalErrorToast("Gagal membuat cluster: " + error.message);
      },
    }),
  );

  function handleSubmit(
    data: z.infer<typeof clusterSchema.createClusterSchema>,
  ) {
    createClusterMutation.mutate(data);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Buat Cluster Baru</CardTitle>
          <CardDescription>
            Isi form di bawah untuk membuat cluster baru.
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
                disabled={createClusterMutation.isPending}
              >
                {createClusterMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Buat Cluster
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
