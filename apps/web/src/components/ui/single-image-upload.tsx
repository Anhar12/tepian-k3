"use client";

import { useCallback, useState, forwardRef, useEffect } from "react";
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@/components/ui/reui-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CircleX, CloudUpload, Image, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageFile {
  file: File;
  preview: string;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

interface SingleImageUploadProps {
  maxSize?: number;
  accept?: string;
  className?: string;
  value?: File | string | null;
  onChange?: (file: File | null) => void;
  onBlur?: () => void;
  name?: string;
  disabled?: boolean;
  error?: string;
}

const SingleImageUpload = forwardRef<HTMLDivElement, SingleImageUploadProps>(
  (
    {
      maxSize = 2 * 1024 * 1024, // 2MB
      accept = "image/*",
      className,
      value,
      onChange,
      onBlur,
      name,
      disabled = false,
      error,
    },
    ref,
  ) => {
    const [image, setImage] = useState<ImageFile | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Handle external value changes (e.g., from form reset)
    useEffect(() => {
      if (value === null || value === undefined) {
        // Clear the image
        if (image) {
          URL.revokeObjectURL(image.preview);
        }
        setImage(null);
        setPreview(null);
      } else if (typeof value === "string") {
        // URL string provided
        setPreview(value);
        setImage(null);
      } else if (value instanceof File) {
        // File object provided
        if (!image || image.file !== value) {
          const newPreview = URL.createObjectURL(value);
          setImage({
            file: value,
            preview: newPreview,
            progress: 100,
            status: "completed",
          });
          setPreview(newPreview);
        }
      }
    }, [value]);

    const validateFile = (file: File): string | null => {
      if (!file.type.startsWith("image/")) {
        return "File must be an image";
      }
      if (file.size > maxSize) {
        return `File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
      }
      return null;
    };

    const addImage = useCallback(
      (file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
          setUploadError(validationError);
          return;
        }

        setUploadError(null);

        // Clean up previous preview
        if (image) {
          URL.revokeObjectURL(image.preview);
        }

        const imageFile: ImageFile = {
          file,
          preview: URL.createObjectURL(file),
          progress: 0,
          status: "uploading",
        };

        setImage(imageFile);
        setPreview(imageFile.preview);

        // Simulate upload progress
        simulateUpload(imageFile, file);
      },
      [image, maxSize],
    );

    const simulateUpload = (imageFile: ImageFile, file: File) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);

          setImage((prev) =>
            prev
              ? {
                  ...prev,
                  progress: 100,
                  status: "completed",
                }
              : null,
          );

          // Notify parent component
          onChange?.(file);
        } else {
          setImage((prev) => (prev ? { ...prev, progress } : null));
        }
      }, 100);
    };

    const removeImage = useCallback(() => {
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      setImage(null);
      setPreview(null);
      setUploadError(null);
      onChange?.(null);
    }, [image, onChange]);

    const handleDragEnter = useCallback(
      (e: React.DragEvent) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      },
      [disabled],
    );

    const handleDragLeave = useCallback(
      (e: React.DragEvent) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
      },
      [disabled],
    );

    const handleDragOver = useCallback(
      (e: React.DragEvent) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
      },
      [disabled],
    );

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
          addImage(files[0]);
        }
      },
      [addImage, disabled],
    );

    const openFileDialog = useCallback(() => {
      if (disabled) return;
      const input = document.createElement("input");
      input.type = "file";
      input.accept = accept;
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          addImage(target.files[0]);
        }
      };
      input.click();
    }, [accept, addImage, disabled]);

    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const displayError = error || uploadError;

    return (
      <div ref={ref} className={cn("w-full", className)}>
        {/* Image Preview */}
        {preview && (
          <div className="mb-6">
            <Card className="group relative flex w-full items-center justify-center rounded-md bg-accent/50 shadow-none">
              <div className="relative size-64">
                <img
                  src={preview}
                  className="size-64 rounded-md object-cover"
                  alt="Upload preview"
                />

                {/* Remove Button Overlay - Inside the image */}
                {!disabled && (
                  <Button
                    onClick={removeImage}
                    variant="outline"
                    size="icon"
                    className="absolute -top-2 -right-2 size-7 rounded-full bg-white opacity-100 shadow-sm hover:bg-gray-100"
                    type="button"
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Upload Area - Only show if no image */}
        {!preview && (
          <Card
            className={cn(
              "rounded-md border-dashed shadow-none transition-colors",
              isDragging && !disabled
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
              disabled && "cursor-not-allowed opacity-50",
              displayError && "border-destructive",
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <CardContent className="text-center">
              <div className="mx-auto mb-3 flex size-8 items-center justify-center rounded-full border border-border">
                <CloudUpload className="size-4" />
              </div>
              <h3 className="text-2sm mb-0.5 font-semibold text-foreground">
                Choose a file or drag & drop here.
              </h3>
              <span className="mb-3 block text-xs font-normal text-secondary-foreground">
                JPEG, PNG, up to {formatBytes(maxSize)}.
              </span>
              <Button
                size="sm"
                onClick={openFileDialog}
                disabled={disabled}
                type="button"
              >
                Browse File
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Upload Progress Card */}
        {image && image.status === "uploading" && (
          <div className="mt-6">
            <Card className="rounded-md shadow-none">
              <CardContent className="flex items-center gap-2 p-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border">
                  <Image className="size-4 text-muted-foreground" />
                </div>
                <div className="flex w-full flex-col gap-1.5">
                  <div className="-mt-2 flex w-full items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs leading-none font-medium text-foreground">
                        {image.file.name}
                      </span>
                      <span className="text-xs leading-none font-normal text-muted-foreground">
                        {formatBytes(image.file.size)}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Uploading... {Math.round(image.progress)}%
                      </p>
                    </div>
                    <Button
                      onClick={removeImage}
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      disabled={disabled}
                      type="button"
                    >
                      <CircleX className="size-3.5" />
                    </Button>
                  </div>

                  <Progress
                    value={image.progress}
                    className={cn(
                      "h-1 transition-all duration-300",
                      "[&>div]:bg-zinc-950 dark:[&>div]:bg-zinc-50",
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Message */}
        {displayError && (
          <Alert variant="destructive" appearance="light" className="mt-5">
            <AlertIcon>
              <AlertTriangle />
            </AlertIcon>
            <AlertContent>
              <AlertTitle>File upload error</AlertTitle>
              <AlertDescription>{displayError}</AlertDescription>
            </AlertContent>
          </Alert>
        )}
      </div>
    );
  },
);

SingleImageUpload.displayName = "SingleImageUpload";

export default SingleImageUpload;
