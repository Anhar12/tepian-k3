import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  IconBuildingFactory2,
  IconChecklist,
  IconFlask,
  IconReceipt2,
  IconCertificate,
  IconArrowRight,
} from "@tabler/icons-react";
import ImageWithFallback from "./image-with-fallback";

export function PengujianOnboardingWizard() {
  const steps = [
    {
      icon: <IconBuildingFactory2 className="size-8 text-blue-600" />,
      title: "1. Daftarkan Perusahaan",
      desc: "Lengkapi profil dan alamat perusahaan Anda.",
    },
    {
      icon: <IconChecklist className="size-8 text-blue-600" />,
      title: "2. Pilih Parameter Uji",
      desc: "Pilih jenis pengujian K3 yang Anda butuhkan.",
    },
    {
      icon: <IconReceipt2 className="size-8 text-blue-600" />,
      title: "3. Penawaran & Pembayaran",
      desc: "Setujui penawaran harga dan selesaikan pembayaran.",
    },
    {
      icon: <IconFlask className="size-8 text-blue-600" />,
      title: "4. Pengujian Lab",
      desc: "Tim ahli kami melakukan pengujian dan analisis.",
    },
    {
      icon: <IconCertificate className="size-8 text-blue-600" />,
      title: "5. Hasil & Sertifikat",
      desc: "Terima hasil uji dan sertifikat resmi Tepian K3.",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 md:px-8">
      <div className="text-center max-w-2xl mb-12">
        <h2 className="text-3xl font-bold tracking-tight mb-4">
          Selamat Datang di Layanan Pengujian K3
        </h2>
        <p className="text-muted-foreground text-lg">
          Platform terpadu untuk semua kebutuhan pengujian K3 perusahaan Anda. 
          Ikuti 5 langkah mudah berikut untuk memulai.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 max-w-5xl w-full mb-12 relative">
        {/* Connecting Line for Desktop */}
        <div className="hidden md:block absolute top-12 left-12 right-12 h-0.5 bg-blue-100 z-0"></div>

        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center text-center z-10 relative">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-md border-4 border-blue-50">
              {step.icon}
            </div>
            <h3 className="font-semibold text-sm mb-2">{step.title}</h3>
            <p className="text-xs text-muted-foreground px-2">{step.desc}</p>
          </div>
        ))}
      </div>

      <Card className="w-full max-w-lg bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-md">
        <CardContent className="p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <IconBuildingFactory2 className="size-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Langkah Pertama</h3>
          <p className="text-muted-foreground mb-6">
            Untuk mulai menggunakan layanan, Anda perlu mendaftarkan profil perusahaan terlebih dahulu. 
            Proses pendaftaran hanya memakan waktu 5-10 menit.
          </p>
          <Button asChild size="lg" className="w-full md:w-auto px-8 gap-2 bg-blue-600 hover:bg-blue-700">
            <Link to="/dashboard/company/create">
              Daftarkan Perusahaan Anda
              <IconArrowRight className="size-5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
