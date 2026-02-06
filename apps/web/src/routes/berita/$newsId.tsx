import GridBackground from "@/components/grid-background";
import LandingNavbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublicUrl } from "@/utils/url";
import { trpc } from "@/utils/trpc";
import DOMPurify from "dompurify";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Calendar,
  ArrowLeft,
  Share2,
  Facebook,
  Twitter,
  Link as LinkIcon,
} from "lucide-react";
import { globalSuccessToast } from "@/lib/toast";
import ImageWithFallback from "@/components/image-with-fallback";
import { pageHead } from "@/utils/page-head";

export const Route = createFileRoute("/berita/$newsId")({
  component: NewsDetailPage,
  head: () => pageHead("Detail Berita"),
});

function NewsDetailSkeleton() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden overflow-y-auto bg-white dark:bg-neutral-950">
      <LandingNavbar />

      {/* Hero Skeleton */}
      <section className="relative h-64 w-full md:h-96">
        <Skeleton className="h-full w-full" />
      </section>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-8 sm:px-6 md:px-10">
        <div className="mx-auto max-w-4xl">
          <Skeleton className="mb-4 h-8 w-48" />
          <Skeleton className="mb-6 h-12 w-full" />
          <Skeleton className="mb-2 h-4 w-32" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NewsDetailPage() {
  const navigate = useNavigate();
  const { newsId } = Route.useParams();

  const {
    data: news,
    isLoading,
    isError,
  } = useQuery(
    trpc.news.getPublishedNewsById.queryOptions({
      id: newsId,
    }),
  );

  const { data: relatedNews } = useQuery(
    trpc.news.getFirst5News.queryOptions(),
  );

  const handleShare = async (platform: "facebook" | "twitter" | "copy") => {
    const url = window.location.href;
    const title = news?.title ?? "Berita";

    switch (platform) {
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
          "_blank",
        );
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
          "_blank",
        );
        break;
      case "copy":
        await navigator.clipboard.writeText(url);
        globalSuccessToast("Link berhasil disalin!");
        break;
    }
  };

  if (isLoading) {
    return <NewsDetailSkeleton />;
  }

  if (isError || !news) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden overflow-y-auto bg-white dark:bg-neutral-950">
        <LandingNavbar />

        <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-semibold text-muted-foreground">
            Berita tidak ditemukan
          </h1>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate({ to: "/berita" })}
          >
            <ArrowLeft className="size-4" />
            Kembali ke Daftar Berita
          </Button>
        </div>
      </div>
    );
  }

  // Filter out the current news from related news
  const filteredRelatedNews = relatedNews
    ?.filter((item) => item.id !== newsId)
    .slice(0, 3);

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden overflow-y-auto bg-white dark:bg-neutral-950">
      <LandingNavbar />

      {/* Hero with Image */}
      <section className="relative h-64 w-full md:h-96">
        <div className="absolute inset-0">
          <ImageWithFallback
            src={getPublicUrl(news.imageUrl ?? "")}
            alt={news.title}
            className="h-full w-full object-cover"
            fallbackClassName="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />
        </div>
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-8 sm:px-6 md:px-10">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Calendar className="size-4" />
              <span>
                {news.publishedAt
                  ? format(new Date(news.publishedAt), "EEEE, dd MMMM yyyy", {
                      locale: idLocale,
                    })
                  : "-"}
              </span>
            </div>
            <h1 className="mt-2 max-w-4xl text-2xl font-bold text-white md:text-4xl">
              {news.title}
            </h1>
          </div>
        </div>
      </section>

      {/* Back Button & Share */}
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 pt-8 sm:px-6 md:px-10">
        <Button
          variant="ghost"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate({ to: "/berita" })}
        >
          <ArrowLeft className="size-4" />
          Kembali
        </Button>

        <div className="flex items-center gap-2">
          <span className="mr-2 text-sm text-muted-foreground">
            <Share2 className="inline size-4" /> Bagikan:
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleShare("facebook")}
          >
            <Facebook className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleShare("twitter")}
          >
            <Twitter className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleShare("copy")}
          >
            <LinkIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Article Content */}
      <article className="container mx-auto px-4 py-8 sm:px-6 md:px-10">
        <div className="mx-auto max-w-4xl">
          <div
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(news.content),
            }}
          />
        </div>
      </article>

      {/* Related News */}
      {filteredRelatedNews && filteredRelatedNews.length > 0 && (
        <section className="relative bg-muted/50 px-4 py-16 sm:px-6 md:px-10">
          <GridBackground />
          <div className="container mx-auto">
            <div className="relative z-10 mb-8 flex flex-col items-center gap-2">
              <h2 className="text-center text-3xl font-semibold text-primary">
                Berita Lainnya
              </h2>
              <div className="h-1 w-32 bg-linear-to-r from-accent-linear-1 via-accent-linear-2 to-accent-linear-3" />
            </div>

            <div className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRelatedNews.map((relatedItem) => (
                <Card
                  key={relatedItem.id}
                  className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl transition-shadow hover:shadow-lg"
                  onClick={() =>
                    navigate({
                      to: "/berita/$newsId",
                      params: { newsId: relatedItem.id },
                    })
                  }
                >
                  <CardHeader className="p-0">
                    <div className="h-40 w-full overflow-hidden">
                      <ImageWithFallback
                        src={getPublicUrl(relatedItem.imageUrl ?? "")}
                        alt={relatedItem.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="size-4" />
                      <span>
                        {relatedItem.publishedAt
                          ? format(
                              new Date(relatedItem.publishedAt),
                              "dd MMM yyyy",
                              {
                                locale: idLocale,
                              },
                            )
                          : "-"}
                      </span>
                    </div>
                    <h3 className="line-clamp-2 text-lg font-semibold text-primary group-hover:underline">
                      {relatedItem.title}
                    </h3>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <span className="text-sm font-medium text-primary">
                      Baca selengkapnya →
                    </span>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="relative mt-auto flex h-11 items-center justify-center bg-muted/50 px-4 py-4 sm:px-6 md:px-10">
        <p className="text-center text-sm font-normal text-foreground">
          &copy; 2025 Balai K3 Samarinda
        </p>
      </footer>
    </div>
  );
}
