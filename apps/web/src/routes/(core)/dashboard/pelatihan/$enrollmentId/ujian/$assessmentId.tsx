import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { pageHead } from "@/utils/page-head";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Clock, PlayCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute(
  "/(core)/dashboard/pelatihan/$enrollmentId/ujian/$assessmentId",
)({
  head: () => pageHead("Ujian Pelatihan"),
  component: RouteComponent,
});

function RouteComponent() {
  const { enrollmentId, assessmentId } = Route.useParams();
  const navigate = useNavigate();

  const { data: assessment, isLoading } = useQuery(
    trpc.pelatihan.assessment.getAssessmentById.queryOptions({
      id: assessmentId,
    }),
  );

  const startAttemptMutation = useMutation(
    trpc.pelatihan.assessment.startAttempt.mutationOptions({
      onSuccess: (data) => {
        if (data.success) {
          // Navigasi ke halaman pengerjaan soal
          navigate({
            to: "/dashboard/pelatihan/$enrollmentId/ujian/$assessmentId/kerjakan",
            params: { enrollmentId, assessmentId },
            search: { attemptId: data.attemptId },
          });
        }
      },
      onError: (error) => {
        toast.error(error.message || "Gagal memulai ujian");
      },
    }),
  );

  if (isLoading) {
    return <div className="p-8 text-center">Memuat data ujian...</div>;
  }

  if (!assessment) {
    return (
      <div className="p-8 text-center text-destructive">
        Ujian tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Button
        variant="ghost"
        onClick={() =>
          navigate({
            to: "/dashboard/pelatihan/$enrollmentId/materi",
            params: { enrollmentId },
          })
        }
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Daftar Materi
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{assessment.title}</CardTitle>
          <CardDescription>
            {assessment.type === "pre_test"
              ? "Ujian Awal (Pre-Test)"
              : "Ujian Akhir (Post-Test)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="whitespace-pre-line text-muted-foreground">
            {assessment.description ||
              "Silakan kerjakan ujian ini dengan sebaik-baiknya."}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Waktu Pengerjaan
                </p>
                <p className="font-bold">
                  {assessment.timeLimit
                    ? `${assessment.timeLimit} Menit`
                    : "Tanpa Batas Waktu"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <span className="font-bold text-primary">
                  {assessment.questions.length}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Jumlah Soal
                </p>
                <p className="font-bold">{assessment.questions.length} Soal</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t p-6">
          <Button
            size="lg"
            onClick={() =>
              startAttemptMutation.mutate({ enrollmentId, assessmentId })
            }
            disabled={startAttemptMutation.isPending}
          >
            <PlayCircle className="mr-2 h-5 w-5" />
            {startAttemptMutation.isPending ? "Memulai..." : "Mulai Kerjakan"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
