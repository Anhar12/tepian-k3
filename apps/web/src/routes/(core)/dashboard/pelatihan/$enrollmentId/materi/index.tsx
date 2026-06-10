import { Button } from "@/components/ui/button";
import {
  Card,
} from "@/components/ui/card";
import { pageHead } from "@/utils/page-head";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle,
  FileText,
  Lock,
  PlayCircle,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute(
  "/(core)/dashboard/pelatihan/$enrollmentId/materi/",
)({
  head: () => pageHead("Daftar Materi"),
  component: RouteComponent,
});

function RouteComponent() {
  const { enrollmentId } = Route.useParams();

  // The layout might have already fetched this, but we query it here to be safe and use cache
  const { data: enrollment, isLoading } = useQuery(
    trpc.pelatihan.enrollment.getUserEnrollmentById.queryOptions({
      id: enrollmentId,
    }),
  );

  if (isLoading) {
    return <div className="p-8 text-center">Memuat daftar materi...</div>;
  }

  if (!enrollment) {
    return (
      <div className="p-8 text-center text-destructive">
        Enrollment tidak ditemukan.
      </div>
    );
  }

  const { pelatihan, progresses } = enrollment;
  const materials = pelatihan.materials;
  const assessments = pelatihan.assessments || [];

  const preTest = assessments.find((a) => a.type === "pre_test");
  const postTest = assessments.find((a) => a.type === "post_test");

  // Determine completed material IDs
  const completedMaterialIds = new Set(
    progresses?.filter((p) => p.completed).map((p) => p.materialId) || [],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Daftar Materi</h1>
        <p className="text-muted-foreground">
          Pilih materi yang ingin Anda pelajari. Selesaikan secara berurutan
          untuk hasil maksimal.
        </p>
      </div>

      <div className="space-y-4">
        {/* Pre-Test */}
        {preTest && (
          <Card className="overflow-hidden border-primary/20 bg-primary/5 transition-colors">
            <div className="flex flex-col sm:flex-row">
              <div className="flex h-32 w-full shrink-0 items-center justify-center bg-primary/10 sm:w-48">
                <FileText className="h-10 w-10 text-primary" />
              </div>
              <div className="flex flex-1 flex-col justify-center p-6">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-medium tracking-wider text-primary uppercase">
                    Ujian Awal
                  </span>
                </div>
                <h3 className="line-clamp-1 text-lg font-bold">
                  {preTest.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {preTest.description ||
                    "Kerjakan pre-test ini sebelum memulai materi."}
                </p>
              </div>
              <div className="flex shrink-0 items-center justify-center border-t border-primary/20 p-6 sm:border-t-0 sm:border-l">
                <Button asChild>
                  <Link
                    to="/dashboard/pelatihan/$enrollmentId/ujian/$assessmentId"
                    params={{ enrollmentId, assessmentId: preTest.id }}
                  >
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Mulai Ujian
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Materials */}
        {materials.map((materi, index) => {
          // Strict sequential logic could be implemented here
          const isAccessible = true;
          const isCompleted = completedMaterialIds.has(materi.id);

          return (
            <Card
              key={materi.id}
              className={cn(
                "overflow-hidden transition-colors",
                !isAccessible && "bg-muted/50 opacity-75",
              )}
            >
              <div className="flex flex-col sm:flex-row">
                <div
                  className={cn(
                    "flex h-32 w-full shrink-0 items-center justify-center bg-muted sm:w-48",
                    isCompleted && "bg-emerald-50 text-emerald-600",
                  )}
                >
                  {materi.type === "video" ? (
                    <Video className="h-10 w-10 opacity-60" />
                  ) : (
                    <FileText className="h-10 w-10 opacity-60" />
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-center p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                      Materi {index + 1}
                    </span>
                    {isCompleted && (
                      <span className="flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Selesai
                      </span>
                    )}
                  </div>
                  <h3 className="line-clamp-1 text-lg font-bold">
                    {materi.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {materi.description || "Tidak ada deskripsi"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center justify-center border-t p-6 sm:border-t-0 sm:border-l">
                  {isAccessible ? (
                    <Button
                      asChild
                      variant={isCompleted ? "outline" : "default"}
                    >
                      <Link
                        to="/dashboard/pelatihan/$enrollmentId/materi/$materialId"
                        params={{ enrollmentId, materialId: materi.id }}
                      >
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Pelajari
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" disabled>
                      <Lock className="mr-2 h-4 w-4" />
                      Terkunci
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {/* Post-Test */}
        {postTest && (
          <Card className="mt-8 overflow-hidden border-primary/20 bg-primary/5 transition-colors">
            <div className="flex flex-col sm:flex-row">
              <div className="flex h-32 w-full shrink-0 items-center justify-center bg-primary/10 sm:w-48">
                <FileText className="h-10 w-10 text-primary" />
              </div>
              <div className="flex flex-1 flex-col justify-center p-6">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-medium tracking-wider text-primary uppercase">
                    Ujian Akhir
                  </span>
                </div>
                <h3 className="line-clamp-1 text-lg font-bold">
                  {postTest.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {postTest.description ||
                    "Kerjakan post-test ini setelah menyelesaikan semua materi."}
                </p>
              </div>
              <div className="flex shrink-0 items-center justify-center border-t border-primary/20 p-6 sm:border-t-0 sm:border-l">
                <Button asChild>
                  <Link
                    to="/dashboard/pelatihan/$enrollmentId/ujian/$assessmentId"
                    params={{ enrollmentId, assessmentId: postTest.id }}
                  >
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Mulai Ujian
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
