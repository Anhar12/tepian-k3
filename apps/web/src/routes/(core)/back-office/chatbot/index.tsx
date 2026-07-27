import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/utils/page-head";
import { trpc } from "@/utils/trpc";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { KnowledgeForm } from "./-components/knowledge-form";
import { KnowledgeTable } from "./-components/knowledge-table";
import { PdfUploadPanel } from "./-components/pdf-upload-panel";
import { WaSettingsPanel } from "./-components/wa-settings-panel";
import { ChatbotPreviewPanel } from "./-components/chatbot-preview-panel";

export const Route = createFileRoute("/(core)/back-office/chatbot/")({
  component: ChatbotManagementPage,
  head: () => pageHead("Manajemen Chatbot Asty"),
});

export type EditState = {
  id: string;
  topic: string;
  keywords: string[];
  answer: string;
  sourceType: "manual" | "pdf";
  pdfFileKey?: string | null;
  pdfFileName?: string | null;
} | null;

function ChatbotManagementPage() {
  const [editState, setEditState] = useState<EditState>(null);
  
  const queryClient = useQueryClient();

  const refreshData = () => {
    queryClient.invalidateQueries({
      predicate: (query) => query.queryKey.includes("chatbot"),
    });
  };

  const handleEdit = (data: NonNullable<EditState>) => {
    setEditState(data);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditState(null);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Chatbot Asty</h1>
        <p className="text-muted-foreground">
          Kelola basis pengetahuan (knowledge base) dan pengaturan asisten virtual Asty.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kolom Kiri: Form & Pengaturan */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <KnowledgeForm
            editState={editState}
            onCancelEdit={handleCancelEdit}
            onSuccess={refreshData}
          />
          <PdfUploadPanel onSuccess={(data) => {
             // Populate form with pdf info
             setEditState({
               id: "", // empty means create new
               topic: data.pdfFileName?.replace(".pdf", "") || "",
               keywords: [],
               answer: data.extractedText || "",
               sourceType: "pdf",
               pdfFileKey: data.pdfFileKey,
               pdfFileName: data.pdfFileName,
             });
             window.scrollTo({ top: 0, behavior: "smooth" });
          }} />
          <WaSettingsPanel />
        </div>

        {/* Kolom Kanan: Tabel Data */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <KnowledgeTable onEdit={handleEdit} onSuccess={refreshData} />
          <ChatbotPreviewPanel />
        </div>
      </div>
    </div>
  );
}
