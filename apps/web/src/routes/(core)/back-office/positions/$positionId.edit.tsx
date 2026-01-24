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
import {
  SkeletonInput,
  SkeletonButton,
  SkeletonTextArea,
} from "@/components/ui/skeleton-generator";
import { useRedirectBackWithTimeout } from "@/lib/redirect-back-with-timeout";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import positionSchema from "@tepian-k3/schema/position.schema";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

export const Route = createFileRoute(
  "/(core)/back-office/positions/$positionId/edit",
)({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: "positions.update",
    }),
  params: z.object({
    positionId: z.uuidv7(),
  }),
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(
      context.trpc.position.getPositionDetails.queryOptions({
        id: params.positionId,
      }),
    );
  },
  pendingComponent: LoaderComponent,
  component: RouteComponent,
});

function LoaderComponent() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Perbarui Parameter</CardTitle>
          <CardDescription>
            Isi form di bawah untuk memperbarui parameter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <SkeletonInput className="w-full" />
            <SkeletonTextArea className="w-full" />
            <SkeletonButton className="w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RouteComponent() {
  const { positionId } = Route.useParams();
  const redirectBack = useRedirectBackWithTimeout();

  const { data: position } = useSuspenseQuery(
    trpc.position.getPositionDetails.queryOptions({
      id: positionId,
    }),
  );

  const form = useForm<z.infer<typeof positionSchema.updatePositionSchema>>({
    resolver: zodResolver(positionSchema.updatePositionSchema),
    defaultValues: {
      id: positionId,
      name: position?.name ?? "",
      description: position?.description ?? "",
    },
  });

  const updatePositionMutation = useMutation(
    trpc.position.updatePosition.mutationOptions({
      onSuccess: async () => {
        globalSuccessToast("Berhasil memperbarui posisi");
        form.reset();
        await redirectBack();
      },
      onError: (error) => {
        globalErrorToast("Gagal memperbarui posisi: " + error.message);
      },
    }),
  );

  function handleSubmit(
    data: z.infer<typeof positionSchema.updatePositionSchema>,
  ) {
    updatePositionMutation.mutate(data);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Perbarui Posisi</CardTitle>
          <CardDescription>
            Isi form di bawah untuk memperbarui posisi.
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
                      Nama Posisi
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan nama posisi"
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
                      Deskripsi Posisi
                    </FieldLabel>
                    <Textarea
                      {...field}
                      placeholder="Masukkan deskripsi posisi"
                      className="h-10 text-sm"
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
                disabled={updatePositionMutation.isPending}
              >
                {updatePositionMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Perbarui Posisi
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
