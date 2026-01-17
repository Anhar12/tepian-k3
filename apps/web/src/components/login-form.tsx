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
import { useMutation } from "@tanstack/react-query";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { Link, useNavigate } from "@tanstack/react-router";
import { Separator } from "./ui/separator";
import { auth } from "@/utils/auth";

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
        auth.setTokens(data.accessToken, data.refreshToken);
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
      <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
        <CardHeader className="space-y-1 px-6 pt-6 pb-6">
          <CardTitle className="font-['Poppins'] text-[20px] leading-6 font-semibold text-[#4D4D4D]">
            Login ke akun Anda
          </CardTitle>
          <CardDescription className="font-['Poppins'] text-[16px] leading-5.25 font-normal text-[#64748B]">
            Masukkan email Anda di bawah untuk login ke akun Anda
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid gap-7"
          >
            <FieldGroup className="gap-7">
              <Controller
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="flex flex-col gap-1.5"
                  >
                    <FieldLabel className="font-['Poppins'] text-[16px] leading-5.25 font-medium text-[#4D4D4D]">
                      Email
                    </FieldLabel>
                    <Input
                      type="email"
                      placeholder="Masukkan email Anda"
                      className="h-9 rounded-lg border-slate-200 font-['Poppins'] text-[14px] focus-visible:ring-[#1061D6] focus-visible:ring-offset-0"
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
                    className="flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <FieldLabel className="font-['Poppins'] text-[16px] leading-5.25 font-medium text-[#4D4D4D]">
                        Password
                      </FieldLabel>
                    </div>

                    <div className="relative">
                      <Input
                        placeholder="Masukkan password Anda"
                        type={type}
                        className="h-9 rounded-lg border-slate-200 pr-10 font-['Poppins'] text-[14px] focus-visible:ring-[#1061D6] focus-visible:ring-offset-0"
                        {...field}
                        aria-invalid={fieldState.invalid}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0 h-full px-3 py-2 text-slate-500 hover:bg-transparent hover:text-slate-700"
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

                    <div className="mt-1 flex justify-end">
                      <Link
                        to="/forgot-password"
                        className="font-['Poppins'] text-[14px] leading-5.25 font-normal text-[#4D4D4D] hover:underline"
                      >
                        Lupa password?
                      </Link>
                    </div>

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Button
                type="submit"
                className="mt-2 h-9 w-full rounded-lg bg-[#1061D6] font-['Poppins'] text-[16px] font-semibold text-[#F8FAFC] hover:bg-blue-700"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Masuk
              </Button>

              <div className="flex flex-col gap-3">
                <Separator className="bg-slate-100" />
                <div className="text-center font-['Poppins'] text-[14px] leading-5.25 font-normal text-[#4D4D4D]">
                  <span>Belum punya akun? </span>
                  <Link
                    to="/register"
                    className="font-medium text-[#1061D6] hover:underline"
                  >
                    Daftar di sini
                  </Link>
                </div>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
