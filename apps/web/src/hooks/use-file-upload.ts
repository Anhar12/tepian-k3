import { useState } from "react";

interface UseFileUploadReturn {
  file: File | null;
  setFile: (file: File | null) => void;
  uploading: boolean;
  setUploading: (uploading: boolean) => void;
  reset: () => void;
}

export const useFileUpload = (): UseFileUploadReturn => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setFile(null);
    setUploading(false);
  };

  return {
    file,
    setFile,
    uploading,
    setUploading,
    reset,
  };
};
