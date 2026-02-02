import { useState, type ImgHTMLAttributes } from "react";
import { type LucideIcon, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageWithFallbackProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "onLoad" | "onError"
> {
  src: string;
  alt?: string;
  fallbackIcon?: LucideIcon;
  loaderClassName?: string;
  fallbackClassName?: string;
}

export default function ImageWithFallback({
  src,
  alt = "Image",
  fallbackIcon: FallbackIcon = ImageOff,
  className,
  loaderClassName,
  fallbackClassName,
  ...props
}: ImageWithFallbackProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={cn("relative inline-block", className)}>
      {loading && !error && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded bg-gray-100",
            loaderClassName,
          )}
        >
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
        </div>
      )}

      {error ? (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center rounded bg-gray-100 text-gray-400",
            fallbackClassName,
          )}
        >
          <FallbackIcon className="h-12 w-12" />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          className={cn("h-full w-full", loading && "invisible")}
          {...props}
        />
      )}
    </div>
  );
}
