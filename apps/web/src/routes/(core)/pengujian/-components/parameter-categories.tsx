import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  Building2,
  ShieldCheck,
  Headphones,
  TestTube2,
  Globe2,
  AlertCircle,
} from "lucide-react";
import { createElement } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getClusterColor, getClusterIcon } from "@/lib/cluster-colors";

interface ClustersProps {
  route: "/pengujian" | "/katalog";
}

export function Clusters({ route }: ClustersProps) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { clusterId?: string };

  const {
    data: clusters,
    isLoading,
    error,
  } = useQuery(trpc.cluster.getAllClusters.queryOptions());

  return (
    <div className="space-y-8 rounded-4xl border border-slate-100 bg-white p-10 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-[#0056B3]">
          Parameter Pengujian
        </h2>
        <p className="font-medium text-slate-500">
          Pilih kategori parameter yang akan diuji
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold text-red-900">Terjadi Kesalahan</p>
            <p className="text-sm text-red-700">
              {error.message || "Gagal memuat data kategori parameter"}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square overflow-hidden rounded-3xl"
              >
                <Skeleton className="h-full w-full" />
              </div>
            ))
          : clusters?.map((cluster) => (
              <button
                key={cluster.id}
                className={cn(
                  "group relative flex aspect-square flex-col items-center justify-center rounded-3xl bg-linear-to-br p-6 text-white shadow-lg transition-transform hover:-translate-y-2 hover:shadow-xl",
                  getClusterColor(cluster.name),
                  search.clusterId === cluster.id &&
                    "scale-110 ring-4 ring-white",
                )}
                onClick={() => {
                  navigate({
                    to: route,
                    search: (old) => ({
                      ...old,
                      clusterId: cluster.id,
                    }),
                  });
                }}
              >
                <div className="mb-4 transform transition-transform group-hover:scale-110">
                  {createElement(getClusterIcon(cluster.name) || Globe2, {
                    className: "size-8",
                  })}
                </div>
                <span className="max-w-20 text-center text-sm leading-tight font-bold uppercase">
                  {cluster.name}
                </span>
                <div className="absolute inset-0 rounded-3xl bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ))}
      </div>
    </div>
  );
}
