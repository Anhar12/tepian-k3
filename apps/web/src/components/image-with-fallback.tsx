import { useState, type ImgHTMLAttributes } from "react";
import { type LucideIcon, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublicUrl } from "@/utils/url";

interface ImageWithFallbackProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "onLoad" | "onError"
> {
  src: string;
  alt?: string;
  fallbackIcon?: LucideIcon;
  imgClassName?: string;
  loaderClassName?: string;
  fallbackClassName?: string;
}

export default function ImageWithFallback({
  src,
  alt = "Image",
  fallbackIcon: FallbackIcon = ImageOff,
  className,
  imgClassName,
  loaderClassName,
  fallbackClassName,
  ...props
}: ImageWithFallbackProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded",
        className,
      )}
      data-url={src}
    >
      {loading && !error && (
        <Skeleton className={cn("absolute inset-0", loaderClassName)} />
      )}

      {error ? (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center bg-gray-100 text-gray-400",
            fallbackClassName,
          )}
        >
          <FallbackIcon className="h-12 w-12" />
        </div>
      ) : (
        <img
          src={getPublicUrl(src)}
          alt={alt}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          className={cn(
            "h-full w-full object-cover",
            imgClassName,
            loading && "invisible",
          )}
          {...props}
        />
      )}
    </div>
  );
}
