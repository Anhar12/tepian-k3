import { pageHead } from "@/utils/page-head";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import SertifikasiComponent from "./-components/sertifikat-component";

export const Route = createFileRoute("/(core)/pengujian/sertifikat")({
  validateSearch: z.object({
    orderId: z.uuidv7(),
  }),
  beforeLoad: async ({ search }) => {
    if (!search.orderId) {
      throw redirect({
        to: "/pengujian",
      });
    }
  },
  head: () => pageHead("Sertifikat"),
  component: RouteComponent,
});

/**
 * Sertifikat page component.
 * Fetches worksheet certificate data for the given orderId and renders it.
 */
function RouteComponent() {
  const { orderId } = Route.useSearch();

  const { data: worksheet, isLoading } = useQuery(
    trpc.pengujian.worksheet.getWorksheetWithCertificates.queryOptions({
      orderId,
    }),
  );

  return <SertifikasiComponent worksheet={worksheet} isLoading={isLoading} />;
}
