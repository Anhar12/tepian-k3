import { Construction, ArrowLeft } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";

export default function UnderConstruction() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Empty>
        <EmptyMedia>
          <Construction className="h-16 w-16 animate-pulse text-amber-400" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Halaman Sedang Dalam Pengembangan</EmptyTitle>
          <EmptyDescription>
            Fitur ini sedang dalam proses pengembangan dan akan segera tersedia.
            Terima kasih atas kesabaran Anda.
          </EmptyDescription>
        </EmptyHeader>
        <Button
          variant="outline"
          onClick={() => navigate({ to: "/" })}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Beranda
        </Button>
      </Empty>
    </div>
  );
}
