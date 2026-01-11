/**
 * PDF Editor Route
 *
 * TanStack Router route for PDF QR Code Editor
 */

import { createFileRoute } from "@tanstack/react-router";
import PDFQRCodeEditor from "@/components/pdf/pdf-qrcode-editor";

export const Route = createFileRoute("/(core)/pdf-editor")({
  component: PDFEditorPage,
});

function PDFEditorPage() {
  return (
    <div className="h-screen">
      <PDFQRCodeEditor />
    </div>
  );
}
