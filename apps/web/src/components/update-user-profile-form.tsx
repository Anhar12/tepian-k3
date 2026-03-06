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
import { Label } from "./ui/label";
import type { Users } from "@tepian-k3/types/platform/users.types";
import z from "zod";
import userSchema from "@tepian-k3/schema/platform/users.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, trpc } from "@/utils/trpc";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Textarea } from "./ui/textarea";
import { LoaderCircle } from "lucide-react";

interface UpdateUserProfileFormProps {
  user: Users;
}

export default function UpdateUserProfileForm({
  user,
}: UpdateUserProfileFormProps) {
  const form = useForm<z.infer<typeof userSchema.updateUserSchema>>({
    resolver: zodResolver(userSchema.updateUserSchema),
    defaultValues: {
      name: user.name,
      address: user.address,
      phone: user.phone,
    },
  });

  const updateProfileMutation = useMutation(
    trpc.platform.user.updateProfile.mutationOptions({
      onSuccess: async () => {
        await queryClient.refetchQueries(trpc.platform.auth.me.queryOptions());
        globalSuccessToast("Profil berhasil diperbarui");
      },
      onError: (error) => {
        globalErrorToast(error.message);
      },
    }),
  );

  function onSubmit(data: z.infer<typeof userSchema.updateUserSchema>) {
    updateProfileMutation.mutate(data);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your personal details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama lengkap" {...field} />
                  </FormControl>
                  <FormMessage className="min-h-4 text-xs" />
                </FormItem>
              )}
            />

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                defaultValue={user?.email || ""}
                placeholder="Masukkan email Anda"
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Email tidak dapat diubah
              </p>
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Alamat</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Alamat lengkap" {...field} />
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
                  <FormLabel>Telepon</FormLabel>
                  <FormControl>
                    <Input placeholder="Nomor telepon" {...field} />
                  </FormControl>
                  <FormMessage className="min-h-4 text-xs" />
                </FormItem>
              )}
            />

            <Button
              className="w-full"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Perbarui Profil
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
