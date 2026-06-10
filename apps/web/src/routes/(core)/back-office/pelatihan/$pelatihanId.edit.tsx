import { PelatihanForm } from "./-components/pelatihan-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SkeletonInput,
  SkeletonButton,
} from "@/components/ui/skeleton-generator";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

export const Route = createFileRoute(
  "/(core)/back-office/pelatihan/$pelatihanId/edit",
)({
  params: z.object({
    pelatihanId: z.string(),
  }),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "pelatihan.update" }),
  loader: async ({ context, params }) =>
    context.queryClient.ensureQueryData(
      context.trpc.pelatihan.base.getPelatihanById.queryOptions({
        id: params.pelatihanId,
      }),
    ),
  component: RouteComponent,
  pendingComponent: LoaderComponent,
  head: () => pageHead("Edit Pelatihan"),
});

function LoaderComponent() {
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Pelatihan</CardTitle>
          <CardDescription>Memuat data pelatihan...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <SkeletonInput className="h-10 w-full" />
            <SkeletonInput className="h-10 w-full" />
            <SkeletonInput className="h-24 w-full" />
            <SkeletonButton className="mt-4 w-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RouteComponent() {
  const { pelatihanId } = Route.useParams();

  const { data: pelatihan } = useSuspenseQuery(
    trpc.pelatihan.base.getPelatihanById.queryOptions({ id: pelatihanId }),
  );

  if (!pelatihan) {
    return <div>Pelatihan tidak ditemukan.</div>;
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Pelatihan</CardTitle>
          <CardDescription>
            Perbarui informasi detail pelatihan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PelatihanForm
            isEdit
            initialData={{
              id: pelatihan.id,
              title: pelatihan.title,
              slug: pelatihan.slug,
              description: pelatihan.description || undefined,
              shortDescription: pelatihan.shortDescription || undefined,
              level: pelatihan.level as any,
              duration: pelatihan.duration,
              capacity: pelatihan.capacity || undefined,
              price: pelatihan.price,
              discountPrice: pelatihan.discountPrice || undefined,
              minimumScore: pelatihan.minimumScore,
              status: pelatihan.status as any,
              thumbnailUrl: pelatihan.thumbnailUrl || undefined,
              instructorName: pelatihan.instructorName || undefined,
              instructorBio: pelatihan.instructorBio || undefined,
              categoryId: pelatihan.categoryId || undefined,
              startDate: pelatihan.startDate || undefined,
              endDate: pelatihan.endDate || undefined,
              location: pelatihan.location || undefined,
              facilities: pelatihan.facilities || undefined,
              requirements: pelatihan.requirements || undefined,
              dynamicRequirements:
                (pelatihan as any).dynamicRequirements || undefined,
              attendanceRequired:
                (pelatihan as any).attendanceRequired !== undefined
                  ? !!(pelatihan as any).attendanceRequired
                  : undefined,
              minAttendancePercentage:
                (pelatihan as any).minAttendancePercentage !== undefined
                  ? Number((pelatihan as any).minAttendancePercentage)
                  : undefined,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
