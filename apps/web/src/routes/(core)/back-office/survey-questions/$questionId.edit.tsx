import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRedirectBackWithTimeout } from "@/lib/redirect-back-with-timeout";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { requirePermission } from "@/utils/require-permission";
import { queryClient, trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import surveySchema from "@tepian-k3/schema/survey.schema";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute(
  "/(core)/back-office/survey-questions/$questionId/edit",
)({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "survey-questions.update" }),
  params: z.object({
    questionId: z.uuidv7(),
  }),
  loader: async ({ context, params }) =>
    context.queryClient.ensureQueryData(
      context.trpc.survey.getQuestionById.queryOptions({
        id: params.questionId,
      }),
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const { questionId } = Route.useParams();
  const redirectBack = useRedirectBackWithTimeout();

  const { data: question } = useSuspenseQuery(
    trpc.survey.getQuestionById.queryOptions({ id: questionId }),
  );

  const form = useForm<z.infer<typeof surveySchema.updateSurveyQuestionSchema>>(
    {
      resolver: zodResolver(surveySchema.updateSurveyQuestionSchema),
      defaultValues: {
        id: question.id,
        questionText: question.questionText,
        order: question.order,
        isActive: question.isActive,
      },
    },
  );

  const updateQuestionMutation = useMutation(
    trpc.survey.updateQuestion.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.survey.getQuestionById.queryOptions({ id: questionId }),
        );
        globalSuccessToast("Berhasil memperbarui pertanyaan survey");
        await redirectBack();
      },
      onError: (error) => {
        globalErrorToast(
          "Gagal memperbarui pertanyaan survey: " + error.message,
        );
      },
    }),
  );

  function handleSubmit(
    data: z.infer<typeof surveySchema.updateSurveyQuestionSchema>,
  ) {
    updateQuestionMutation.mutate(data);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Perbarui Pertanyaan Survey</CardTitle>
          <CardDescription>
            Isi form di bawah untuk memperbarui pertanyaan survey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid gap-4"
          >
            <FieldGroup>
              <Controller
                control={form.control}
                name="questionText"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Pertanyaan
                    </FieldLabel>
                    <Textarea
                      placeholder="Masukkan pertanyaan survey"
                      className="min-h-20 text-sm"
                      {...field}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="order"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Urutan
                    </FieldLabel>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Masukkan urutan pertanyaan"
                      className="h-10 text-sm"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="isActive"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                    orientation="horizontal"
                  >
                    <Checkbox
                      id={`form-rhf-checkbox-isActive`}
                      name={field.name}
                      aria-invalid={fieldState.invalid}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <FieldLabel
                      htmlFor={`form-rhf-checkbox-isActive`}
                      className="font-normal"
                    >
                      Aktifkan Pertanyaan
                    </FieldLabel>
                  </Field>
                )}
              />

              <Button
                type="submit"
                className="mt-2 h-10 w-full text-sm"
                disabled={updateQuestionMutation.isPending}
              >
                {updateQuestionMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Perbarui Pertanyaan
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
