import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { EditState } from "../index";

const formSchema = z.object({
  id: z.string().optional(),
  topic: z.string().min(3, "Topik minimal 3 karakter"),
  keywordsInput: z.string().optional(),
  keywords: z.array(z.string()).min(1, "Minimal 1 kata kunci"),
  answer: z.string().min(10, "Jawaban minimal 10 karakter"),
  sourceType: z.enum(["manual", "pdf"]).default("manual"),
  pdfFileKey: z.string().optional().nullable(),
  pdfFileName: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export function KnowledgeForm({
  editState,
  onCancelEdit,
  onSuccess,
}: {
  editState: EditState;
  onCancelEdit: () => void;
  onSuccess: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      topic: "",
      keywordsInput: "",
      keywords: [],
      answer: "",
      sourceType: "manual",
      pdfFileKey: null,
      pdfFileName: null,
    },
  });

  // Populate form when editState changes
  useEffect(() => {
    if (editState) {
      form.reset({
        id: editState.id,
        topic: editState.topic,
        keywordsInput: "", // Clear input field
        keywords: editState.keywords,
        answer: editState.answer,
        sourceType: editState.sourceType,
        pdfFileKey: editState.pdfFileKey,
        pdfFileName: editState.pdfFileName,
      });
    } else {
      form.reset({
        id: undefined,
        topic: "",
        keywordsInput: "",
        keywords: [],
        answer: "",
        sourceType: "manual",
        pdfFileKey: null,
        pdfFileName: null,
      });
    }
  }, [editState, form]);

  const createMutation = useMutation({
    ...trpc.platform.chatbot.create.mutationOptions(),
    onSuccess: () => {
      toast.success("Berhasil menambahkan knowledge base");
      form.reset();
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(`Gagal menyimpan: ${err.message}`);
    },
  });

  const updateMutation = useMutation({
    ...trpc.platform.chatbot.update.mutationOptions(),
    onSuccess: () => {
      toast.success("Berhasil mengupdate knowledge base");
      form.reset();
      onCancelEdit();
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(`Gagal update: ${err.message}`);
    },
  });

  const onSubmit = (values: FormValues) => {
    // If id exists and is not empty string, it's an update
    if (values.id && values.id !== "") {
      updateMutation.mutate({
        id: values.id,
        topic: values.topic,
        keywords: values.keywords,
        answer: values.answer,
        sourceType: values.sourceType,
        pdfFileKey: values.pdfFileKey,
        pdfFileName: values.pdfFileName,
      });
    } else {
      createMutation.mutate({
        topic: values.topic,
        keywords: values.keywords,
        answer: values.answer,
        sourceType: values.sourceType,
        pdfFileKey: values.pdfFileKey,
        pdfFileName: values.pdfFileName,
      });
    }
  };

  const addKeyword = () => {
    const inputValue = form.getValues("keywordsInput");
    if (!inputValue) return;

    const newKeywords = inputValue
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const currentKeywords = form.getValues("keywords");
    const merged = Array.from(new Set([...currentKeywords, ...newKeywords]));

    form.setValue("keywords", merged, { shouldValidate: true });
    form.setValue("keywordsInput", "");
  };

  const removeKeyword = (keywordToRemove: string) => {
    const current = form.getValues("keywords");
    form.setValue(
      "keywords",
      current.filter((k) => k !== keywordToRemove),
      { shouldValidate: true }
    );
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isEditMode = !!editState && !!editState.id;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? "Edit Pengetahuan" : "Tambah Pengetahuan"}</CardTitle>
        <CardDescription>
          {isEditMode
            ? "Ubah data knowledge base yang sudah ada."
            : "Tambahkan informasi baru untuk Chatbot Asty."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topik / Judul</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Prosedur Pengujian" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="keywordsInput"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kata Kunci (Keywords)</FormLabel>
                  <FormDescription>
                    Pisahkan dengan koma dan tekan Enter atau tombol Tambah.
                  </FormDescription>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="prosedur, uji, cara..."
                        {...field}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addKeyword();
                          }
                        }}
                      />
                    </FormControl>
                    <Button type="button" variant="secondary" onClick={addKeyword}>
                      Tambah
                    </Button>
                  </div>
                  <FormMessage />
                  
                  {/* Display badges */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.watch("keywords").map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(keyword)}
                          className="hover:text-destructive rounded-full"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  {form.formState.errors.keywords && (
                    <p className="text-[0.8rem] font-medium text-destructive">
                      {form.formState.errors.keywords.message}
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jawaban / Penjelasan</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Masukkan jawaban yang akan diberikan oleh chatbot..." 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  {form.watch("sourceType") === "pdf" && (
                    <FormDescription className="text-amber-600">
                      Teks ini diekstrak dari PDF: {form.watch("pdfFileName")}. Anda dapat mengeditnya agar lebih mudah dibaca oleh pengguna.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Menyimpan..." : isEditMode ? "Update" : "Simpan"}
              </Button>
              {editState && (
                <Button type="button" variant="outline" onClick={onCancelEdit} disabled={isLoading}>
                  Batal
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
