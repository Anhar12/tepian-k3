import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { pageHead } from "@/utils/page-head";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute(
  "/(core)/dashboard/pelatihan/$enrollmentId/ujian/$assessmentId/kerjakan",
)({
  validateSearch: z.object({
    attemptId: z.string().uuid(),
  }),
  head: () => pageHead("Kerjakan Ujian"),
  component: RouteComponent,
});

function RouteComponent() {
  const { enrollmentId, assessmentId } = Route.useParams();
  const { attemptId } = Route.useSearch();
  const navigate = useNavigate();

  // Load assessment data
  const { data: assessment, isLoading } = useQuery(
    trpc.pelatihan.assessment.getAssessmentById.queryOptions({
      id: assessmentId,
    }),
  );

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // All hooks must be called before any conditional returns (Rules of Hooks)
  const submitMutation = useMutation(
    trpc.pelatihan.assessment.submitAttempt.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Ujian selesai! Nilai Anda: ${data.score}`);
        navigate({
          to: "/dashboard/pelatihan/$enrollmentId/materi",
          params: { enrollmentId },
        });
      },
      onError: (err) => {
        toast.error(`Gagal menyimpan ujian: ${err.message}`);
      },
    }),
  );

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>Menyiapkan soal ujian...</p>
      </div>
    );
  }

  if (!assessment || assessment.questions.length === 0) {
    return (
      <div className="p-8 text-center text-destructive">
        Soal ujian tidak tersedia.
      </div>
    );
  }

  const questions = assessment.questions;
  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="p-8 text-center text-destructive">
        Soal ujian tidak tersedia.
      </div>
    );
  }

  const progress = (currentQuestionIndex / questions.length) * 100;

  const handleOptionChange = (optionId: string) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: optionId,
    });
  };

  const handleNext = () => {
    if (!answers[currentQuestion.id]) {
      toast.error("Silakan pilih jawaban terlebih dahulu");
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Finish assessment
      submitMutation.mutate({
        attemptId,
        answers,
      });
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{assessment.title}</h1>
        <div className="text-sm font-medium">
          Soal {currentQuestionIndex + 1} dari {questions.length}
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <Card className="flex min-h-[400px] flex-col">
        <CardHeader>
          <CardTitle className="text-lg leading-relaxed">
            {currentQuestion.questionText}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <RadioGroup
            value={answers[currentQuestion.id] || ""}
            onValueChange={handleOptionChange}
            className="space-y-3"
          >
            {currentQuestion.options.map((option) => (
              <div
                key={option.id}
                className={`flex items-center space-x-3 rounded-md border p-4 transition-colors ${
                  answers[currentQuestion.id] === option.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                <Label
                  htmlFor={`option-${option.id}`}
                  className="flex-1 cursor-pointer text-base leading-relaxed"
                >
                  {option.optionText}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0 || submitMutation.isPending}
          >
            Kembali
          </Button>
          <Button onClick={handleNext} disabled={submitMutation.isPending}>
            {submitMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {currentQuestionIndex === questions.length - 1
              ? "Selesai Ujian"
              : "Selanjutnya"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
