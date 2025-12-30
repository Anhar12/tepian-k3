import {
  Building2,
  ShieldCheck,
  Headphones,
  TestTube2,
  Globe2,
} from "lucide-react";

const categories = [
  {
    id: 1,
    label: "Lingkungan Kerja",
    color: "from-emerald-400 to-emerald-600",
    icon: Building2,
  },
  {
    id: 2,
    label: "keselamatan kerja",
    color: "from-orange-400 to-orange-600",
    icon: ShieldCheck,
  },
  {
    id: 3,
    label: "Kesehatan kerja",
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
    label: "Lingkungan hidup",
    color: "from-blue-400 to-blue-600",
    icon: Globe2,
  },
];

export function ParameterCategories() {
  return (
    <div className="space-y-8 rounded-[2rem] border border-slate-100 bg-white p-10 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-[#0056B3]">
          Parameter Pengujian
        </h2>
        <p className="font-medium text-slate-500">
          Pilih kategori parameter yang akan diuji
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`group relative flex flex-col items-center justify-center rounded-[1.5rem] bg-gradient-to-br p-6 ${cat.color} aspect-square text-white shadow-lg transition-transform hover:-translate-y-2 hover:shadow-xl`}
          >
            <div className="mb-4 transform transition-transform group-hover:scale-110">
              <cat.icon className="h-12 w-12" strokeWidth={1.5} />
            </div>
            <span className="max-w-[80px] text-center text-sm leading-tight font-bold uppercase">
              {cat.label}
            </span>
            <div className="absolute inset-0 rounded-[1.5rem] bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );
}
