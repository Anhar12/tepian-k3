import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import z from "zod";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";

const resetPasswordSchema = z
  .object({
    token: z.string(),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long"),
    confirmNewPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "Passwords do not match",
  });

export const Route = createFileRoute("/(auth)/reset-password")({
  validateSearch: z.object({
    token: z.string(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();

  const [type, setType] = useState<"text" | "password">("password");
  const [confirmPasswordType, setConfirmPasswordType] = useState<
    "text" | "password"
  >("password");

  const verifyToken = useQuery({
    ...trpc.auth.verifyResetToken.queryOptions({ token }),
    enabled: !!token,
  });

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: token || "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const resetPasswordMutation = useMutation(
    trpc.auth.resetPassword.mutationOptions({
      onSuccess: () => {
        globalSuccessToast(
          "Password berhasil direset. Silakan masuk dengan password baru Anda.",
        );

        navigate({ to: "/login" });
      },
      onError: (error) => {
        globalErrorToast(`Gagal mereset password: ${error.message}`);
      },
    }),
  );

  function handleSubmit(values: z.infer<typeof resetPasswordSchema>) {
    resetPasswordMutation.mutate({
      token: values.token,
      newPassword: values.newPassword,
    });
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <h2 className="mb-4 text-2xl font-bold text-red-600">
              Invalid Link
            </h2>
            <p>Tautan reset ini tidak valid atau telah kedaluwarsa.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verifyToken.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <LoaderCircle className="h-8 w-8 animate-spin" />
        <h2 className="ml-4 text-2xl font-bold">Memverifikasi Link...</h2>
      </div>
    );
  }

  if (verifyToken.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <h2 className="mb-4 text-2xl font-bold text-red-600">
              Invalid Link
            </h2>
            <p>Tautan reset ini tidak valid atau telah kedaluwarsa.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FieldGroup>
              <Controller
                control={form.control}
                name="newPassword"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Password Baru
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

              <Controller
                control={form.control}
                name="confirmNewPassword"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Konfirmasi Password Baru
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        placeholder="Masukkan konfirmasi password Anda"
                        type={confirmPasswordType}
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
                          setConfirmPasswordType((prev) =>
                            prev === "password" ? "text" : "password",
                          );
                        }}
                      >
                        {confirmPasswordType === "password" ? (
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
                disabled={resetPasswordMutation.isPending}
                className="w-full"
              >
                {resetPasswordMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Reset Password
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
