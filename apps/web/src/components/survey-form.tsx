import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc, queryClient } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { globalSuccessToast, globalErrorToast } from "@/lib/toast";
import { Loader2, CheckCircle } from "lucide-react";
import type { Order, PaginatedOrder } from "@tepian-k3/types/order.types";

interface SurveyFormProps {
  order: Order | PaginatedOrder;
  onComplete?: () => void;
}

export function SurveyForm({ order, onComplete }: SurveyFormProps) {
  // Fetch active questions
  const { data: questions, isLoading: questionsLoading } = useQuery(
    trpc.survey.getActiveQuestions.queryOptions()
  );

  // Check if survey already submitted
  const { data: surveyStatus, isLoading: statusLoading } = useQuery(
    trpc.survey.checkSurveyStatus.queryOptions({ orderId: order.id })
  );

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");

  const submitSurveyMutation = useMutation(
    trpc.survey.submitSurvey.mutationOptions({
      onSuccess: async () => {
        globalSuccessToast("Terima kasih! Survey berhasil dikirim.");
        await queryClient.invalidateQueries(
          trpc.survey.checkSurveyStatus.queryOptions({ orderId: order.id })
        );
        onComplete?.();
      },
      onError: (error) => {
        globalErrorToast("Gagal mengirim survey: " + error.message);
      },
    })
  );

  const handleRatingChange = (questionId: string, value: string) => {
    setRatings((prev) => ({ ...prev, [questionId]: parseInt(value, 10) }));
  };

  const handleSubmit = () => {
    if (!questions) return;

    // Validate all questions answered
    const unanswered = questions.filter((q) => !ratings[q.id]);
    if (unanswered.length > 0) {
      globalErrorToast("Harap jawab semua pertanyaan sebelum mengirim.");
      return;
    }

    const responses = Object.entries(ratings).map(([questionId, rating]) => ({
      questionId,
      rating,
    }));

    submitSurveyMutation.mutate({
      orderId: order.id,
      responses,
      feedback: feedback || undefined,
    });
  };

  // If already submitted, show confirmation
  if (!statusLoading && surveyStatus?.hasSubmitted) {
    return (
      <Card className="mx-auto w-full max-w-4xl">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
          <h2 className="mb-2 text-xl font-semibold">Survey Sudah Diisi</h2>
          <p className="text-muted-foreground">
            Terima kasih telah mengisi survey kepuasan untuk order ini.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (questionsLoading || statusLoading) {
    return (
      <Card className="mx-auto w-full max-w-4xl pt-0">
        <CardHeader className="mb-6 rounded-t-xl bg-primary px-4 py-8 text-center text-white">
          <h1 className="mb-2 text-2xl font-bold">Survei Kepuasan Pelanggan</h1>
          <p className="text-sm opacity-90">
            Bantu kami meningkatkan layanan dengan memberikan penilaian Anda
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <Card className="mx-auto w-full max-w-4xl">
        <CardContent className="py-12">
          <Alert>
            <AlertDescription>
              Tidak ada pertanyaan survey yang tersedia saat ini.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Get company name safely
  const companyName =
    "company" in order && order.company
      ? (order.company as { name?: string }).name || "-"
      : "-";

  return (
    <Card className="mx-auto w-full max-w-4xl pt-0">
      <CardHeader className="mb-6 rounded-t-xl bg-primary px-4 py-8 text-center text-white">
        <h1 className="mb-2 text-2xl font-bold">Survei Kepuasan Pelanggan</h1>
        <p className="text-sm opacity-90">
          Bantu kami meningkatkan layanan dengan memberikan penilaian Anda
        </p>
      </CardHeader>

      <div className="px-4">
        {/* Company Info Card */}
        <Card className="mb-6 shadow-sm">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Nama Perusahaan
                </Label>
                <Input value={companyName} readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Tanggal</Label>
                <Input
                  value={new Date().toLocaleDateString("id-ID")}
                  readOnly
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Nomor Order
                </Label>
                <Input
                  value={order.orderNumber}
                  readOnly
                  className="bg-muted/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Survey Questions */}
        <Card className="shadow-sm">
          <CardContent className="space-y-6 pt-6">
            {questions.map((item, index) => (
              <div
                key={item.id}
                className="border-l-4 border-primary py-2 pl-4"
              >
                <Badge className="mb-3 rounded-md text-sm font-semibold text-white hover:opacity-90">
                  {index + 1}
                </Badge>
                <p className="mb-4 font-medium text-foreground">
                  {item.questionText}
                </p>
                <div className="flex items-center gap-4">
                  <span className="min-w-25 text-sm text-muted-foreground">
                    Tingkat kepuasan
                  </span>
                  <ToggleGroup
                    type="single"
                    value={ratings[item.id]?.toString()}
                    onValueChange={(value) =>
                      handleRatingChange(item.id, value)
                    }
                    className="gap-1"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <ToggleGroupItem
                        key={num}
                        value={num.toString()}
                        className="h-10 w-10 rounded-md border font-medium text-foreground hover:bg-primary/10 data-[state=on]:bg-primary data-[state=on]:text-white"
                      >
                        {num}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              </div>
            ))}

            {/* Feedback Section */}
            <div className="border-l-4 border-primary py-2 pl-4">
              <Label className="mb-2 block text-sm font-medium text-foreground">
                Kritik & Saran
              </Label>
              <Textarea
                placeholder="Masukkan kritik & saran anda (opsional)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-25 resize-none"
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSubmit}
                className="px-8 text-white hover:opacity-90"
                disabled={submitSurveyMutation.isPending}
              >
                {submitSurveyMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Kirim Survey
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Card>
  );
}
