import { Building2, Shield, HeartPulse, Beaker, Leaf } from "lucide-react";

const categories = [
  { name: "Lingkungan Kerja", icon: Building2, color: "bg-emerald-500" },
  { name: "Keselamatan kerja", icon: Shield, color: "bg-[#C2410C]" },
  { name: "kesehatan kerja", icon: HeartPulse, color: "bg-purple-500" },
  { name: "Biomarker", icon: Beaker, color: "bg-rose-600" },
  { name: "Lingkungan hidup", icon: Leaf, color: "bg-blue-500" },
];

export function ParameterCategories() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {categories.map((cat) => (
        <button
          key={cat.name}
          className={`${cat.color} flex flex-col items-start gap-4 rounded-2xl p-6 text-left text-white transition-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-${cat.color.split("-")[1]}/20 group h-full`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-transform group-hover:scale-110">
            <cat.icon className="h-5 w-5" />
          </div>
          <span className="text-lg leading-tight font-bold">{cat.name}</span>
        </button>
      ))}
    </div>
  );
}
