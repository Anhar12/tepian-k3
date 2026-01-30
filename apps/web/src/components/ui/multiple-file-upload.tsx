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
import { CloudUpload, AlertTriangle, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

interface MultipleFileUploadProps {
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

const MultipleFileUpload = forwardRef<HTMLDivElement, MultipleFileUploadProps>(
  (
    {
      maxSize = 10 * 1024 * 1024, // 10MB
      maxFiles = 10,
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
    const [files, setFiles] = useState<UploadFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    useEffect(() => {
      if (
        value === null ||
        value === undefined ||
        (Array.isArray(value) && value.length === 0)
      ) {
        setFiles([]);
      }
    }, [value]);

    const validateFile = (file: File): string | null => {
      if (file.size > maxSize) {
        return `File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
      }
      return null;
    };

    const addFiles = useCallback(
      (fileList: FileList | File[]) => {
        const fileArray = Array.from(fileList);

        if (files.length + fileArray.length > maxFiles) {
          setUploadError(`Maximum ${maxFiles} files allowed`);
          return;
        }

        const newFiles: UploadFile[] = [];

        for (const file of fileArray) {
          const validationError = validateFile(file);
          if (validationError) {
            setUploadError(validationError);
            continue;
          }

          const uploadFile: UploadFile = {
            id: Math.random().toString(36).substring(7),
            file,
            progress: 0,
            status: "uploading",
          };

          newFiles.push(uploadFile);
          simulateUpload(uploadFile);
        }

        setUploadError(null);
        setFiles((prev) => [...prev, ...newFiles]);
      },
      [files.length, maxFiles, maxSize],
    );

    const simulateUpload = (uploadFile: UploadFile) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);

          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, progress: 100, status: "completed" as const }
                : f,
            ),
          );

          // Notify parent
          setFiles((current) => {
            const completedFiles = current
              .filter((f) => f.status === "completed")
              .map((f) => f.file);
            onChange?.(completedFiles);
            return current;
          });
        } else {
          setFiles((prev) =>
            prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f)),
          );
        }
      }, 100);
    };

    const removeFile = useCallback(
      (id: string) => {
        setFiles((prev) => {
          const updated = prev.filter((f) => f.id !== id);

          const completedFiles = updated
            .filter((f) => f.status === "completed")
            .map((f) => f.file);
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

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
          addFiles(droppedFiles);
        }
      },
      [addFiles, disabled],
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
          addFiles(target.files);
        }
      };
      input.click();
    }, [accept, addFiles, disabled]);

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

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            {files.map((f) => (
              <Card key={f.id} className="rounded-md shadow-none">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                    <FileText className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {f.file.name}
                      </p>
                      {!disabled && (
                        <Button
                          onClick={() => removeFile(f.id)}
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0"
                          type="button"
                        >
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatBytes(f.file.size)}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {getFileExtension(f.file.name)}
                      </span>
                      {f.status === "uploading" && (
                        <>
                          <span className="text-xs text-muted-foreground">
                            •
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(f.progress)}%
                          </span>
                        </>
                      )}
                    </div>
                    {f.status === "uploading" && (
                      <Progress
                        value={f.progress}
                        className={cn(
                          "mt-2 h-1 transition-all duration-300",
                          "[&>div]:bg-zinc-950 dark:[&>div]:bg-zinc-50",
                        )}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
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

MultipleFileUpload.displayName = "MultipleFileUpload";

export default MultipleFileUpload;
