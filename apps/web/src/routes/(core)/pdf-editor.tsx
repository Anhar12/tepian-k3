/**
 * PDF Editor Route
 *
 * TanStack Router route for PDF QR Code Editor
 * Uses React.lazy for code splitting to reduce initial bundle size
 */

import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const PDFQRCodeEditor = lazy(() => import("@/components/pdf/pdf-qrcode-editor"));

export const Route = createFileRoute("/(core)/pdf-editor")({
  component: PDFEditorPage,
});

function PDFEditorPage() {
  return (
    <div className="h-screen">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <PDFQRCodeEditor />
      </Suspense>
    </div>
  );
}
