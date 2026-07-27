import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp, Loader2, FileText } from "lucide-react";
// Kita gunakan window.pdfjsLib dari CDN yang di load di index.html
const getPdfjsLib = () => (window as any).pdfjsLib;

export function PdfUploadPanel({
  onSuccess,
}: {
  onSuccess: (data: { extractedText: string; pdfFileKey: string; pdfFileName: string }) => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation(trpc.platform.chatbot.uploadPdf.mutationOptions());

  const extractTextFromPdf = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async function () {
        try {
          const typedarray = new Uint8Array(this.result as ArrayBuffer);
          const pdfjsLib = getPdfjsLib();
          if (!pdfjsLib) throw new Error("PDF.js library not loaded");
          
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
          
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let fullText = "";

          for (let i = 1; i <= pdf.numPages; i++) {
            setProgress(`Membaca halaman ${i} dari ${pdf.numPages}...`);
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              // @ts-expect-error - pdfjs types
              .map((item) => item.str)
              .join(" ");
            fullText += pageText + "\n\n";
          }
          resolve(fullText);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Hanya file PDF yang diperbolehkan");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB");
      return;
    }

    setIsProcessing(true);
    setProgress("Mengekstrak teks dari PDF...");

    try {
      // 1. Ekstrak teks di client
      const extractedText = await extractTextFromPdf(file);
      
      if (!extractedText.trim()) {
        toast.error("Tidak dapat mengekstrak teks dari PDF ini. Pastikan PDF tidak berbentuk gambar (scanned).");
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setProgress("Mengunggah file ke server...");

      // 2. Upload file ke server via tRPC
      const formData = new FormData();
      formData.append("pdf", file);

      const uploadResult = await uploadMutation.mutateAsync(formData);

      toast.success("PDF berhasil diproses");
      
      // 3. Kirim data ke parent (form)
      onSuccess({
        extractedText,
        pdfFileKey: uploadResult.key,
        pdfFileName: uploadResult.name,
      });

    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat memproses PDF");
    } finally {
      setIsProcessing(false);
      setProgress("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="bg-blue-50/50 border-blue-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Import dari PDF
        </CardTitle>
        <CardDescription>
          Upload dokumen PDF (seperti SOP atau Panduan). Sistem akan otomatis membaca teksnya untuk dijadikan jawaban Chatbot.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
            disabled={isProcessing}
          />
          
          <Button 
            variant="outline" 
            className="w-full border-blue-200 hover:bg-blue-100/50"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-600" />
                <span>{progress || "Memproses..."}</span>
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4 text-blue-600" />
                Pilih File PDF (Maks 10MB)
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            Teks yang diekstrak akan otomatis dimasukkan ke form di atas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
