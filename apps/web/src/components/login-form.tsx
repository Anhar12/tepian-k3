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
        navigate({ to: "/dashboard" });
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
      <Card className="border-slate-200 shadow-sm bg-white rounded-lg">
        <CardHeader className="pb-6 pt-6 px-6 space-y-1">
          <CardTitle className="text-[#4D4D4D] text-[20px] font-semibold font-['Poppins'] leading-6">
            Login ke akun Anda
          </CardTitle>
          <CardDescription className="text-[#64748B] text-[16px] font-normal font-['Poppins'] leading-5.25">
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
                    <FieldLabel className="text-[#4D4D4D] text-[16px] font-medium font-['Poppins'] leading-5.25">
                      Email
                    </FieldLabel>
                    <Input
                      type="email"
                      placeholder="Masukkan email Anda"
                      className="h-9 border-slate-200 rounded-lg focus-visible:ring-offset-0 focus-visible:ring-[#1061D6] font-['Poppins'] text-[14px]"
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
                      <FieldLabel className="text-[#4D4D4D] text-[16px] font-medium font-['Poppins'] leading-5.25">
                        Password
                      </FieldLabel>
                    </div>
                    
                    <div className="relative">
                      <Input
                        placeholder="Masukkan password Anda"
                        type={type}
                        className="h-9 border-slate-200 rounded-lg pr-10 focus-visible:ring-offset-0 focus-visible:ring-[#1061D6] font-['Poppins'] text-[14px]"
                        {...field}
                        aria-invalid={fieldState.invalid}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent text-slate-500 hover:text-slate-700"
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
                    
                    <div className="flex justify-end mt-1">
                      <Link
                        to="/forgot-password"
                        className="text-[14px] text-[#4D4D4D] font-normal font-['Poppins'] hover:underline leading-5.25"
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
                className="w-full bg-[#1061D6] hover:bg-blue-700 text-[#F8FAFC] text-[16px] font-semibold font-['Poppins'] h-9 rounded-lg mt-2"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Masuk
              </Button>

              <div className="flex flex-col gap-3">
                <Separator className="bg-slate-100" />
                <div className="text-center text-[14px] font-normal font-['Poppins'] leading-5.25 text-[#4D4D4D]">
                  <span>Belum punya akun? </span>
                  <Link
                    to="/register"
                    className="text-[#1061D6] font-medium hover:underline"
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