import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import z from "zod";
import userSchema from "@tepian-k3/schema/users.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { LoaderCircle } from "lucide-react";

export default function ChangePasswordForm() {
  const form = useForm<z.infer<typeof userSchema.updateUserPasswordSchema>>({
    resolver: zodResolver(userSchema.updateUserPasswordSchema),
    defaultValues: {
      newPassword: "",
      newPasswordConfirm: "",
    },
  });

  const updatePasswordMutation = useMutation(
    trpc.user.updatePassword.mutationOptions({
      onSuccess: () => {
        globalSuccessToast("Password berhasil diperbarui");
        form.reset();
      },
      onError: (error) => {
        globalErrorToast(error.message);
      },
    })
  );

  function onSubmit(data: z.infer<typeof userSchema.updateUserPasswordSchema>) {
    updatePasswordMutation.mutate(data);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ganti Password</CardTitle>
        <CardDescription>
          Gunakan form di bawah untuk memperbarui password akun Anda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="ml-1 font-bold text-sm">
                    Password Baru
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Masukkan password baru"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="min-h-4 text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPasswordConfirm"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="ml-1 font-bold text-sm">
                    Konfirmasi Password Baru
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Masukkan konfirmasi password baru"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="min-h-4 text-xs" />
                </FormItem>
              )}
            />

            <Button className="w-full">
              {updatePasswordMutation.isPending ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Perbarui Password
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
