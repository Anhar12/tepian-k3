import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AutoForm } from "@/components/ui/auto-form";
import { useRedirectBackWithTimeout } from "@/lib/redirect-back-with-timeout";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import kbliSchema from "@tepian-k3/schema/kbli.schema";

export const Route = createFileRoute("/(core)/back-office/kblis/create")({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "kbli.create" }),
  component: RouteComponent,
  head: () => pageHead("Tambah KBLI"),
});

function RouteComponent() {
  const redirectBack = useRedirectBackWithTimeout();

  const createKBLIMutation = useMutation(
    trpc.kbli.createKbli.mutationOptions({
      onSuccess: async () => {
        globalSuccessToast("Berhasil membuat KBLI");
        await redirectBack(350);
      },
      onError: (error) => {
        globalErrorToast("Gagal membuat KBLI: " + error.message);
      },
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Buat KBLI Baru</CardTitle>
          <CardDescription>
            Isi form di bawah untuk membuat KBLI baru.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AutoForm
            schema={kbliSchema.createKBLISchema}
            onSubmit={(data) => createKBLIMutation.mutate(data)}
            isPending={createKBLIMutation.isPending}
            submitLabel="Buat KBLI"
            defaultValues={{ name: "" }}
            fieldOverrides={{
              name: {
                label: "Nama KBLI",
                placeholder: "Masukkan nama KBLI",
                component: "combobox",
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
