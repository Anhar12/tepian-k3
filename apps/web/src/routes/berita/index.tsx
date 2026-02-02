import { InfiniteScrollGrid } from "@/components/infinite-scroll-list";
import GridBackground from "@/components/grid-background";
import LandingNavbar from "@/components/navbar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublicUrl } from "@/utils/url";
import { trpc } from "@/utils/trpc";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { News } from "@tepian-k3/types/news.types";
import ImageWithFallback from "@/components/image-with-fallback";

export const Route = createFileRoute("/berita/")({
  component: NewsListPage,
});

function NewsCard({ news }: { news: News }) {
  const navigate = useNavigate();

  return (
    <Card
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl transition-shadow hover:shadow-lg"
      onClick={() =>
        navigate({
          to: "/berita/$newsId",
          params: { newsId: news.id },
        })
      }
    >
      <CardHeader className="p-0">
        <div className="h-48 w-full overflow-hidden">
          <ImageWithFallback
            src={getPublicUrl(news.imageUrl ?? "")}
            alt={news.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            fallbackClassName="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400"
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="size-4" />
          <span>
            {news.publishedAt
              ? format(new Date(news.publishedAt), "dd MMMM yyyy", {
                  locale: idLocale,
                })
              : "-"}
          </span>
        </div>
        <h3 className="line-clamp-2 text-lg font-semibold text-primary group-hover:underline">
          {news.title}
        </h3>
        <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">
          {news.content.replace(/<[^>]*>/g, "").slice(0, 150)}...
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <span className="text-sm font-medium text-primary">
          Baca selengkapnya →
        </span>
      </CardFooter>
    </Card>
  );
}

function NewsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card
          key={i}
          className="flex h-96 flex-col overflow-hidden rounded-2xl"
        >
          <CardHeader className="p-0">
            <Skeleton className="h-48 w-full rounded-none" />
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-2 p-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Skeleton className="h-4 w-32" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function NewsListPage() {
  const navigate = useNavigate();

  const newsQuery = useInfiniteQuery(
    trpc.news.getCursorPaginatedNews.infiniteQueryOptions(
      {
        limit: 12,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    ),
  );

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden overflow-y-auto bg-white dark:bg-neutral-950">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative flex h-64 flex-col items-center justify-center bg-primary px-4 text-center sm:px-6 md:px-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
          <GridBackground />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-primary-foreground md:text-5xl">
            Berita
          </h1>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Informasi terbaru seputar Keselamatan & Kesehatan Kerja
          </p>
        </div>
      </section>

      {/* Back Button */}
      <div className="container mx-auto px-4 pt-8 sm:px-6 md:px-10">
        <Button
          variant="ghost"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate({ to: "/" })}
        >
          <ArrowLeft className="size-4" />
          Kembali ke Beranda
        </Button>
      </div>

      {/* News Grid Section */}
      <section className="container mx-auto px-4 py-8 sm:px-6 md:px-10">
        <InfiniteScrollGrid<News>
          queryResult={newsQuery}
          estimateRowHeight={420}
          columns={3}
          height="calc(100vh - 400px)"
          className="min-h-150"
          gap={24}
          loadingComponent={<NewsGridSkeleton />}
          emptyComponent={
            <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
              <p className="text-lg">Belum ada berita tersedia</p>
            </div>
          }
          renderItem={(news) => <NewsCard news={news} />}
          getItemKey={(news) => news.id}
        />
      </section>

      {/* Footer */}
      <footer className="relative mt-auto flex h-11 items-center justify-center bg-muted/50 px-4 py-4 sm:px-6 md:px-10">
        <p className="text-center text-sm font-normal text-foreground">
          &copy; 2025 Balai K3 Samarinda
        </p>
      </footer>
    </div>
  );
}
