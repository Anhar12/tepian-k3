import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useRedirectBackWithTimeout } from "@/lib/redirect-back-with-timeout";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { queryClient, trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import userSchema from "@tepian-k3/schema/users.schema";
import { format } from "date-fns";
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

export const Route = createFileRoute("/(core)/back-office/users/$userId/edit")({
  params: z.object({
    userId: z.uuidv7(),
  }),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: ["users.update", "roles.read"],
    }),
  loader: async ({ params, context }) => {
    context.queryClient.ensureQueryData(
      context.trpc.user.getUserDetailWithRolesAndPermissions.queryOptions({
        userId: params.userId,
      }),
    );
    context.queryClient.ensureQueryData(
      context.trpc.role.getAllRoles.queryOptions(),
    );
  },
  component: RouteComponent,
  pendingComponent: LoadingComponent,
  head: () => pageHead("Edit Pengguna"),
});

function LoadingComponent() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Perbarui User</CardTitle>
          <CardDescription>
            Perbarui informasi user di bawah ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Roles Combobox */}
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Address Field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Email Verified Checkbox */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>

            {/* Email Verified At */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Submit Button */}
            <Skeleton className="mt-2 h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RouteComponent() {
  const { userId } = Route.useParams();
  const redirectBack = useRedirectBackWithTimeout();

  const { data: roles } = useSuspenseQuery(
    trpc.role.getAllRoles.queryOptions(),
  );

  const { data: user } = useSuspenseQuery(
    trpc.user.getUserDetailWithRolesAndPermissions.queryOptions({ userId }),
  );

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"text" | "password">("password");

  // Store original user roles as a Set for O(1) lookups
  const originalUserRoles = new Set(user.roles.map((role) => role.id) ?? []);

  // Track current selected roles
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(
    () => new Set(user.roles.map((role) => role.id) ?? []),
  );

  // Derive added/removed roles when needed (e.g., for save button or dirty check)
  const { addedRoles, removedRoles } = useMemo(() => {
    const added = [...selectedRoles].filter(
      (role) => !originalUserRoles.has(role),
    );
    const removed = [...originalUserRoles].filter(
      (role) => !selectedRoles.has(role),
    );
    return {
      addedRoles: added,
      removedRoles: removed,
      hasChanges: added.length > 0 || removed.length > 0,
    };
  }, [selectedRoles, originalUserRoles]);

  const form = useForm<z.infer<typeof userSchema.adminUpdateUserSchema>>({
    resolver: zodResolver(userSchema.adminUpdateUserSchema),
    defaultValues: {
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address || "",
      phone: user.phone || "",
      emailVerified: user.emailVerified,
      password: undefined,
      emailVerifiedAt: new Date(
        user.emailVerified ? user.emailVerifiedAt! : Date.now(),
      ),
      deletedRoleIds: [],
      newRoleIds: [],
    },
  });

  const updateUserMutation = useMutation(
    trpc.user.updateUser.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(
          trpc.user.getUserDetails.queryFilter({ userId: data.id }),
        );
        globalSuccessToast("User berhasil diperbarui");
        await redirectBack();
      },
      onError: (error) => {
        globalErrorToast("Gagal memperbarui user: " + error.message);
      },
    }),
  );

  function handleSubmit(
    values: z.infer<typeof userSchema.adminUpdateUserSchema>,
  ) {
    updateUserMutation.mutate({
      ...values,
      newRoleIds: addedRoles,
      deletedRoleIds: removedRoles,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Perbarui User</CardTitle>
          <CardDescription>
            Perbarui informasi user di bawah ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid gap-4"
          >
            <FieldGroup>
              <div className="space-y-1">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className={cn(
                        "w-full justify-between",
                        !selectedRoles.size && "text-muted-foreground",
                      )}
                    >
                      {selectedRoles.size
                        ? [...selectedRoles]
                            .map((roleId) => {
                              const role = roles.find((r) => r.id === roleId);
                              return role ? role.name : "Unknown Role";
                            })
                            .join(", ")
                        : "Pilih Role..."}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="popover-content-width-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Cari Role..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>
                          Tidak ada role yang ditemukan.
                        </CommandEmpty>
                        <CommandGroup>
                          {roles.map((role) => {
                            const isSelected = selectedRoles.has(role.id);
                            return (
                              <CommandItem
                                value={role.name}
                                key={role.id}
                                onSelect={() => {
                                  const currentValue = [...selectedRoles];
                                  if (isSelected) {
                                    currentValue.splice(
                                      currentValue.indexOf(role.id),
                                      1,
                                    );
                                    setSelectedRoles(new Set(currentValue));
                                  } else {
                                    setSelectedRoles(
                                      new Set([...currentValue, role.id]),
                                    );
                                  }
                                }}
                              >
                                {role.name}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    isSelected ? "opacity-100" : "opacity-0",
                                  )}
                                />
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Nama
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan nama lengkap"
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
                name="address"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Alamat
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan alamat lengkap"
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
                name="phone"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Telpon
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan nomor telepon"
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
                name="emailVerified"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Verifikasi Email
                    </FieldLabel>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <Label>Terverifikasi</Label>
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="emailVerifiedAt"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Tanggal Verifikasi Email
                    </FieldLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          aria-invalid={fieldState.invalid}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pilih tanggal verifikasi email</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ?? undefined}
                          onSelect={field.onChange}
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
                name="password"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Password
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        placeholder="Masukkan password Anda"
                        type={type}
                        className="h-10 pr-10 text-sm"
                        {...field}
                        aria-invalid={fieldState.invalid}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => {
                          setType((prev) =>
                            prev === "password" ? "text" : "password",
                          );
                        }}
                      >
                        {type === "password" ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Button
                type="submit"
                className="mt-2 h-10 w-full text-sm"
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Update User
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
