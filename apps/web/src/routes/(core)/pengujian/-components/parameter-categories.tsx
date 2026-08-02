import { Skeleton } from "@/components/ui/skeleton";
import { getClusterColor, getClusterIcon } from "@/lib/cluster-colors";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { AlertCircle, Globe2, Info } from "lucide-react";
import { createElement } from "react";

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
  } = useQuery(trpc.pengujian.cluster.getAllClusters.queryOptions());

  return (
    <div className="space-y-8 rounded-4xl border border-slate-100 bg-white p-10 shadow-sm">
      <div className="space-y-1">
        <h2 className="font-bold text-slate-800">Pilih Jenis Pengujian</h2>
        <p className="text-sm text-slate-500">
          Pilih lokasi lalu tentukan jenis pengujian yang Anda butuhkan.
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

      {!search.clusterId && !isLoading && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <Info className="h-5 w-5 shrink-0 text-blue-600" />
          <p className="text-sm text-blue-700">
            Pilih jenis pengujian sesuai dengan kebutuhan Anda. Kami akan
            menampilkan parameter yang relevan.
          </p>
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
          : (clusters ?? []).map((cluster) => (
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
