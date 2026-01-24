import { Construction } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { EmptyState } from "./ui/empty-state";

export default function UnderConstruction() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <EmptyState
        icon={
          <Construction className="h-16 w-16 animate-pulse text-amber-400" />
        }
        title="Halaman Sedang Dalam Pengembangan"
        description="Fitur ini sedang dalam proses pengembangan dan akan segera tersedia. Terima kasih atas kesabaran Anda."
        actions={[
          {
            label: "Kembali ke beranda",
            onClick: () => navigate({ to: "/" }),
          },
        ]}
      />
    </div>
  );
}
