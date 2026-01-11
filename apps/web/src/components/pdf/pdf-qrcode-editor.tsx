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

interface User {
  id: string;
  name: string;
  email: string;
}

// Mock users data - replace with your actual user data source
const MOCK_USERS: User[] = [
  { id: "1", name: "John Doe", email: "john.doe@company.com" },
  { id: "2", name: "Jane Smith", email: "jane.smith@company.com" },
  { id: "3", name: "Mike Johnson", email: "mike.johnson@company.com" },
  { id: "4", name: "Sarah Williams", email: "sarah.williams@company.com" },
  { id: "5", name: "David Brown", email: "david.brown@company.com" },
];

export default function PDFQRCodeEditor() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [scale, setScale] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 1100 });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [purpose, setPurpose] = useState("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const [qrElements, setQrElements] = useState<QRCodeElement[]>([]);
  const [selectedQRId, setSelectedQRId] = useState<string | null>(null);
  const [draggingQR, setDraggingQR] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter users based on search query
  const filteredUsers = MOCK_USERS.filter(
    (user) =>
      user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchQuery.toLowerCase()),
  );

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate QR code for signature
  const handleAddSignature = useCallback(() => {
    if (!selectedUser) {
      setError("Please select a user");
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
        userId: selectedUser.id,
        userName: selectedUser.name,
        email: selectedUser.email,
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
        const initials = selectedUser.name
          .split(" ")
          .map((n) => n[0])
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
        userId: selectedUser.id,
        userName: selectedUser.name,
        purpose: purpose.trim(),
      };

      setQrElements((prev) => [...prev, newQRElement]);
      setSelectedQRId(newQRElement.id);

      // Reset form
      setPurpose("");
      setSelectedUser(null);
      setUserSearchQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add signature");
    }
  }, [selectedUser, purpose, currentPage]);

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
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

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
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

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
      items.splice(result.destination.index, 0, reorderedItem);

      setQrElements(items);
    },
    [qrElements],
  );

  const handleSavePDF = useCallback(() => {
    alert("PDF would be saved with QR codes at the current positions");
  }, []);

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
            disabled={!pdfFile || qrElements.length === 0}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
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

            {/* Signature Assignment */}
            <div>
              <h2 className="mb-2 font-semibold">2. Add Signature</h2>
              <div className="space-y-3">
                {/* User Selector */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Select User *
                  </label>
                  <div ref={dropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className="flex w-full items-center justify-between rounded border bg-white p-2 text-left text-sm hover:border-blue-500"
                    >
                      {selectedUser ? (
                        <div>
                          <div className="font-medium">{selectedUser.name}</div>
                          <div className="text-xs text-gray-500">
                            {selectedUser.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Choose a user...</span>
                      )}
                      <svg
                        className={`h-4 w-4 transition-transform ${isUserDropdownOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {isUserDropdownOpen && (
                      <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border bg-white shadow-lg">
                        <div className="sticky top-0 bg-white p-2">
                          <input
                            type="text"
                            placeholder="Search users..."
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            className="w-full rounded border px-2 py-1 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredUsers.length === 0 ? (
                            <div className="p-3 text-center text-sm text-gray-500">
                              No users found
                            </div>
                          ) : (
                            filteredUsers.map((user) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsUserDropdownOpen(false);
                                  setUserSearchQuery("");
                                }}
                                className="w-full p-2 text-left hover:bg-blue-50"
                              >
                                <div className="text-sm font-medium">
                                  {user.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {user.email}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
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
                    !pdfFile || !selectedUser || !purpose.trim() || isProcessing
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
                                  <img
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
                  <li>Select user and enter signing purpose</li>
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
                      <img
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
