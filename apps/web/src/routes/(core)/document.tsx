import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Download,
  QrCode,
  Shield,
  Clock,
} from "lucide-react";
import { useEffect, useState } from "react";
import type {
  DocumentWithRelations,
  VerificationResult,
} from "@tepian-k3/types/document.types";
import type { DocumentStatus } from "@tepian-k3/constants";

export const Route = createFileRoute("/(core)/document")({
  component: RouteComponent,
});

// Mock data - replace with actual tRPC hooks
const mockDocument = {
  id: "123",
  documentNumber: "INV-2024-001",
  type: "invoice",
  title: "Invoice for Order ORD-2024-001",
  fileName: "invoice.pdf",
  fileUrl: "/documents/invoice.pdf",
  status: "signed",
  qrCodeUrl: "/qr-codes/qr-123.png",
  verificationUrl: "https://app.tepian-k3.com/verify/abc123",
  signedAt: "2024-01-15T10:30:00Z",
  signedBy: {
    id: "u456",
    name: "John Doe",
    email: "john@example.com",
  },
  verifications: [
    {
      id: "1",
      deletedAt: null,
      createdAt: "2024-01-16T12:00:00Z",
      updatedAt: "2024-01-16T12:00:00Z",
      documentId: "123",
      verifiedByUserId: "u789",
      verifiedByIp: "192.168.1.1",
      verifiedByUserAgent: "Mozilla/5.0",
      verificationLocation: "New York, USA",
      isValid: true,
      verificationMethod: "qr_scan",
      verificationNotes: "Verified via QR code scan",
      verifiedBy: {
        id: "u789",
        name: "Jane Smith",
      },
    },
  ],
  description: "Invoice document for order ORD-2024-001",
  entityType: "order",
  entityId: "",
  fileSize: null,
  mimeType: null,
  signatureData: null,
  verificationToken: null,
  deletedAt: null,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: null,
  uploadedByUserId: "",
  signedByUserId: null,
  verifiedAt: null,
  expiresAt: null,
} satisfies DocumentWithRelations;

function DocumentCard({
  document = mockDocument,
}: {
  document: DocumentWithRelations;
}) {
  const [showQR, setShowQR] = useState(false);
  const [showVerificationHistory, setShowVerificationHistory] = useState(false);

  const statusColor: Record<DocumentStatus, string> = {
    draft: "bg-gray-500",
    pending_signature: "bg-yellow-500",
    signed: "bg-green-500",
    verified: "bg-blue-500",
    rejected: "bg-red-500",
  };

  const statusIcon: Record<DocumentStatus, React.ComponentType<any>> = {
    draft: FileText,
    pending_signature: Clock,
    signed: Shield,
    verified: CheckCircle2,
    rejected: XCircle,
  };

  const StatusIcon = statusIcon[document.status] || FileText;

  return (
    <>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {document.title}
              </CardTitle>
              <CardDescription>
                Document #{document.documentNumber}
              </CardDescription>
            </div>
            <Badge className={statusColor[document.status]}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {document.status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Document Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">File Name</p>
              <p className="font-medium">{document.fileName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium capitalize">
                {document.type.replace("_", " ")}
              </p>
            </div>
            {document.signedAt && (
              <>
                <div>
                  <p className="text-muted-foreground">Signed At</p>
                  <p className="font-medium">
                    {new Date(document.signedAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Signed By</p>
                  <p className="font-medium">{document.signedBy?.name}</p>
                </div>
              </>
            )}
          </div>

          {/* Signed Document Alert */}
          {document.status === "signed" && (
            <Alert className="border-green-500 bg-green-50">
              <Shield className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                This document has been digitally signed and can be verified
                using the QR code.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="default" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>

            {document.status === "signed" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQR(true)}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Show QR Code
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVerificationHistory(true)}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Verifications ({document.verifications?.length || 0})
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Document Verification QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to verify the authenticity of this document
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-center rounded-lg border bg-white p-8">
              {/* In real implementation, use actual QR code image */}
              <div className="flex h-64 w-64 items-center justify-center rounded bg-gray-200">
                <QrCode className="h-32 w-32 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p className="font-medium">Verification URL:</p>
              <code className="block rounded bg-gray-100 p-2 text-xs break-all">
                {document.verificationUrl}
              </code>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                This QR code contains a cryptographically signed verification
                link. Anyone can scan it to verify this document's authenticity.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification History Dialog */}
      <Dialog
        open={showVerificationHistory}
        onOpenChange={setShowVerificationHistory}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Verification History</DialogTitle>
            <DialogDescription>
              All attempts to verify this document
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 space-y-2 overflow-y-auto">
            {document.verifications?.map((verification) => (
              <Card key={verification.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {verification.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium">
                          {verification.isValid ? "Valid" : "Invalid"}{" "}
                          Verification
                        </span>
                      </div>

                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          Verified by:{" "}
                          {verification.verifiedBy?.name || "Anonymous"}
                        </p>
                        <p>
                          Date:{" "}
                          {new Date(verification.createdAt).toLocaleString()}
                        </p>
                        <p>Method: {verification.verificationMethod}</p>
                        <p>IP: {verification.verifiedByIp}</p>
                      </div>
                    </div>

                    <Badge
                      variant={verification.isValid ? "default" : "destructive"}
                    >
                      {verification.verificationMethod}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DocumentVerificationPage() {
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult>();

  // Mock verification - replace with actual tRPC call
  const handleVerify = () => {
    setVerifying(true);
    setTimeout(() => {
      setResult({
        isValid: true,
        document: mockDocument,
        reason: "Document verified successfully",
      });
      setVerifying(false);
    }, 1500);
  };

  useEffect(() => {
    // Auto-verify on page load (get token from URL)
    handleVerify();
  }, []);

  if (verifying) {
    return (
      <div className="flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <Shield className="mx-auto h-12 w-12 animate-pulse text-blue-600" />
              <h2 className="text-xl font-semibold">Verifying Document...</h2>
              <p className="text-muted-foreground">
                Please wait while we verify the authenticity of this document
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="min-h-screen px-4">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Verification Result */}
        <Alert
          className={
            result.isValid
              ? "border-green-500 bg-green-50"
              : "border-red-500 bg-red-50"
          }
        >
          {result.isValid ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <AlertDescription
            className={result.isValid ? "text-green-800" : "text-red-800"}
          >
            {/* <p className="text-lg font-semibold">{result.message}</p> */}
            {result.isValid && (
              <p className="mt-1">
                This document has been cryptographically verified and is
                authentic.
              </p>
            )}
          </AlertDescription>
        </Alert>

        {/* Document Details */}
        {result.isValid && result.document && (
          <DocumentCard document={result.document} />
        )}

        {/* Security Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How Verification Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>✓ Each document is digitally signed using JWT cryptography</p>
            <p>✓ The signature includes a SHA-256 hash of the file content</p>
            <p>✓ Any modification to the document invalidates the signature</p>
            <p>✓ All verification attempts are logged for audit purposes</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RouteComponent() {
  const [view, setView] = useState<"card" | "verify">("card"); // 'card' or 'verify'

  return (
    <div className="min-h-screenbg-gray-50 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="mb-6 flex gap-2">
          <Button
            variant={view === "card" ? "default" : "outline"}
            onClick={() => setView("card")}
          >
            Document Card
          </Button>
          <Button
            variant={view === "verify" ? "default" : "outline"}
            onClick={() => setView("verify")}
          >
            Verification Page
          </Button>
        </div>

        {view === "card" ? (
          <DocumentCard document={mockDocument} />
        ) : (
          <DocumentVerificationPage />
        )}
      </div>
    </div>
  );
}
