import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { globalSuccessToast } from "@/lib/toast";
import z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { LoaderCircle } from "lucide-react";

const resetPasswordSchema = z.object({
  email: z.email("Gunakan format email yang valid"),
});

export const Route = createFileRoute("/(auth)/forgot-password")({
  component: RouteComponent,
});

function RouteComponent() {
  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const [submitted, setSubmitted] = useState(false);

  const requestReset = useMutation(
    trpc.auth.requestPasswordReset.mutationOptions({
      onSuccess: () => {
        globalSuccessToast("Email reset password telah dikirim.");

        setSubmitted(true);
      },
    }),
  );

  function handleSubmit(values: z.infer<typeof resetPasswordSchema>) {
    requestReset.mutate(values);
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <h2 className="mb-4 text-2xl font-bold">Permintaan Terkirim</h2>
            <p className="text-gray-600">
              Jika email tersebut terdaftar, Anda akan menerima instruksi untuk
              mereset password Anda.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Lupa Password ?</CardTitle>
          <CardDescription>
            Masukkan email Anda dan kami akan mengirimkan tautan untuk mereset
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
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

              <Button
                type="submit"
                disabled={requestReset.isPending}
                className="w-full"
              >
                {requestReset.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Kirim Tautan Reset Password
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
