import { SurveyForm } from "@/components/survey-form";
import { createFileRoute, redirect } from "@tanstack/react-router";
import z from "zod";

export const Route = createFileRoute("/(core)/pengujian/survey-kepuasan")({
  beforeLoad: async ({ context, search }) => {
    // check if orderId exists
    if (!search.orderId) {
      throw redirect({
        to: "/pengujian",
      });
    }

    context.queryClient.ensureQueryData(
      context.trpc.order.getOrderById.queryOptions({
        orderId: search.orderId,
      }),
    );
  },
  validateSearch: z.object({
    orderId: z.uuidv7(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-screen bg-muted/30">
      <SurveyForm />
    </div>
  );
}
