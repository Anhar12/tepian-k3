import { Card, CardContent } from "@/components/ui/card";
import { Wrench, CheckCircle2, AlertTriangle, ShieldAlert, Clock } from "lucide-react";

interface ToolStatsCardsProps {
  tools: any[];
}

/**
 * Statistik ketersediaan dan kondisi alat K3 untuk Tim Peralatan.
 */
export function ToolStatsCards({ tools = [] }: ToolStatsCardsProps) {
  const total = tools.length;
  const ready = tools.filter((t) => t.availability === "ready").length;
  const dipinjam = tools.filter((t) => t.availability === "dipinjam").length;
  const maintenance = tools.filter(
    (t) => t.condition === "rusak" || t.availability === "maintenance"
  ).length;

  const stats = [
    {
      title: "Total Alat",
      value: total,
      icon: <Wrench className="h-5 w-5 text-blue-600" />,
      bgColor: "bg-blue-50",
    },
    {
      title: "Tersedia (Ready)",
      value: ready,
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
      bgColor: "bg-emerald-50",
    },
    {
      title: "Sedang Dipinjam",
      value: dipinjam,
      icon: <Clock className="h-5 w-5 text-amber-600" />,
      bgColor: "bg-amber-50",
    },
    {
      title: "Perlu Perbaikan / Kalibrasi",
      value: maintenance,
      icon: <AlertTriangle className="h-5 w-5 text-rose-600" />,
      bgColor: "bg-rose-50",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="border border-slate-200 shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">{stat.title}</p>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
