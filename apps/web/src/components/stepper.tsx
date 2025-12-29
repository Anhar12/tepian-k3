import { Check } from "lucide-react";

const steps = [
  { id: 1, label: "Parameter Pengujian", title: "Tahap 1" },
  { id: 2, label: "Kaji Ulang", title: "Tahap 2" },
  { id: 3, label: "Status Pengajuan", title: "Tahap 3" },
  { id: 4, label: "Informasi Pembayaran", title: "Tahap 4" },
];

export function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="mx-auto flex max-w-4xl items-center justify-center gap-4 overflow-x-auto px-2 py-4">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex items-center">
          <div className="flex min-w-30 flex-col items-center gap-2">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                step.id === currentStep
                  ? "border-[#1E40AF] bg-[#1E40AF] text-white shadow-lg shadow-blue-200"
                  : step.id < currentStep
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-blue-100 bg-white text-[#1E40AF]"
              }`}
            >
              {step.id < currentStep ? <Check className="h-5 w-5" /> : step.id}
            </div>
            <div className="text-center">
              <span className="mb-1 block rounded-full bg-[#1E40AF] px-2 py-0.5 text-[10px] font-bold text-white">
                {step.title}
              </span>
              <span
                className={`text-[11px] font-semibold whitespace-nowrap ${
                  step.id <= currentStep ? "text-slate-700" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
          {idx < steps.length - 1 && (
            <div className="mx-2 mb-8 flex h-0.5 w-16 gap-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-full ${step.id < currentStep ? "bg-emerald-500" : "bg-blue-100"}`}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
