import { SurveyForm } from "@/components/survey-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(core)/survey-kepuasan")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-screen bg-muted/30">
      <SurveyForm />
    </div>
  );
}
