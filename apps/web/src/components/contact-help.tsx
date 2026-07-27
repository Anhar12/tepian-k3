import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconBrandWhatsapp } from "@tabler/icons-react";
import { Phone } from "lucide-react";

interface ContactHelpProps {
  orderNumber?: string;
  className?: string;
}

export function ContactHelp({ orderNumber, className }: ContactHelpProps) {
  const whatsappNumber = "6281122334455"; // Example number, replace with actual
  const message = orderNumber
    ? `Halo, saya ingin bertanya tentang pesanan pengujian saya dengan nomor referensi ${orderNumber}.`
    : "Halo, saya ingin bertanya tentang layanan pengujian Tepian K3.";
  
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 space-y-2 text-center md:text-left">
            <h3 className="text-lg font-semibold">Butuh Bantuan?</h3>
            <p className="text-sm text-muted-foreground">
              Tim kami siap membantu Anda. Jam operasional: Senin–Jumat 08:00–16:00 WITA.
            </p>
            {orderNumber && (
              <p className="text-sm font-medium">
                Referensi: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">{orderNumber}</span>
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button asChild className="w-full sm:w-auto gap-2 bg-green-600 hover:bg-green-700">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <IconBrandWhatsapp className="size-4" />
                WhatsApp Kami
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto gap-2">
              <a href={`tel:+${whatsappNumber}`}>
                <Phone className="size-4" />
                Telepon
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
