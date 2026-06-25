import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  aspectRatio: number;
  targetWidth: number;
  targetHeight: number;
  onCropComplete: (file: File) => void;
}

export function ImageCropperModal({
  isOpen,
  onClose,
  imageUrl,
  aspectRatio,
  targetWidth,
  targetHeight,
  onCropComplete,
}: ImageCropperModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageUrl]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImageSize({ width: naturalWidth, height: naturalHeight });

    // Set initial scale to cover the container
    if (containerRef.current) {
      const containerAspect = aspectRatio;
      const imageAspect = naturalWidth / naturalHeight;
      let minScale = 1;
      if (imageAspect > containerAspect) {
        // Image is wider than container
        minScale = containerRef.current.clientHeight / naturalHeight;
      } else {
        // Image is taller than container
        minScale = containerRef.current.clientWidth / naturalWidth;
      }
      setScale(minScale);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current || !imageRef.current) return;

    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;

    // Bounds calculation
    const container = containerRef.current.getBoundingClientRect();
    const scaledWidth = imageSize.width * scale;
    const scaledHeight = imageSize.height * scale;

    // Max movement is half the difference between scaled image and container
    const maxX = Math.max(0, (scaledWidth - container.width) / 2);
    const maxY = Math.max(0, (scaledHeight - container.height) / 2);

    newX = Math.min(Math.max(newX, -maxX), maxX);
    newY = Math.min(Math.max(newY, -maxY), maxY);

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newScale = Math.max(0.1, Math.min(scale + delta, 5));
    setScale(newScale);

    // Check bounds after zoom
    if (containerRef.current && imageRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      const scaledWidth = imageSize.width * newScale;
      const scaledHeight = imageSize.height * newScale;

      const maxX = Math.max(0, (scaledWidth - container.width) / 2);
      const maxY = Math.max(0, (scaledHeight - container.height) / 2);

      setPosition((prev) => ({
        x: Math.min(Math.max(prev.x, -maxX), maxX),
        y: Math.min(Math.max(prev.y, -maxY), maxY),
      }));
    }
  };

  const handleCrop = async () => {
    if (!imageRef.current || !containerRef.current) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set exact target dimensions
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const containerRect = containerRef.current.getBoundingClientRect();
    const imageRect = imageRef.current.getBoundingClientRect();

    // Calculate source rect from natural image
    const ratioX = imageSize.width / imageRect.width;
    const ratioY = imageSize.height / imageRect.height;

    const sourceX = (containerRect.left - imageRect.left) * ratioX;
    const sourceY = (containerRect.top - imageRect.top) * ratioY;
    const sourceWidth = containerRect.width * ratioX;
    const sourceHeight = containerRect.height * ratioY;

    // Draw the cropped portion to canvas
    ctx.drawImage(
      imageRef.current,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      targetWidth,
      targetHeight,
    );

    // Convert to File (WebP for better optimization)
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "cropped_image.webp", {
          type: "image/webp",
          lastModified: Date.now(),
        });
        onCropComplete(file);
      },
      "image/webp",
      0.9, // high quality
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Sesuaikan Gambar</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-4">
          <p className="text-sm text-slate-500">
            Geser dan perbesar gambar untuk menyesuaikan bingkai area. Gambar
            akan disimpan dalam ukuran{" "}
            <b>
              {targetWidth}x{targetHeight}
            </b>{" "}
            px.
          </p>

          {/* Cropper Container */}
          <div
            className="relative w-full max-w-[500px] cursor-move touch-none overflow-hidden rounded-lg bg-slate-100 shadow-inner"
            style={{ aspectRatio }}
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onWheel={handleWheel}
          >
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {/* eslint-disable-next-line tepian/no-img-element */}
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Source"
                onLoad={handleImageLoad}
                className="pointer-events-none max-w-none origin-center select-none"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  willChange: "transform",
                }}
                draggable={false}
              />
            </div>
            {/* Overlay Guides */}
            <div className="pointer-events-none absolute inset-0 z-10 border-2 border-blue-500" />
            <div className="pointer-events-none absolute inset-0 z-10 grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-white/30" />
              <div className="border-r border-b border-white/30" />
              <div className="border-b border-white/30" />
              <div className="border-r border-b border-white/30" />
              <div className="border-r border-b border-white/30" />
              <div className="border-b border-white/30" />
              <div className="border-r border-white/30" />
              <div className="border-r border-white/30" />
              <div />
            </div>
          </div>

          <div className="flex w-full max-w-[400px] items-center gap-4">
            <span className="text-sm font-medium text-slate-500">Zoom</span>
            <Slider
              min={0.1}
              max={5}
              step={0.01}
              value={[scale]}
              onValueChange={([val]) => {
                if (val !== undefined) setScale(val);
              }}
              className="flex-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleCrop}>Gunakan Gambar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
