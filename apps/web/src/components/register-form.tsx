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
import { Controller, useForm } from "react-hook-form";
import type z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { Link, useNavigate } from "@tanstack/react-router";
import userSchema from "@tepian-k3/schema/platform/users.schema";
import { Separator } from "./ui/separator";

export function RegisterForm({
  className,
  initialData,
  ...props
}: React.ComponentProps<"div"> & {
  initialData?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
}) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof userSchema.createUserSchema>>({
    resolver: zodResolver(userSchema.createUserSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      email: initialData?.email ?? "",
      address: initialData?.address ?? "",
      phone: initialData?.phone ?? "",
      password: "",
    },
  });

  const registerMutation = useMutation(
    trpc.platform.auth.register.mutationOptions({
      onSuccess: (data) => {
        globalSuccessToast("Daftar berhasil, silahkan verifikasi email Anda.");
        navigate({
          to: "/verify-email",
          search: { email: data.email },
        });
      },
      onError: (error) => {
        globalErrorToast(error.message);
      },
    }),
  );

  function handleSubmit(values: z.infer<typeof userSchema.createUserSchema>) {
    registerMutation.mutate(values);
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="flex max-h-[85vh] flex-col rounded-lg border-slate-200 bg-white shadow-sm">
        <CardHeader className="shrink-0 space-y-1 border-b border-transparent px-6 pt-6 pb-4">
          <CardTitle className="font-['Poppins'] text-[20px] leading-6 font-semibold text-[#4D4D4D]">
            Daftar akun baru
          </CardTitle>
          <CardDescription className="font-['Poppins'] text-[16px] leading-5.25 font-normal text-[#64748B]">
            Masukkan data Anda di bawah untuk mendaftar
          </CardDescription>
        </CardHeader>

        <CardContent className="custom-scrollbar overflow-y-auto px-6 pr-4 pb-6">
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid gap-5 pt-2"
          >
            <FieldGroup className="gap-5">
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="flex flex-col gap-1.5"
                  >
                    <FieldLabel className="font-['Poppins'] text-[16px] leading-5.25 font-medium text-[#4D4D4D]">
                      Nama Lengkap
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan nama Anda"
                      className="h-9 rounded-lg border-slate-200 font-['Poppins'] text-[14px] focus-visible:ring-[#1061D6] focus-visible:ring-offset-0"
                      {...field}
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
                    className="flex flex-col gap-1.5"
                  >
                    <FieldLabel className="font-['Poppins'] text-[16px] leading-5.25 font-medium text-[#4D4D4D]">
                      Alamat
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan alamat Anda"
                      className="h-9 rounded-lg border-slate-200 font-['Poppins'] text-[14px] focus-visible:ring-[#1061D6] focus-visible:ring-offset-0"
                      {...field}
                      value={field.value ?? ""}
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
                    className="flex flex-col gap-1.5"
                  >
                    <FieldLabel className="font-['Poppins'] text-[16px] leading-5.25 font-medium text-[#4D4D4D]">
                      Telepon
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan nomor telepon"
                      className="h-9 rounded-lg border-slate-200 font-['Poppins'] text-[14px] focus-visible:ring-[#1061D6] focus-visible:ring-offset-0"
                      {...field}
                      value={field.value ?? ""}
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
                    <FieldLabel className="font-['Poppins'] text-[16px] leading-5.25 font-medium text-[#4D4D4D]">
                      Password
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        placeholder="Buat password baru"
                        type={showPassword ? "text" : "password"}
                        className="h-9 rounded-lg border-slate-200 pr-10 font-['Poppins'] text-[14px] focus-visible:ring-[#1061D6] focus-visible:ring-offset-0"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0 h-full px-3 py-2 text-slate-500 hover:bg-transparent hover:text-slate-700"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword
                            ? "Sembunyikan password"
                            : "Tampilkan password"
                        }
                      >
                        {showPassword ? (
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

              <div className="pt-2">
                <Button
                  type="submit"
                  className="h-9 w-full rounded-lg bg-[#1061D6] font-['Poppins'] text-[16px] font-semibold text-[#F8FAFC] hover:bg-blue-700"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Daftar Sekarang
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                <Separator className="bg-slate-100" />
                <div className="text-center font-['Poppins'] text-[14px] leading-5.25 font-normal text-[#4D4D4D]">
                  <span>Sudah punya akun? </span>
                  <Link
                    to="/login"
                    className="font-medium text-[#1061D6] hover:underline"
                  >
                    Masuk di sini
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
