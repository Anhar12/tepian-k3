import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/utils/trpc";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { Link, useNavigate } from "@tanstack/react-router";
import userSchema from "@tepian-k3/schema/users.schema";
import { Separator } from "./ui/separator";

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();

  const [type, setType] = useState<"text" | "password">("password");

  const form = useForm<z.infer<typeof userSchema.createUserSchema>>({
    resolver: zodResolver(userSchema.createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      address: "",
      phone: "",
      password: "",
    },
  });

  const registerMutation = useMutation(
    trpc.auth.register.mutationOptions({
      onSuccess: (data) => {
        globalSuccessToast("Daftar berhasil, silahkan verifikasi email Anda.");

        navigate({
          to: "/verify-email",
          search: {
            email: data.email,
          },
        });
      },
      onError: (error) => {
        globalErrorToast(error.message);
      },
    })
  );

  function handleSubmit(values: z.infer<typeof userSchema.createUserSchema>) {
    registerMutation.mutate(values);
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Daftar akun baru</CardTitle>
          <CardDescription>
            Masukkan email Anda di bawah untuk mendaftar akun baru
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
                    <FormLabel className="ml-1 font-bold text-sm">
                      Nama
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Masukkan nama Anda"
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
                    <FormLabel className="ml-1 font-bold text-sm">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Masukkan email Anda"
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
                    <FormLabel className="ml-1 font-bold text-sm">
                      Alamat
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Masukkan alamat Anda"
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
                    <FormLabel className="ml-1 font-bold text-sm">
                      Telepon
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Masukkan telepon Anda"
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
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="ml-1 font-bold text-sm">
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
                              prev === "password" ? "text" : "password"
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
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Daftar
              </Button>
              <Separator />
              <Link
                to="/login"
                className="text-center text-sm text-primary hover:underline"
              >
                Sudah punya akun? Masuk di sini
              </Link>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
