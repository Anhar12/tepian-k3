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
import { queryClient, trpc } from "@/utils/trpc";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import authSchema from "@tepian-k3/schema/auth.schema";
import type z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { Link, useNavigate } from "@tanstack/react-router";
import { Separator } from "./ui/separator";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();

  const [type, setType] = useState<"text" | "password">("password");

  const form = useForm<z.infer<typeof authSchema.loginSchema>>({
    resolver: zodResolver(authSchema.loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation(
    trpc.auth.login.mutationOptions({
      onSuccess: async (data) => {
        localStorage.setItem("token", data.token);

        await queryClient.refetchQueries(trpc.auth.me.queryFilter());

        globalSuccessToast("Login berhasil");

        if (data.user.roles?.find((role) => role.name === "user")) {
          navigate({ to: "/dashboard" });
        } else {
          navigate({ to: "/back-office" });
        }
      },
      onError: (error) => {
        globalErrorToast(error.message);
      },
    }),
  );

  function handleSubmit(values: z.infer<typeof authSchema.loginSchema>) {
    loginMutation.mutate(values);
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login ke akun Anda</CardTitle>
          <CardDescription>
            Masukkan email Anda di bawah untuk login ke akun Anda
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
                      placeholder="Masukkan email Anda"
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
                name="password"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Password
                    </FieldLabel>
                    <Link
                      to="/forgot-password"
                      className="text-right text-xs text-primary hover:underline"
                    >
                      Lupa password?
                    </Link>
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
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Masuk
              </Button>
              <Separator />
              <Link
                to="/register"
                className="text-center text-sm text-primary hover:underline"
              >
                Belum punya akun? Daftar di sini
              </Link>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
