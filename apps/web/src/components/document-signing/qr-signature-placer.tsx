import React, { useState, useRef, useCallback, useEffect } from "react";
import { QrCode, Trash2, Maximize2, Move, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SignaturePosition {
  stampId: string;
  userId: string;
  userName: string;
  purpose: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SignerInfo {
  userId: string;
  userName: string;
  purpose: string;
}

interface QRSignaturePlacerProps {
  /** Available signers to add */
  signers: SignerInfo[];
  /** Positions state controlled by parent */
  positions: SignaturePosition[];
  /** Callback when positions change */
  onChange: (positions: SignaturePosition[]) => void;
  /** PDF preview URL (blob or data url) */
  pdfPreviewUrl?: string;
  /** Total page count for document */
  maxPages?: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 1100;
const MIN_SIZE = 60;
const MAX_SIZE = 200;

export default function QRSignaturePlacer({
  signers,
  positions,
  onChange,
  pdfPreviewUrl,
  maxPages = 1,
}: QRSignaturePlacerProps) {
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);
  const [activeResizeIndex, setActiveResizeIndex] = useState<number | null>(
    null,
  );
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [resizeStart, setResizeStart] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  }>({
    x: 0,
    y: 0,
    w: 100,
    h: 100,
  });

  // Array of refs for each rendered page canvas
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Add a signer stamp to specified page (defaults to page 0)
  const handleAddSigner = (signer: SignerInfo, targetPage: number = 0) => {
    const stampId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `stamp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newPos: SignaturePosition = {
      stampId,
      ...signer,
      page: targetPage,
      x: 600,
      y: 900,
      width: 100,
      height: 100,
    };
    onChange([...positions, newPos]);
  };

  // Remove a signer position by stampId
  const handleRemoveSigner = (stampId: string) => {
    onChange(positions.filter((p) => p.stampId !== stampId));
  };

  // Start Drag
  const handleMouseDownDrag = (
    e: React.MouseEvent | React.TouchEvent,
    index: number,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const currentPos = positions[index];
    if (!currentPos) return;

    const targetRef = pageRefs.current[currentPos.page];
    if (!targetRef) return;

    setActiveDragIndex(index);

    const clientX = "touches" in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
    const clientY = "touches" in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;

    const canvasRect = targetRef.getBoundingClientRect();
    const scaleRatio = canvasRect.width / CANVAS_WIDTH;

    setDragOffset({
      x: (clientX - canvasRect.left) / scaleRatio - currentPos.x,
      y: (clientY - canvasRect.top) / scaleRatio - currentPos.y,
    });
  };

  // Start Resize
  const handleMouseDownResize = (
    e: React.MouseEvent | React.TouchEvent,
    index: number,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const currentPos = positions[index];
    if (!currentPos) return;

    const targetRef = pageRefs.current[currentPos.page];
    if (!targetRef) return;

    setActiveResizeIndex(index);

    const clientX = "touches" in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
    const clientY = "touches" in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;

    setResizeStart({
      x: clientX,
      y: clientY,
      w: currentPos.width,
      h: currentPos.height,
    });
  };

  // Global mouse/touch move
  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
      const clientY = "touches" in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;

      if (activeDragIndex !== null) {
        const currentPos = positions[activeDragIndex];
        if (!currentPos) return;

        const targetRef = pageRefs.current[currentPos.page];
        if (!targetRef) return;

        const canvasRect = targetRef.getBoundingClientRect();
        const scaleRatio = canvasRect.width / CANVAS_WIDTH;

        const newX = (clientX - canvasRect.left) / scaleRatio - dragOffset.x;
        const newY = (clientY - canvasRect.top) / scaleRatio - dragOffset.y;

        const updated = positions.map((p, idx) =>
          idx === activeDragIndex
            ? {
                ...p,
                x: Math.max(0, Math.min(newX, CANVAS_WIDTH - p.width)),
                y: Math.max(0, Math.min(newY, CANVAS_HEIGHT - p.height)),
              }
            : p,
        );
        onChange(updated);
      } else if (activeResizeIndex !== null) {
        const currentPos = positions[activeResizeIndex];
        if (!currentPos) return;

        const targetRef = pageRefs.current[currentPos.page];
        if (!targetRef) return;

        const canvasRect = targetRef.getBoundingClientRect();
        const scaleRatio = canvasRect.width / CANVAS_WIDTH;

        const deltaX = (clientX - resizeStart.x) / scaleRatio;
        const deltaY = (clientY - resizeStart.y) / scaleRatio;

        const newSize = Math.max(
          MIN_SIZE,
          Math.min(
            MAX_SIZE,
            Math.max(resizeStart.w + deltaX, resizeStart.h + deltaY),
          ),
        );

        const updated = positions.map((p, idx) =>
          idx === activeResizeIndex
            ? {
                ...p,
                width: Math.round(newSize),
                height: Math.round(newSize),
                x: Math.min(p.x, CANVAS_WIDTH - newSize),
                y: Math.min(p.y, CANVAS_HEIGHT - newSize),
              }
            : p,
        );
        onChange(updated);
      }
    },
    [
      activeDragIndex,
      activeResizeIndex,
      dragOffset,
      positions,
      resizeStart,
      onChange,
    ],
  );

  const handleMouseUp = useCallback(() => {
    setActiveDragIndex(null);
    setActiveResizeIndex(null);
  }, []);

  useEffect(() => {
    if (activeDragIndex !== null || activeResizeIndex !== null) {
      const handleMove = (e: Event) =>
        handleMouseMove(e as MouseEvent | TouchEvent);
      const handleEnd = () => handleMouseUp();

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleMove, { passive: false });
      window.addEventListener("touchend", handleEnd);

      return () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleEnd);
        window.removeEventListener("touchmove", handleMove);
        window.removeEventListener("touchend", handleEnd);
      };
    }
  }, [activeDragIndex, activeResizeIndex, handleMouseMove, handleMouseUp]);

  return (
    <div className="space-y-6">
      {/* Pages Vertical List */}
      <div className="flex flex-col items-center space-y-8">
        {Array.from({ length: maxPages }).map((_, pageIdx) => {
          const pageStamps = positions.filter((p) => p.page === pageIdx);
          return (
            <div
              key={pageIdx}
              id={`page-container-${pageIdx + 1}`}
              className="flex w-full flex-col items-center"
            >
              {/* Page Header Header */}
              <div className="mb-2 flex w-[800px] max-w-full items-center justify-between px-2">
                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 shadow-2xs">
                  📄 Halaman {pageIdx + 1} dari {maxPages}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">
                    {pageStamps.length > 0
                      ? `${pageStamps.length} Stamp Terpasang`
                      : "Belum ada stamp di halaman ini"}
                  </span>
                  {signers.length > 0 && (
                    <div className="flex items-center gap-1">
                      {signers.map((signer) => (
                        <Button
                          key={signer.userId}
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddSigner(signer, pageIdx)}
                          className="h-6 px-2 text-[11px] text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                        >
                          + Stamp di Hal. {pageIdx + 1}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Page Canvas Container */}
              <div className="flex w-full justify-center overflow-x-auto pb-2">
                <div
                  ref={(el) => {
                    pageRefs.current[pageIdx] = el;
                  }}
                  className="relative rounded-sm border border-slate-200 bg-white shadow-md transition-shadow hover:shadow-lg"
                  style={{
                    width: `${CANVAS_WIDTH}px`,
                    height: `${CANVAS_HEIGHT}px`,
                    minWidth: `${CANVAS_WIDTH}px`,
                    minHeight: `${CANVAS_HEIGHT}px`,
                  }}
                >
                  {/* PDF Background Preview */}
                  {pdfPreviewUrl ? (
                    <object
                      data={`${pdfPreviewUrl}#page=${pageIdx + 1}&toolbar=0&navpanes=0&scrollbar=0`}
                      type="application/pdf"
                      className="pointer-events-none h-full w-full border-0 select-none"
                    >
                      <iframe
                        src={`${pdfPreviewUrl}#page=${pageIdx + 1}&toolbar=0&navpanes=0&scrollbar=0`}
                        className="pointer-events-none h-full w-full border-0 select-none"
                        title={`PDF Preview Page ${pageIdx + 1}`}
                      />
                    </object>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span>Memuat Pratinjau Halaman {pageIdx + 1}...</span>
                    </div>
                  )}

                  {/* Draggable & Resizable QR Stamps for this page */}
                  {positions.map((pos, index) => {
                    if (pos.page !== pageIdx) return null;
                    const isDraggingThis = activeDragIndex === index;
                    const isResizingThis = activeResizeIndex === index;

                    return (
                      <div
                        key={pos.stampId || `${pos.userId}-${index}`}
                        className={`group absolute flex flex-col items-center justify-between rounded-md border-2 border-dashed bg-white/95 p-1.5 shadow-md transition-all select-none ${
                          isDraggingThis || isResizingThis
                            ? "border-blue-600 bg-blue-50/95 shadow-xl ring-2 ring-blue-400 ring-offset-1"
                            : "border-blue-500 hover:border-blue-700 hover:bg-blue-50/95"
                        }`}
                        style={{
                          left: `${pos.x}px`,
                          top: `${pos.y}px`,
                          width: `${pos.width}px`,
                          height: `${pos.height}px`,
                          pointerEvents: "auto",
                          touchAction: "none",
                          backdropFilter: "blur(2px)",
                        }}
                      >
                        {/* Drag handle header */}
                        <div
                          className="mb-0.5 flex w-full cursor-grab items-center justify-between border-b border-blue-100 pb-0.5 active:cursor-grabbing"
                          onMouseDown={(e) => handleMouseDownDrag(e, index)}
                          onTouchStart={(e) => handleMouseDownDrag(e, index)}
                        >
                          <Move className="h-3.5 w-3.5 text-blue-600" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSigner(pos.stampId);
                            }}
                            title="Hapus Stamp Ini"
                            className="rounded p-0.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* QR Icon */}
                        <QrCode className="h-1/2 w-1/2 text-slate-800" />

                        {/* Signer label */}
                        <div className="w-full truncate px-0.5 text-center text-[10px] leading-tight font-bold text-slate-900">
                          {pos.userName}
                        </div>

                        {/* Resize Handle at Bottom-Right */}
                        <div
                          className="absolute right-0 bottom-0 cursor-se-resize rounded-tl bg-blue-600 p-0.5 text-white hover:bg-blue-700 active:bg-blue-800"
                          onMouseDown={(e) => handleMouseDownResize(e, index)}
                          onTouchStart={(e) => handleMouseDownResize(e, index)}
                          title="Tarik untuk mengubah ukuran stamp"
                        >
                          <Maximize2 className="h-3 w-3 rotate-90" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
