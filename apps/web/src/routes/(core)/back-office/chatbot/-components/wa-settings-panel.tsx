import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  waNumber: z.string().min(10, "Nomor WA tidak valid").regex(/^[0-9]+$/, "Hanya angka"),
});

export function WaSettingsPanel() {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const { data: settingData, isLoading: isFetching } = useQuery(
    trpc.platform.setting.getByKey.queryOptions({ key: "chatbot_wa_number" })
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      waNumber: "",
    },
  });

  useEffect(() => {
    if (settingData) {
      form.reset({ waNumber: settingData.value || "" });
    }
  }, [settingData, form]);

  const updateMutation = useMutation({
    ...trpc.platform.setting.set.mutationOptions(),
    onSuccess: () => {
      toast.success("Nomor WA berhasil disimpan");
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes("chatbot_wa_number"),
      });
      setIsEditing(false);
    },
    onError: (err: any) => {
      toast.error(`Gagal menyimpan: ${err.message}`);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateMutation.mutate({
      key: "chatbot_wa_number",
      value: values.waNumber,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-600" />
          Pengaturan WhatsApp
        </CardTitle>
        <CardDescription>
          Nomor tujuan untuk "Hubungi Admin" jika Chatbot tidak tahu jawabannya.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isFetching ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="waNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor WhatsApp Admin</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="Contoh: 6281234567890"
                          {...field}
                          disabled={!isEditing || updateMutation.isPending}
                        />
                      </FormControl>
                      {!isEditing ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                        >
                          Ubah
                        </Button>
                      ) : (
                        <Button type="submit" disabled={updateMutation.isPending}>
                          {updateMutation.isPending ? "Simpan..." : "Simpan"}
                        </Button>
                      )}
                    </div>
                    <FormDescription>
                      Gunakan format 62xxx tanpa spasi atau karakter plus (+).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
