import { SurveyForm } from "@/components/survey-form";
import { pageHead } from "@/utils/page-head";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import z from "zod";

export const Route = createFileRoute("/(core)/pengujian/survey-kepuasan")({
  validateSearch: z.object({
    orderId: z.uuidv7(),
  }),
  beforeLoad: async ({ context, search }) => {
    // check if orderId exists
    if (!search.orderId) {
      throw redirect({
        to: "/pengujian",
      });
    }

    const data = await context.queryClient.ensureQueryData(
      context.trpc.order.getOrderById.queryOptions({
        orderId: search.orderId,
      }),
    );

    if (!data) {
      throw redirect({
        to: "/pengujian",
      });
    }

    if (data.surveyResponses.length > 0 || data.surveyFeedback) {
      // already filled survey, redirect back to order detail
      throw redirect({
        to: `/pengujian/status`,
        search: { orderId: search.orderId },
      });
    }

    if (data.status !== "completed") {
      // order not completed yet, redirect back to order detail
      throw redirect({
        to: `/pengujian/status`,
        search: { orderId: search.orderId },
      });
    }

    return;
  },
  head: () => pageHead("Pengujian - Survey Kepuasan"),
  component: RouteComponent,
});

function RouteComponent() {
  const { orderId } = Route.useSearch();

  const { data: order, isLoading } = useQuery(
    trpc.order.getOrderById.queryOptions({ orderId }),
  );

  if (isLoading || !order) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container min-h-[calc(100vh-8rem)]">
      <SurveyForm order={order} />
    </div>
  );
}
