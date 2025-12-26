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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import userSchema from "@tepian-k3/schema/users.schema";
import { format } from "date-fns";
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  LoaderCircle,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { requirePermission } from "@/utils/require-permission";

export const Route = createFileRoute("/(core)/dashboard/users/create")({
  beforeLoad: async ({ context }) => {
    await requirePermission(context, { permission: "users.create" });
  },
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      context.trpc.role.getAllRoles.queryOptions(),
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();

  const { data: roles } = useSuspenseQuery(
    trpc.role.getAllRoles.queryOptions(),
  );

  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof userSchema.adminCreateUserSchema>>({
    resolver: zodResolver(userSchema.adminCreateUserSchema),
    defaultValues: {
      roleId: [],
    },
  });

  const createUserMutation = useMutation(
    trpc.user.createUser.mutationOptions({
      onSuccess: () => {
        globalSuccessToast("Pengguna berhasil dibuat");
        form.reset();
        router.history.back();
      },
      onError: (error) => {
        globalErrorToast("Gagal membuat pengguna: " + error.message);
      },
    }),
  );

  function handleSubmit(
    data: z.infer<typeof userSchema.adminCreateUserSchema>,
  ) {
    createUserMutation.mutate(data);
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
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="grid gap-4"
            >
              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="ml-1 text-sm font-bold">
                      Role
                    </FormLabel>
                    <FormControl>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={open}
                              className={cn(
                                "w-full justify-between",
                                !field.value?.length && "text-muted-foreground",
                              )}
                            >
                              {field.value?.length
                                ? field.value.length === 1
                                  ? roles.find(
                                      (role) => role.id === field.value[0],
                                    )?.name
                                  : `${field.value.length} role dipilih`
                                : "Pilih Role..."}
                              <ChevronsUpDown className="opacity-50" />
                            </Button>
                          </FormControl>
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
                                  const isSelected =
                                    field.value?.includes(role.id) ?? false;
                                  return (
                                    <CommandItem
                                      value={role.id}
                                      key={role.id}
                                      onSelect={() => {
                                        const currentValue = field.value ?? [];
                                        if (isSelected) {
                                          field.onChange(
                                            currentValue.filter(
                                              (id) => id !== role.id,
                                            ),
                                          );
                                        } else {
                                          field.onChange([
                                            ...currentValue,
                                            role.id,
                                          ]);
                                        }
                                      }}
                                    >
                                      {role.name}
                                      <Check
                                        className={cn(
                                          "ml-auto",
                                          isSelected
                                            ? "opacity-100"
                                            : "opacity-0",
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
                    </FormControl>
                    <FormMessage className="min-h-4 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="ml-1 text-sm font-bold">
                      Nama
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Masukkan nama lengkap"
                        className="h-10 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="min-h-4 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="ml-1 text-sm font-bold">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        className="h-10 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="min-h-4 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="ml-1 text-sm font-bold">
                      Alamat
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Masukkan alamat lengkap"
                        className="h-10 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="min-h-4 text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="ml-1 text-sm font-bold">
                      Telpon
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Masukkan nomor telepon"
                        className="h-10 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="min-h-4 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailVerified"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="ml-1 text-sm font-bold">
                      Verifikasi Email
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label>Terverifikasi</Label>
                      </div>
                    </FormControl>
                    <FormMessage className="min-h-4 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailVerifiedAt"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="ml-1 text-sm font-bold">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
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
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ?? undefined}
                            onSelect={field.onChange}
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage className="min-h-4 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="ml-1 text-sm font-bold">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Masukkan password Anda"
                          type="text"
                          className="h-10 pr-10 text-sm"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="min-h-4 text-xs" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="mt-2 h-10 w-full text-sm"
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Buat User
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
