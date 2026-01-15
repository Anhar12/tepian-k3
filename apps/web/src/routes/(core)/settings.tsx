import { createFileRoute } from "@tanstack/react-router";
import { SessionsManager } from "@/components/sessions-manager";

export const Route = createFileRoute("/(core)/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="font-['Poppins'] text-[28px] font-bold text-[#4D4D4D]">
          Pengaturan Akun
        </h1>
        <p className="font-['Poppins'] text-[16px] text-[#64748B] mt-2">
          Kelola preferensi dan keamanan akun Anda
        </p>
      </div>

      <SessionsManager />
    </div>
  );
}
