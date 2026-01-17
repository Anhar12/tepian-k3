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
import userSchema from "@tepian-k3/schema/users.schema";
import { Separator } from "./ui/separator";

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

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

      <Card className="border-slate-200 shadow-sm bg-white rounded-lg flex flex-col max-h-[85vh]">
        
        <CardHeader className="pb-4 pt-6 px-6 space-y-1 shrink-0 border-b border-transparent">
          <CardTitle className="text-[#4D4D4D] text-[20px] font-semibold font-['Poppins'] leading-6">
            Daftar akun baru
          </CardTitle>
          <CardDescription className="text-[#64748B] text-[16px] font-normal font-['Poppins'] leading-5.25">
            Masukkan data Anda di bawah untuk mendaftar
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-6 overflow-y-auto custom-scrollbar pr-4">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-5 pt-2">
            <FieldGroup className="gap-5">
              
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="flex flex-col gap-1.5">
                    <FieldLabel className="text-[#4D4D4D] text-[16px] font-medium font-['Poppins'] leading-5.25">
                      Nama Lengkap
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan nama Anda"
                      className="h-9 border-slate-200 rounded-lg focus-visible:ring-offset-0 focus-visible:ring-[#1061D6] font-['Poppins'] text-[14px]"
                      {...field}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="flex flex-col gap-1.5">
                    <FieldLabel className="text-[#4D4D4D] text-[16px] font-medium font-['Poppins'] leading-5.25">
                      Email
                    </FieldLabel>
                    <Input
                      type="email"
                      placeholder="Masukkan email Anda"
                      className="h-9 border-slate-200 rounded-lg focus-visible:ring-offset-0 focus-visible:ring-[#1061D6] font-['Poppins'] text-[14px]"
                      {...field}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="address"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="flex flex-col gap-1.5">
                    <FieldLabel className="text-[#4D4D4D] text-[16px] font-medium font-['Poppins'] leading-5.25">
                      Alamat
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan alamat Anda"
                      className="h-9 border-slate-200 rounded-lg focus-visible:ring-offset-0 focus-visible:ring-[#1061D6] font-['Poppins'] text-[14px]"
                      {...field}
                      value={field.value ?? ""}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="phone"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="flex flex-col gap-1.5">
                    <FieldLabel className="text-[#4D4D4D] text-[16px] font-medium font-['Poppins'] leading-5.25">
                      Telepon
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan nomor telepon"
                      className="h-9 border-slate-200 rounded-lg focus-visible:ring-offset-0 focus-visible:ring-[#1061D6] font-['Poppins'] text-[14px]"
                      {...field}
                      value={field.value ?? ""}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="flex flex-col gap-1.5">
                    <FieldLabel className="text-[#4D4D4D] text-[16px] font-medium font-['Poppins'] leading-5.25">
                      Password
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        placeholder="Buat password baru"
                        type={showPassword ? "text" : "password"}
                        className="h-9 border-slate-200 rounded-lg pr-10 focus-visible:ring-offset-0 focus-visible:ring-[#1061D6] font-['Poppins'] text-[14px]"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent text-slate-500 hover:text-slate-700"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-[#1061D6] hover:bg-blue-700 text-[#F8FAFC] text-[16px] font-semibold font-['Poppins'] h-9 rounded-lg"
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
                <div className="text-center text-[14px] font-normal font-['Poppins'] leading-5.25 text-[#4D4D4D]">
                  <span>Sudah punya akun? </span>
                  <Link
                    to="/login"
                    className="text-[#1061D6] font-medium hover:underline"
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