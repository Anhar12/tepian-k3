import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Building2,
  ShieldCheck,
  Headphones,
  TestTube2,
  Globe2,
} from "lucide-react";
import { createElement } from "react";
import { Route } from "../transaksi";

const categories = [
  {
    id: 1,
    label: "Lingkungan Kerja",
    color: "from-emerald-400 to-emerald-600",
    icon: Building2,
  },
  {
    id: 2,
    label: "Keselamatan Kerja",
    color: "from-orange-400 to-orange-600",
    icon: ShieldCheck,
  },
  {
    id: 3,
    label: "Kesehatan Kerja",
    color: "from-violet-400 to-violet-600",
    icon: Headphones,
  },
  {
    id: 4,
    label: "Biomarker",
    color: "from-rose-400 to-rose-600",
    icon: TestTube2,
  },
  {
    id: 5,
    label: "Lingkungan Hidup",
    color: "from-blue-400 to-blue-600",
    icon: Globe2,
  },
];

export function Clusters() {
  const { clusterId } = Route.useSearch();

  const navigate = useNavigate();

  const { data: clusters } = useSuspenseQuery(
    trpc.cluster.getAllClusters.queryOptions(),
  );

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

      <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
        {clusters.map((cluster) => (
          <button
            key={cluster.id}
            className={cn(
              "group relative flex aspect-square flex-col items-center justify-center rounded-3xl bg-linear-to-br p-6 text-white shadow-lg transition-transform hover:-translate-y-2 hover:shadow-xl",
              categories.find((c) => c.label === cluster.name)?.color ||
                "from-gray-400 to-gray-600",
              // if selected it should zoom in
              clusterId === cluster.id && "scale-110 ring-4 ring-white",
            )}
            onClick={() => {
              navigate({
                to: "/transaksi",
                search: (old) => ({
                  ...old,
                  clusterId: cluster.id,
                }),
              });
            }}
          >
            <div className="mb-4 transform transition-transform group-hover:scale-110">
              {createElement(
                categories.find((c) => c.label === cluster.name)?.icon ||
                  Globe2,
                { className: "size-8" },
              )}
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
