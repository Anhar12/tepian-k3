import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

export function ChemicalSummaryCard() {
  const {
    data: summary,
    isLoading,
    error,
  } = useQuery(trpc.pengujian.chemicalMaterial.getSummary.queryOptions());

  if (error) return null;

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 text-center sm:p-6">
          {isLoading ? (
            <Skeleton className="mx-auto mb-1 h-8 w-16" />
          ) : (
            <p className="text-2xl font-bold text-emerald-600 sm:text-3xl">
              {summary?.totalAvailable}
            </p>
          )}
          <p className="text-sm font-medium text-muted-foreground">
            Sisa Stok Tersedia
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 text-center sm:p-6">
          {isLoading ? (
            <Skeleton className="mx-auto mb-1 h-8 w-16" />
          ) : (
            <p className="text-2xl font-bold text-amber-600 sm:text-3xl">
              {summary?.totalPending}
            </p>
          )}
          <p className="text-sm font-medium text-muted-foreground">
            Total Di-booking (Pending/BO)
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 text-center sm:p-6">
          {isLoading ? (
            <Skeleton className="mx-auto mb-1 h-8 w-16" />
          ) : (
            <p className="text-2xl font-bold sm:text-3xl">
              {summary?.totalFisik}
            </p>
          )}
          <p className="text-sm font-medium text-muted-foreground">
            Total Fisik Keseluruhan
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
