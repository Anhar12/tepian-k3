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
import {
  CircleX,
  CloudUpload,
  File as FileIcon,
  AlertTriangle,
  X,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadFile {
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

interface SingleFileUploadProps {
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

const SingleFileUpload = forwardRef<HTMLDivElement, SingleFileUploadProps>(
  (
    {
      maxSize = 10 * 1024 * 1024, // 10MB
      accept = "*/*",
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
    const [uploadedFile, setUploadedFile] = useState<UploadFile | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Handle external value changes (e.g., from form reset)
    useEffect(() => {
      if (value === null || value === undefined) {
        setUploadedFile(null);
      } else if (value instanceof File) {
        if (value.size > 0) {
          if (!uploadedFile || uploadedFile.file !== value) {
            setUploadedFile({
              file: value,
              progress: 100,
              status: "completed",
            });
          }
        } else {
          setUploadedFile(null);
        }
      }
    }, [value]);

    const validateFile = (file: File): string | null => {
      if (file.size > maxSize) {
        return `File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
      }
      return null;
    };

    const addFile = useCallback(
      (file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
          setUploadError(validationError);
          return;
        }

        setUploadError(null);

        const fileUpload: UploadFile = {
          file,
          progress: 0,
          status: "uploading",
        };

        setUploadedFile(fileUpload);

        // Simulate upload progress
        simulateUpload(fileUpload, file);
      },
      [maxSize],
    );

    const simulateUpload = (_fileUpload: UploadFile, file: File) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);

          setUploadedFile((prev) =>
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
          setUploadedFile((prev) => (prev ? { ...prev, progress } : null));
        }
      }, 100);
    };

    const removeFile = useCallback(() => {
      setUploadedFile(null);
      setUploadError(null);
      onChange?.(null);
    }, [onChange]);

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
        const file = files[0];
        if (file) {
          addFile(file);
        }
      },
      [addFile, disabled],
    );

    const openFileDialog = useCallback(() => {
      if (disabled) return;
      const input = document.createElement("input");
      input.type = "file";
      input.accept = accept;
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          addFile(file);
        }
      };
      input.click();
    }, [accept, addFile, disabled]);

    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const getFileExtension = (filename: string): string => {
      const parts = filename.split(".");
      const ext = parts[parts.length - 1];
      return parts.length > 1 && ext ? ext.toUpperCase() : "FILE";
    };

    const renderMimeTypes = (types: string): string => {
      return types
        .split(",")
        .map((type) => type.trim())
        .map((type) => mime.extension(type))
        .filter((ext): ext is string => !!ext)
        .join(", ");
    };

    const displayError = error || uploadError;

    return (
      <div ref={ref} className={cn("w-full", className)}>
        {/* File Preview */}
        {uploadedFile && uploadedFile.status === "completed" && (
          <div className="mb-6">
            <Card className="group relative rounded-md bg-accent/50 shadow-none">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                  <FileText className="size-6 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {uploadedFile.file.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatBytes(uploadedFile.file.size)}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {getFileExtension(uploadedFile.file.name)}
                    </span>
                  </div>
                </div>
                {!disabled && (
                  <Button
                    onClick={removeFile}
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    type="button"
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upload Area - Only show if no file */}
        {!uploadedFile && (
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
                {renderMimeTypes(accept)} up to {formatBytes(maxSize)}.
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
        {uploadedFile && uploadedFile.status === "uploading" && (
          <div className="mt-6">
            <Card className="rounded-md shadow-none">
              <CardContent className="flex items-center gap-2 p-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border">
                  <FileIcon className="size-4 text-muted-foreground" />
                </div>
                <div className="flex w-full flex-col gap-1.5">
                  <div className="-mt-2 flex w-full items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs leading-none font-medium text-foreground">
                        {uploadedFile.file.name}
                      </span>
                      <span className="text-xs leading-none font-normal text-muted-foreground">
                        {formatBytes(uploadedFile.file.size)}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Uploading... {Math.round(uploadedFile.progress)}%
                      </p>
                    </div>
                    <Button
                      onClick={removeFile}
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
                    value={uploadedFile.progress}
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

SingleFileUpload.displayName = "SingleFileUpload";

export default SingleFileUpload;
