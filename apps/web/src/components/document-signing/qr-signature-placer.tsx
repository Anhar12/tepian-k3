import React, { useState, useRef, useCallback, useEffect } from "react";
import { QrCode, Trash2, Maximize2, Move, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export interface SignaturePosition {
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
  /** Total page count for page selector */
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
  maxPages = 5,
}: QRSignaturePlacerProps) {
  const [selectedPage, setSelectedPage] = useState<number>(0);
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

  const canvasRef = useRef<HTMLDivElement>(null);

  // Add a signer if not already present
  const handleAddSigner = (signer: SignerInfo) => {
    if (positions.some((p) => p.userId === signer.userId)) return;
    const newPos: SignaturePosition = {
      ...signer,
      page: selectedPage,
      x: 600,
      y: 900,
      width: 100,
      height: 100,
    };
    onChange([...positions, newPos]);
  };

  // Remove a signer position
  const handleRemoveSigner = (userId: string) => {
    onChange(positions.filter((p) => p.userId !== userId));
  };

  // Start Drag
  const handleMouseDownDrag = (
    e: React.MouseEvent | React.TouchEvent,
    index: number,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!canvasRef.current) return;
    setActiveDragIndex(index);

    const clientX = "touches" in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
    const clientY = "touches" in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const scaleRatio = canvasRect.width / CANVAS_WIDTH;

    const currentPos = positions[index];
    if (!currentPos) return;

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

    if (!canvasRef.current) return;
    setActiveResizeIndex(index);

    const clientX = "touches" in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
    const clientY = "touches" in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;

    const currentPos = positions[index];
    if (!currentPos) return;

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
      if (!canvasRef.current) return;

      const clientX = "touches" in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
      const clientY = "touches" in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const scaleRatio = canvasRect.width / CANVAS_WIDTH;

      if (activeDragIndex !== null) {
        const currentPos = positions[activeDragIndex];
        if (!currentPos) return;

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
    <div className="space-y-4">
      {/* Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-semibold">Pilih Halaman:</Label>
          <Select
            value={selectedPage.toString()}
            onValueChange={(val) => setSelectedPage(parseInt(val, 10))}
          >
            <SelectTrigger className="h-8 w-32 bg-background text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: maxPages }).map((_, i) => (
                <SelectItem key={i} value={i.toString()} className="text-xs">
                  Halaman {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Signers selection */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Tambah Penandatangan:
          </span>
          {signers.map((signer) => {
            const isAdded = positions.some((p) => p.userId === signer.userId);
            return (
              <Button
                key={signer.userId}
                type="button"
                variant={isAdded ? "secondary" : "outline"}
                size="sm"
                disabled={isAdded}
                onClick={() => handleAddSigner(signer)}
                className="h-7 text-xs"
              >
                + {signer.userName} ({signer.purpose})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Helper notice */}
      <p className="text-xs text-muted-foreground">
        Geser (drag) stamp QR di bawah ke posisi yang diinginkan. Gunakan handle
        di pojok kanan bawah stamp untuk meresize ukuran QR.
      </p>

      {/* Canvas container */}
      <div className="flex justify-center overflow-x-auto rounded-md border bg-muted/20 p-2">
        <div
          ref={canvasRef}
          className="relative bg-white shadow-md transition-shadow hover:shadow-lg"
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
              data={`${pdfPreviewUrl}#page=${selectedPage + 1}&toolbar=0&navpanes=0&scrollbar=0`}
              type="application/pdf"
              className="pointer-events-none h-full w-full border-0 select-none"
            >
              <iframe
                src={`${pdfPreviewUrl}#page=${selectedPage + 1}&toolbar=0&navpanes=0&scrollbar=0`}
                className="pointer-events-none h-full w-full border-0 select-none"
                title="PDF Preview Page"
              />
            </object>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Memuat Pratinjau Dokumen...</span>
            </div>
          )}

          {/* Srikandi Standard Target Recommendation Box */}
          <div
            className="pointer-events-none absolute flex flex-col items-center justify-center rounded-md border-2 border-dashed border-emerald-400 bg-emerald-500/10 text-emerald-700/60"
            style={{
              left: "600px",
              top: "900px",
              width: "120px",
              height: "120px",
            }}
          >
            <span className="text-center text-[10px] leading-tight font-semibold">
              Rekomendasi Posisi
              <br />
              (Srikandi)
            </span>
          </div>

          {/* Draggable & Resizable QR Stamps */}
          {positions.map((pos, index) => {
            if (pos.page !== selectedPage) return null;
            const isDraggingThis = activeDragIndex === index;
            const isResizingThis = activeResizeIndex === index;

            return (
              <div
                key={pos.userId}
                className={`group absolute flex flex-col items-center justify-between rounded-md border-2 border-dashed bg-white/80 p-1 shadow-xs transition-colors select-none ${
                  isDraggingThis || isResizingThis
                    ? "border-primary bg-primary/10 shadow-lg"
                    : "border-blue-500 hover:border-blue-700 hover:bg-blue-50/90"
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
                  className="flex w-full cursor-grab items-center justify-between active:cursor-grabbing"
                  onMouseDown={(e) => handleMouseDownDrag(e, index)}
                  onTouchStart={(e) => handleMouseDownDrag(e, index)}
                >
                  <Move className="h-3 w-3 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSigner(pos.userId);
                    }}
                    className="hover:text-destructive-foreground rounded p-0.5 text-muted-foreground hover:bg-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                {/* QR Icon */}
                <QrCode className="h-1/2 w-1/2 text-gray-800" />

                {/* Signer label */}
                <div className="w-full truncate text-center text-[9px] leading-none font-semibold text-gray-900">
                  {pos.userName}
                </div>

                {/* Resize Handle at Bottom-Right */}
                <div
                  className="absolute right-0 bottom-0 cursor-se-resize rounded-tl bg-blue-500 p-0.5 text-white hover:bg-blue-700 active:bg-blue-800"
                  onMouseDown={(e) => handleMouseDownResize(e, index)}
                  onTouchStart={(e) => handleMouseDownResize(e, index)}
                >
                  <Maximize2 className="h-2.5 w-2.5 rotate-90" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
