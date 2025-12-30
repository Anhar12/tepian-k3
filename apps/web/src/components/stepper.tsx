import { Check } from "lucide-react";

interface StepperProps {
  currentStep: number;
}

const steps = [
  { id: 1, label: "Parameter", title: "Tahap 1" },
  { id: 2, label: "Data Perusahaan", title: "Tahap 2" },
  { id: 3, label: "Status pengajuan", title: "Tahap 3" },
  { id: 4, label: "Informasi pembayaran", title: "Tahap 4" },
];

export function Stepper({ currentStep }: StepperProps) {
  return (
    <div className="mx-auto flex w-full max-w-4xl items-center justify-center py-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex flex-1 items-center last:flex-none">
          <div className="group relative flex flex-col items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                step.id === currentStep
                  ? "bg-[#0056B3] text-white shadow-lg ring-4 shadow-blue-200 ring-blue-50"
                  : step.id < currentStep
                    ? "bg-emerald-500 text-white"
                    : "border-2 border-slate-200 bg-white text-slate-400"
              }`}
            >
              {step.id < currentStep ? <Check className="h-5 w-5" /> : step.id}
            </div>
            <div className="absolute top-1 left-12 whitespace-nowrap">
              <div className="flex flex-col">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    step.id === currentStep
                      ? "bg-[#0056B3] text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {step.title}
                </span>
                <span
                  className={`mt-0.5 text-xs font-semibold ${
                    step.id === currentStep
                      ? "text-slate-900"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          </div>

          {index < steps.length - 1 && (
            <div className="mx-4 flex flex-1 items-center justify-center">
              <div className="w-full border-t-2 border-dashed border-slate-200" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
