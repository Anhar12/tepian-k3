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
import { createFileRoute } from "@tanstack/react-router";
import rolesSchema from "@tepian-k3/schema/role.schema";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

export const Route = createFileRoute("/(core)/dashboard/roles/$roleId/edit")({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "roles.create" }),
  params: z.object({
    roleId: z.uuidv7(),
  }),
  loader: async ({ context, params }) =>
    context.queryClient.ensureQueryData(
      context.trpc.role.getRoleById.queryOptions({ id: params.roleId }),
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const { roleId } = Route.useParams();

  const { data: role } = useSuspenseQuery(
    trpc.role.getRoleById.queryOptions({ id: roleId }),
  );

  const form = useForm<z.infer<typeof rolesSchema.updateRoleSchema>>({
    resolver: zodResolver(rolesSchema.updateRoleSchema),
    defaultValues: {
      id: role.id,
      name: role.name,
      description: role.description ?? undefined,
    },
  });

  const updateRoleMutation = useMutation(
    trpc.role.updateRole.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.role.getRoleById.queryOptions({ id: roleId }),
        );

        await queryClient.refetchQueries(
          trpc.role.getRoleById.queryOptions({ id: roleId }),
        );

        globalSuccessToast("Berhasil memperbarui role");
      },
      onError: (error) => {
        globalErrorToast("Gagal memperbarui role: " + error.message);
      },
    }),
  );

  function handleSubmit(data: z.infer<typeof rolesSchema.updateRoleSchema>) {
    updateRoleMutation.mutate(data);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Role</CardTitle>
          <CardDescription>
            Perbarui informasi role di bawah ini.
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
                      Nama Role
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan nama role"
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
                      Deskripsi Role
                    </FieldLabel>
                    <Textarea
                      placeholder="Masukkan deskripsi role"
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
                disabled={updateRoleMutation.isPending}
              >
                {updateRoleMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Perbarui Role
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
