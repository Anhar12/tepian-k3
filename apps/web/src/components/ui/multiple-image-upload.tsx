import { useCallback, useState, forwardRef, useEffect } from "react";
import mime from "mime-types";
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

interface UploadFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

interface MultipleImageUploadProps {
  maxSize?: number;
  maxFiles?: number;
  accept?: string;
  className?: string;
  value?: File[];
  onChange?: (files: File[]) => void;
  onBlur?: () => void;
  name?: string;
  disabled?: boolean;
  error?: string;
}

const MultipleImageUpload = forwardRef<
  HTMLDivElement,
  MultipleImageUploadProps
>(
  (
    {
      maxSize = 2 * 1024 * 1024, // 2MB
      maxFiles = 10,
      accept = "image/*",
      className,
      value,
      onChange,
      onBlur: _onBlur,
      name: _name,
      disabled = false,
      error,
    },
    ref,
  ) => {
    const [images, setImages] = useState<UploadFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    useEffect(() => {
      if (
        value === null ||
        value === undefined ||
        (Array.isArray(value) && value.length === 0)
      ) {
        images.forEach((img) => {
          if (img.preview) URL.revokeObjectURL(img.preview);
        });
        setImages([]);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omitting `images` to avoid infinite loop
    }, [value]);

    const addImages = useCallback(
      (files: FileList | File[]) => {
        const validateFile = (file: File): string | null => {
          if (!file.type.startsWith("image/")) {
            return "File must be an image";
          }
          if (file.size > maxSize) {
            return `File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
          }
          return null;
        };

        const simulateUpload = (imageFile: UploadFile) => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
              progress = 100;
              clearInterval(interval);

              setImages((prev) =>
                prev.map((img) =>
                  img.id === imageFile.id
                    ? { ...img, progress: 100, status: "completed" as const }
                    : img,
                ),
              );

              // Notify parent
              setImages((current) => {
                const completedFiles = current
                  .filter((img) => img.status === "completed")
                  .map((img) => img.file);
                onChange?.(completedFiles);
                return current;
              });
            } else {
              setImages((prev) =>
                prev.map((img) =>
                  img.id === imageFile.id ? { ...img, progress } : img,
                ),
              );
            }
          }, 100);
        };

        const fileArray = Array.from(files);

        if (images.length + fileArray.length > maxFiles) {
          setUploadError(`Maximum ${maxFiles} files allowed`);
          return;
        }

        const newImages: UploadFile[] = [];

        for (const file of fileArray) {
          const validationError = validateFile(file);
          if (validationError) {
            setUploadError(validationError);
            continue;
          }

          const imageFile: UploadFile = {
            id: Math.random().toString(36).substring(7),
            file,
            preview: URL.createObjectURL(file),
            progress: 0,
            status: "uploading",
          };

          newImages.push(imageFile);
          simulateUpload(imageFile);
        }

        setUploadError(null);
        setImages((prev) => [...prev, ...newImages]);
      },
      [images.length, maxFiles, maxSize, onChange],
    );

    const removeImage = useCallback(
      (id: string) => {
        setImages((prev) => {
          const updated = prev.filter((img) => {
            if (img.id === id) {
              if (img.preview) URL.revokeObjectURL(img.preview);
              return false;
            }
            return true;
          });

          const completedFiles = updated
            .filter((img) => img.status === "completed")
            .map((img) => img.file);
          onChange?.(completedFiles);

          return updated;
        });
        setUploadError(null);
      },
      [onChange],
    );

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
          addImages(files);
        }
      },
      [addImages, disabled],
    );

    const openFileDialog = useCallback(() => {
      if (disabled) return;
      const input = document.createElement("input");
      input.type = "file";
      input.accept = accept;
      input.multiple = true;
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          addImages(target.files);
        }
      };
      input.click();
    }, [accept, addImages, disabled]);

    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const getAcceptedFormats = (): string => {
      if (accept === "*/*" || accept === "") return "Any file type";

      const formats = accept.split(",").map((f) => f.trim());
      const extensions: string[] = [];

      formats.forEach((format) => {
        if (format.startsWith(".")) {
          extensions.push(format.substring(1).toUpperCase());
        } else if (format.includes("/*")) {
          const type = format.split("/")[0];
          if (type === "image") extensions.push("Images");
          else if (type === "video") extensions.push("Videos");
          else if (type === "audio") extensions.push("Audio");
          else if (type)
            extensions.push(type.charAt(0).toUpperCase() + type.slice(1));
        } else {
          const ext = mime.extension(format);
          if (ext) extensions.push(ext.toUpperCase());
        }
      });

      if (extensions.length === 0) return "Selected file types";
      if (extensions.length <= 3) return extensions.join(", ");
      return `${extensions.slice(0, 3).join(", ")} and more`;
    };

    const displayError = error || uploadError;

    return (
      <div ref={ref} className={cn("w-full", className)}>
        {/* Upload Area */}
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
              Choose files or drag & drop here.
            </h3>
            <span className="mb-3 block text-xs font-normal text-secondary-foreground">
              {getAcceptedFormats()}, up to {formatBytes(maxSize)}. Max{" "}
              {maxFiles} files.
            </span>
            <Button
              size="sm"
              onClick={openFileDialog}
              disabled={disabled}
              type="button"
            >
              Browse Files
            </Button>
          </CardContent>
        </Card>

        {/* Image Previews Grid */}
        {images.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {images.map((img) => (
              <div key={img.id}>
                {img.status === "completed" ? (
                  <Card className="group relative rounded-md bg-accent/50 shadow-none">
                    <div className="relative aspect-square">
                      <img
                        src={img.preview}
                        className="size-full rounded-md object-cover"
                        alt={img.file.name}
                      />
                      {!disabled && (
                        <Button
                          onClick={() => removeImage(img.id)}
                          variant="outline"
                          size="icon"
                          className="absolute -top-2 -right-2 size-7 rounded-full bg-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-gray-100"
                          type="button"
                        >
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ) : (
                  <Card className="rounded-md shadow-none">
                    <CardContent className="flex flex-col gap-2 p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border">
                          <Image className="size-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-foreground">
                            {img.file.name}
                          </p>
                        </div>
                        <Button
                          onClick={() => removeImage(img.id)}
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
                        value={img.progress}
                        className={cn(
                          "h-1 transition-all duration-300",
                          "[&>div]:bg-zinc-950 dark:[&>div]:bg-zinc-50",
                        )}
                      />
                      <p className="text-xs text-muted-foreground">
                        {Math.round(img.progress)}%
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
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

MultipleImageUpload.displayName = "MultipleImageUpload";

export default MultipleImageUpload;
