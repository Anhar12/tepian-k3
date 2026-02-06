import { useState, useRef, useCallback, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
  type DraggableProvided,
  type DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import { throttle } from "@tanstack/react-pacer";
import { authMeQueryOptions } from "@/utils/auth-query";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { toFormData } from "@/utils/form-data-mapper";
import { Loader2 } from "lucide-react";
import ImageWithFallback from "../image-with-fallback";

interface QRCodeElement {
  id: string;
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  userId: string;
  userName: string;
  purpose: string;
}

export default function PDFQRCodeEditor() {
  // Get current user
  const { data: currentUser } = useQuery(authMeQueryOptions());

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [scale, setScale] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 1100 });

  const [purpose, setPurpose] = useState("");

  const [qrElements, setQrElements] = useState<QRCodeElement[]>([]);
  const [selectedQRId, setSelectedQRId] = useState<string | null>(null);
  const [draggingQR, setDraggingQR] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update canvas size based on container width
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const maxWidth = Math.min(containerWidth - 32, 800); // 32px for padding
        const aspectRatio = 1100 / 800; // A4-like aspect ratio
        setCanvasSize({
          width: maxWidth,
          height: maxWidth * aspectRatio,
        });
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  // Handle PDF file upload
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setError(null);
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfPreviewUrl(url);
      setPageCount(1); // Simplified for demo
      setCurrentPage(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load PDF");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type === "application/pdf") {
        handleFileUpload(file);
      } else {
        setError("Please drop a valid PDF file");
      }
    },
    [handleFileUpload],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  // Generate QR code for signature
  const handleAddSignature = useCallback(() => {
    if (!currentUser) {
      setError("User not loaded");
      return;
    }
    if (!purpose.trim()) {
      setError("Please enter the purpose of signing");
      return;
    }

    try {
      setError(null);

      // Create QR code data with user and purpose info
      const qrData = JSON.stringify({
        userId: currentUser.id,
        userName: currentUser.name,
        email: currentUser.email,
        purpose: purpose.trim(),
        timestamp: new Date().toISOString(),
      });

      // Generate a placeholder QR code
      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 200, 200);
        ctx.fillStyle = "black";

        // Draw a simple QR-like pattern
        const cellSize = 10;
        for (let i = 0; i < 20; i++) {
          for (let j = 0; j < 20; j++) {
            if (Math.random() > 0.5) {
              ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
            }
          }
        }

        // Add user initials in center
        ctx.fillStyle = "white";
        ctx.fillRect(60, 70, 80, 60);
        ctx.fillStyle = "black";
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center";
        const initials = currentUser.name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase();
        ctx.fillText(initials, 100, 105);
      }

      const dataUrl = canvas.toDataURL();

      const newQRElement: QRCodeElement = {
        id: `qr-${Date.now()}`,
        dataUrl,
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        page: currentPage,
        userId: currentUser.id,
        userName: currentUser.name,
        purpose: purpose.trim(),
      };

      setQrElements((prev) => [...prev, newQRElement]);
      setSelectedQRId(newQRElement.id);

      // Reset form
      setPurpose("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add signature");
    }
  }, [currentUser, purpose, currentPage]);

  // Resize QR code with buttons
  const handleResizeQR = useCallback((id: string, increment: boolean) => {
    setQrElements((prev) =>
      prev.map((qr) => {
        if (qr.id !== id) return qr;
        const delta = increment ? 10 : -10;
        const newSize = Math.max(30, qr.width + delta);
        return { ...qr, width: newSize, height: newSize };
      }),
    );
  }, []);

  // QR Code dragging on canvas
  const handleQRMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();

      const qr = qrElements.find((q) => q.id === id);
      if (!qr || !canvasRef.current) return;

      setDraggingQR(id);
      setSelectedQRId(id);

      // Get client coordinates from mouse or touch event
      const clientX = "touches" in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
      const clientY = "touches" in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;

      // Calculate offset in the original coordinate system (800x1100)
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const scaleRatio = canvasSize.width / 800;

      setDragOffset({
        x: (clientX - canvasRect.left) / scaleRatio - qr.x,
        y: (clientY - canvasRect.top) / scaleRatio - qr.y,
      });
    },
    [qrElements, canvasSize.width],
  );

  const handleMouseMove = useCallback(
    throttle(
      (e: MouseEvent | TouchEvent) => {
        if (!draggingQR || !canvasRef.current) return;

        // Get client coordinates from mouse or touch event
        const clientX =
          "touches" in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
        const clientY =
          "touches" in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;

        const canvasRect = canvasRef.current.getBoundingClientRect();
        const scaleRatio = canvasSize.width / 800;

        // Calculate new position in the original 800x1100 coordinate system
        const newX = (clientX - canvasRect.left) / scaleRatio - dragOffset.x;
        const newY = (clientY - canvasRect.top) / scaleRatio - dragOffset.y;

        setQrElements((prev) =>
          prev.map((qr) =>
            qr.id === draggingQR
              ? {
                  ...qr,
                  x: Math.max(0, Math.min(newX, 800 - qr.width)),
                  y: Math.max(0, Math.min(newY, 1100 - qr.height)),
                }
              : qr,
          ),
        );
      },
      { wait: 16 },
    ), // ~60fps
    [draggingQR, dragOffset, canvasSize.width],
  );

  const handleMouseUp = useCallback(() => {
    setDraggingQR(null);
  }, []);

  // Attach global mouse and touch event listeners
  useEffect(() => {
    if (draggingQR) {
      const handleMove = (e: Event) =>
        handleMouseMove(e as MouseEvent | TouchEvent);
      const handleEnd = () => handleMouseUp();

      // Mouse events
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleEnd);

      // Touch events
      window.addEventListener("touchmove", handleMove, { passive: false });
      window.addEventListener("touchend", handleEnd);
      window.addEventListener("touchcancel", handleEnd);

      return () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleEnd);
        window.removeEventListener("touchmove", handleMove);
        window.removeEventListener("touchend", handleEnd);
        window.removeEventListener("touchcancel", handleEnd);
      };
    }
  }, [draggingQR, handleMouseMove, handleMouseUp]);

  const handleRemoveQRCode = useCallback(
    (id: string) => {
      setQrElements((prev) => prev.filter((qr) => qr.id !== id));
      if (selectedQRId === id) {
        setSelectedQRId(null);
      }
    },
    [selectedQRId],
  );

  // Reorder QR codes in list
  const handleReorderQRCodes = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      const items = Array.from(qrElements);
      const [reorderedItem] = items.splice(result.source.index, 1);
      if (reorderedItem) {
        items.splice(result.destination.index, 0, reorderedItem);
      }

      setQrElements(items);
    },
    [qrElements],
  );

  const signDocumentMutation = useMutation(
    trpc.document.signDocumentWithQRCodes.mutationOptions({
      onMutate: () => {
        setIsProcessing(true);
        setError(null);
      },
      onSuccess: (data) => {
        globalSuccessToast("Document signed successfully");

        window.open(data.url, "_blank");

        // Reset editor
        setPdfFile(null);
        setPdfPreviewUrl(null);
        setQrElements([]);
      },
      onError: (err) => {
        setError(err.message);
        globalErrorToast("Failed to sign document: " + err.message);
      },
      onSettled: () => {
        setIsProcessing(false);
      },
    }),
  );

  const handleSavePDF = useCallback(() => {
    if (!pdfFile) return;

    const data = {
      entityId: null,
      entityType: null,
      type: "qr_code_signing",
      file: pdfFile,
      qrCodes: qrElements.map((qr) => ({
        userId: qr.userId,
        userName: qr.userName,
        purpose: qr.purpose,
        position: {
          x: qr.x,
          y: qr.y,
          width: qr.width,
          height: qr.height,
          page: qr.page,
        },
      })),
    };

    const formData = toFormData(data);

    signDocumentMutation.mutate(formData);
  }, [pdfFile, qrElements, signDocumentMutation]);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">PDF QR Code Editor</h1>
          <button
            onClick={handleSavePDF}
            disabled={!pdfFile || qrElements.length === 0 || isProcessing}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isProcessing ? (
              <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
            ) : null}
            Save PDF
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 overflow-y-auto border-r bg-gray-50 p-4">
          <div className="space-y-4">
            {/* Upload Section */}
            <div>
              <h2 className="mb-2 font-semibold">1. Upload PDF</h2>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="cursor-pointer rounded border-2 border-dashed border-gray-300 p-6 text-center hover:border-blue-500"
                onClick={() => fileInputRef.current?.click()}
              >
                <p className="text-sm text-gray-600">
                  {pdfFile ? pdfFile.name : "Drop PDF here or click to upload"}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={(e) =>
                  e.target.files?.[0] && handleFileUpload(e.target.files[0])
                }
                className="hidden"
              />
            </div>

            {/* Select Which Document to Sign */}
            <div>
              <h2 className="mb-2 font-semibold">2. Document to Sign</h2>
              <div className="rounded border bg-white p-2">
                {pdfFile ? (
                  <div>
                    <div className="text-sm font-medium">{pdfFile.name}</div>
                    <div className="text-xs text-gray-500">
                      {pageCount} page{pageCount > 1 ? "s" : ""}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">
                    No document uploaded
                  </div>
                )}
              </div>
            </div>

            {/* Signature Assignment */}
            <div>
              <h2 className="mb-2 font-semibold">3. Add Signature</h2>
              <div className="space-y-3">
                {/* Current User Display */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Signing as
                  </label>
                  <div className="rounded border bg-gray-50 p-2">
                    {currentUser ? (
                      <div>
                        <div className="text-sm font-medium">
                          {currentUser.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {currentUser.email}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">
                        Loading user...
                      </div>
                    )}
                  </div>
                </div>

                {/* Purpose */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Purpose of Signing *
                  </label>
                  <textarea
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g., Approval of budget proposal, Contract agreement, etc."
                    className="w-full rounded border p-2 text-sm"
                    rows={3}
                  />
                </div>

                <button
                  onClick={handleAddSignature}
                  disabled={
                    !pdfFile || !currentUser || !purpose.trim() || isProcessing
                  }
                  className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Add Signature to PDF
                </button>
              </div>
            </div>

            {/* QR Code List */}
            {qrElements.length > 0 && (
              <div>
                <h2 className="mb-2 font-semibold">Added Signatures</h2>
                <p className="mb-2 text-xs text-gray-600">
                  Drag signatures on the PDF to reposition. Drag here to reorder
                  layers.
                </p>
                <DragDropContext onDragEnd={handleReorderQRCodes}>
                  <Droppable droppableId="qr-list">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {qrElements.map((qr, index) => (
                          <Draggable
                            key={qr.id}
                            draggableId={qr.id}
                            index={index}
                          >
                            {(
                              provided: DraggableProvided,
                              snapshot: DraggableStateSnapshot,
                            ) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`flex items-center justify-between rounded border bg-white p-2 ${
                                  snapshot.isDragging ? "shadow-lg" : ""
                                } ${selectedQRId === qr.id ? "ring-2 ring-blue-500" : ""}`}
                                onClick={() => setSelectedQRId(qr.id)}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="cursor-move text-gray-400">
                                    ⋮⋮
                                  </div>
                                  <ImageWithFallback
                                    src={qr.dataUrl}
                                    alt="QR Code"
                                    className="h-8 w-8"
                                  />
                                  <div className="flex-1">
                                    <span className="text-sm font-medium">
                                      {qr.userName}
                                    </span>
                                    <div className="text-xs text-gray-500">
                                      {qr.purpose.substring(0, 30)}
                                      {qr.purpose.length > 30 ? "..." : ""}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      Page {qr.page + 1} •{" "}
                                      {Math.round(qr.width)}px
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleResizeQR(qr.id, false);
                                    }}
                                    className="rounded bg-gray-200 px-2 py-1 text-xs hover:bg-gray-300"
                                    title="Decrease size"
                                  >
                                    −
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleResizeQR(qr.id, true);
                                    }}
                                    className="rounded bg-gray-200 px-2 py-1 text-xs hover:bg-gray-300"
                                    title="Increase size"
                                  >
                                    +
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveQRCode(qr.id);
                                    }}
                                    className="ml-1 text-red-600 hover:text-red-800"
                                    title="Remove"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            )}

            {/* Instructions */}
            {qrElements.length > 0 && (
              <div className="rounded bg-blue-50 p-3 text-xs text-blue-800">
                <p className="font-semibold">How to use:</p>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  <li>Enter signing purpose and add signature</li>
                  <li>Drag signatures on the PDF to position them</li>
                  <li>Use +/− buttons to resize (10px per click)</li>
                  <li>Drag signatures in the list to reorder layers</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {error && (
            <div className="mb-4 rounded bg-red-100 p-3 text-red-700">
              {error}
            </div>
          )}

          {!pdfFile ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500">Upload a PDF to get started</p>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl">
              {/* PDF Preview with QR Codes */}
              <div
                ref={canvasRef}
                className="relative mx-auto bg-white shadow-lg"
                style={{ width: "800px", height: "1100px" }}
              >
                {pdfPreviewUrl && (
                  <iframe
                    src={`${pdfPreviewUrl}#toolbar=0&navpanes=0`}
                    className="pointer-events-none h-full w-full border"
                  />
                )}

                {/* QR Code Overlays - Draggable */}
                {qrElements
                  .filter((qr) => qr.page === currentPage)
                  .map((qr) => (
                    <div
                      key={qr.id}
                      className={`absolute border-2 transition-all select-none ${
                        selectedQRId === qr.id
                          ? "border-blue-500 shadow-lg ring-2 ring-blue-300"
                          : "border-transparent hover:border-blue-300"
                      } ${draggingQR === qr.id ? "cursor-grabbing opacity-75" : "cursor-grab"}`}
                      style={{
                        left: `${qr.x}px`,
                        top: `${qr.y}px`,
                        width: `${qr.width}px`,
                        height: `${qr.height}px`,
                        pointerEvents: "auto",
                        touchAction: "none",
                      }}
                      onMouseDown={(e) => handleQRMouseDown(e, qr.id)}
                      onTouchStart={(e) => handleQRMouseDown(e, qr.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQRId(qr.id);
                      }}
                    >
                      <ImageWithFallback
                        src={qr.dataUrl}
                        alt="QR Code"
                        className="pointer-events-none h-full w-full select-none"
                        draggable={false}
                      />
                    </div>
                  ))}
              </div>

              {/* Zoom Controls */}
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
                  className="rounded bg-white px-4 py-2 shadow hover:bg-gray-100"
                >
                  −
                </button>
                <span className="flex items-center px-4 text-sm font-medium">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={() => setScale((s) => Math.min(2, s + 0.1))}
                  className="rounded bg-white px-4 py-2 shadow hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
