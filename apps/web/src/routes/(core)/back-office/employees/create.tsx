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
import { useRedirectBackWithTimeout } from "@/lib/redirect-back-with-timeout";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import employeeSchema from "@tepian-k3/schema/employee.schema";
import { LoaderCircle } from "lucide-react";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import ComboBox from "@/components/ui/combobox";
import useDialogs from "@/hooks/use-dialog";

export const Route = createFileRoute("/(core)/back-office/employees/create")({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: "employees.create",
    }),
  component: RouteComponent,
});

function RouteComponent() {
  const dialogs = useDialogs({
    position: null,
    user: null,
  });

  const redirectBack = useRedirectBackWithTimeout();

  const form = useForm<z.infer<typeof employeeSchema.createEmployeeSchema>>({
    resolver: zodResolver(employeeSchema.createEmployeeSchema),
    defaultValues: {
      name: "",
      positionId: "",
      userId: "",
    },
  });

  const createEmployeeMutation = useMutation(
    trpc.employee.createEmployee.mutationOptions({
      onSuccess: async () => {
        globalSuccessToast("Berhasil membuat karyawan");
        form.reset();
        await redirectBack();
      },
      onError: (error) => {
        globalErrorToast("Gagal membuat karyawan: " + error.message);
      },
    }),
  );

  function handleSubmit(
    data: z.infer<typeof employeeSchema.createEmployeeSchema>,
  ) {
    createEmployeeMutation.mutate(data);
  }

  const { data: positions, isLoading: isLoadingPositions } = useQuery(
    trpc.position.getAll.queryOptions(),
  );

  const { data: users, isLoading: isLoadingUsers } = useQuery(
    trpc.user.getAllUsers.queryOptions(),
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Buat Karyawan Baru</CardTitle>
          <CardDescription>
            Isi form di bawah untuk membuat karyawan baru.
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
                name="email"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Email
                    </FieldLabel>
                    <Input
                      type="email"
                      placeholder="Masukkan email"
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
                name="positionId"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Posisi
                    </FieldLabel>
                    <ComboBox
                      options={
                        positions?.map((position) => ({
                          id: position.id,
                          name: position.name,
                        })) ?? []
                      }
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Pilih posisi..."
                      searchPlaceholder="Cari posisi..."
                      emptyMessage="Tidak ada posisi yang ditemukan."
                      open={dialogs.isOpen("position")}
                      onOpenChange={(open) =>
                        open
                          ? dialogs.open("position")
                          : dialogs.close("position")
                      }
                      invalid={fieldState.invalid}
                      isLoading={isLoadingPositions}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="userId"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Pengguna
                    </FieldLabel>
                    <ComboBox
                      options={
                        users?.map((user) => ({
                          id: user.id,
                          name: user.name,
                        })) ?? []
                      }
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Pilih pengguna..."
                      searchPlaceholder="Cari pengguna..."
                      emptyMessage="Tidak ada pengguna yang ditemukan."
                      open={dialogs.isOpen("user")}
                      onOpenChange={(open) =>
                        open ? dialogs.open("user") : dialogs.close("user")
                      }
                      invalid={fieldState.invalid}
                      isLoading={isLoadingUsers}
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
                disabled={createEmployeeMutation.isPending}
              >
                {createEmployeeMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Buat Karyawan
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
