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
import { requirePermission } from "@/utils/require-permission";
import { queryClient, trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import userSchema from "@tepian-k3/schema/users.schema";
import { format } from "date-fns";
import { CalendarIcon, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

export const Route = createFileRoute("/(core)/dashboard/users/$userId/edit")({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "users.update" }),
  params: z.object({
    userId: z.uuidv7(),
  }),
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(
      context.trpc.user.getUserDetails.queryOptions({
        userId: params.userId,
      }),
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const { userId } = Route.useParams();

  const { data: user } = useSuspenseQuery(
    trpc.user.getUserDetails.queryOptions({ userId }),
  );

  const [type, setType] = useState<"text" | "password">("password");

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
    },
  });

  const updateUserMutation = useMutation(
    trpc.user.updateUser.mutationOptions({
      onSuccess: async (data) => {
        // Invalidate user details query
        await queryClient.invalidateQueries(
          trpc.user.getUserDetails.queryFilter({ userId: data.id }),
        );
        await queryClient.refetchQueries(
          trpc.user.getUserDetails.queryFilter({ userId: data.id }),
        );

        globalSuccessToast("User berhasil diperbarui");
      },
      onError: (error) => {
        globalErrorToast(error.message);
      },
    }),
  );

  function handleSubmit(
    values: z.infer<typeof userSchema.adminUpdateUserSchema>,
  ) {
    updateUserMutation.mutate(values);
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
                          type={type}
                          className="h-10 pr-10 text-sm"
                          {...field}
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
                    </FormControl>
                    <FormMessage className="min-h-4 text-xs" />
                  </FormItem>
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
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
