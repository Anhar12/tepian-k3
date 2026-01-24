import {
  Building2,
  Globe2,
  Headphones,
  ShieldCheck,
  TestTube2,
} from "lucide-react";

const clusterColors = [
  {
    label: "Lingkungan Kerja",
    color: "bg-linear-to-br from-emerald-400 to-emerald-600",
    icon: Building2,
  },
  {
    label: "Keselamatan Kerja",
    color: "bg-linear-to-br from-orange-400 to-orange-600",
    icon: ShieldCheck,
  },
  {
    label: "Kesehatan Kerja",
    color: "bg-linear-to-br from-violet-400 to-violet-600",
    icon: Headphones,
  },
  {
    label: "Biomarker",
    color: "bg-linear-to-br from-rose-400 to-rose-600",
    icon: TestTube2,
  },
  {
    label: "Lingkungan Hidup",
    color: "bg-linear-to-br from-blue-400 to-blue-600",
    icon: Globe2,
  },
];

export function getClusterColor(label: string) {
  const cluster = clusterColors.find((c) => c.label === label);
  return cluster ? cluster.color : "from-gray-400 to-gray-600";
}

export function getClusterIcon(label: string) {
  const cluster = clusterColors.find((c) => c.label === label);
  return cluster ? cluster.icon : null;
}
