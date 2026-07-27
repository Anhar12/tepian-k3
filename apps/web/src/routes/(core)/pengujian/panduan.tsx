import { pageHead } from "@/utils/page-head";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, ClipboardList, FlaskConical, FileText, Banknote } from "lucide-react";

export const Route = createFileRoute("/(core)/pengujian/panduan")({
  component: PanduanPage,
  head: () => pageHead("Panduan Layanan Pengujian K3"),
});

function PanduanPage() {
  const steps = [
    {
      icon: <ClipboardList className="size-6 text-blue-500" />,
      title: "1. Pendaftaran",
      description: "Pilih parameter uji dari katalog dan buat pesanan pengujian baru.",
    },
    {
      icon: <FileText className="size-6 text-fuchsia-500" />,
      title: "2. Penawaran & SPK",
      description: "Tim kami akan mengkaji permintaan dan menerbitkan Surat Penawaran.",
    },
    {
      icon: <Banknote className="size-6 text-emerald-500" />,
      title: "3. Pembayaran",
      description: "Lakukan pembayaran sesuai tagihan (invoice) yang diterbitkan.",
    },
    {
      icon: <FlaskConical className="size-6 text-orange-500" />,
      title: "4. Pengujian",
      description: "Pengambilan sampel di lapangan dan analisis di laboratorium kami.",
    },
    {
      icon: <CheckCircle2 className="size-6 text-green-500" />,
      title: "5. Hasil & Sertifikat",
      description: "Laporan Hasil Uji (LHU) atau Sertifikat siap diunduh.",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 pb-16 font-['Poppins']">
      <div className="space-y-4 pt-8 text-center">
        <h1 className="text-4xl font-bold text-slate-800">
          Panduan Layanan Pengujian K3
        </h1>
        <p className="mx-auto max-w-2xl text-slate-500">
          Proses pengujian kesehatan dan keselamatan kerja kini lebih mudah,
          transparan, dan dapat dipantau secara langsung melalui sistem kami.
        </p>
        <div className="pt-2">
          <Button asChild variant="outline" className="rounded-full shadow-sm">
            <a href="/assets/Panduan_Layanan_Pengujian_K3.pdf" download>
              <FileText className="mr-2 h-4 w-4" />
              Unduh Panduan Lengkap (PDF)
            </a>
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-xl">Alur Proses Layanan</CardTitle>
          <CardDescription>
            Lima langkah mudah dari awal pendaftaran hingga sertifikat terbit
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col p-6 group hover:bg-slate-50 transition-colors">
                <div className="mb-4 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-white shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <h3 className="mb-2 font-semibold text-slate-800">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-grow">
                  {step.description}
                </p>
                
                {/* Visual placeholder using existing public assets */}
                <div className="relative mt-auto w-full aspect-video rounded-lg overflow-hidden border border-slate-100 shadow-sm group-hover:shadow-md transition-shadow">
                  <div className="absolute inset-0 bg-slate-100 animate-pulse" />
                  {idx === 0 && <img src="/assets/layanan_pengujian_thumb.webp" alt="Pendaftaran" className="absolute inset-0 w-full h-full object-cover z-10" />}
                  {idx === 1 && <img src="/assets/prosedur_permohonan_informasi.webp" alt="SPK" className="absolute inset-0 w-full h-full object-cover z-10" />}
                  {idx === 2 && <img src="/assets/layanan_tarif_pengujian_1.webp" alt="Pembayaran" className="absolute inset-0 w-full h-full object-cover z-10" />}
                  {idx === 3 && <img src="/assets/tentang_ppid.webp" alt="Pengujian" className="absolute inset-0 w-full h-full object-cover z-10" />}
                  {idx === 4 && <img src="/assets/maklumat_pelayanan.png" alt="Sertifikat" className="absolute inset-0 w-full h-full object-cover z-10" />}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-lg">Pertanyaan yang Sering Diajukan (FAQ)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="px-6">
              <AccordionTrigger className="text-slate-700 hover:text-blue-600">Apa itu parameter K3?</AccordionTrigger>
              <AccordionContent className="text-slate-500 leading-relaxed">
                Parameter K3 adalah faktor-faktor di lingkungan kerja yang berpotensi mempengaruhi keselamatan dan kesehatan pekerja. Contohnya meliputi kualitas udara (debu, gas), kebisingan mesin, pencahayaan, getaran, hingga evaluasi ergonomi tempat kerja.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="px-6">
              <AccordionTrigger className="text-slate-700 hover:text-blue-600">Berapa lama prosesnya dari awal sampai sertifikat?</AccordionTrigger>
              <AccordionContent className="text-slate-500 leading-relaxed">
                Durasi sangat bervariasi bergantung pada jenis parameter dan lokasi perusahaan. Namun secara umum, setelah pembayaran dikonfirmasi, penjadwalan tim biasanya memakan waktu 3-5 hari kerja, disusul proses analisis lab (7-14 hari kerja), hingga sertifikat diterbitkan.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="px-6">
              <AccordionTrigger className="text-slate-700 hover:text-blue-600">Sertifikat ini untuk apa?</AccordionTrigger>
              <AccordionContent className="text-slate-500 leading-relaxed">
                Sertifikat (Laporan Hasil Uji) adalah bukti resmi bahwa lingkungan kerja atau peralatan Anda telah diuji oleh lembaga kompeten. Ini penting untuk pemenuhan regulasi pemerintah, audit ISO (sistem manajemen K3), dan memastikan perlindungan pekerja Anda.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="px-6">
              <AccordionTrigger className="text-slate-700 hover:text-blue-600">Bagaimana cara mengetahui saya perlu uji K3?</AccordionTrigger>
              <AccordionContent className="text-slate-500 leading-relaxed">
                Berdasarkan Permenaker RI, perusahaan dengan tingkat risiko tertentu wajib melakukan pengujian secara berkala (umumnya setahun sekali). Jika Anda ragu, Anda bisa berkonsultasi dengan tim layanan pelanggan kami untuk panduan lebih lanjut.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5" className="px-6">
              <AccordionTrigger className="text-slate-700 hover:text-blue-600">Apakah bisa diantar ke kantor saya di Samarinda?</AccordionTrigger>
              <AccordionContent className="text-slate-500 leading-relaxed">
                Tentu saja. Tim Petugas Sampling kami akan datang ke lokasi (perusahaan) Anda untuk mengambil sampel udara, mengukur kebisingan, atau melakukan inspeksi lainnya sesuai dengan jadwal yang telah disepakati bersama.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6" className="px-6">
              <AccordionTrigger className="text-slate-700 hover:text-blue-600">Bagaimana jika saya ingin mengusulkan atau mengubah tanggal pelaksanaan?</AccordionTrigger>
              <AccordionContent className="text-slate-500 leading-relaxed">
                Setelah status pesanan Anda masuk ke tahap "Menunggu Pelaksanaan", Anda dapat mengusulkan rentang tanggal baru melalui halaman "Status Order". Tim penjadwalan kami akan menghubungi Anda untuk mengonfirmasi usulan tersebut dan menyesuaikan kalender operasional.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-7" className="px-6 border-b-0">
              <AccordionTrigger className="text-slate-700 hover:text-blue-600">Di mana saya bisa mengunduh sertifikat atau laporan hasil pengujian?</AccordionTrigger>
              <AccordionContent className="text-slate-500 leading-relaxed">
                Sertifikat kelulusan (LHU) maupun sertifikat personil (jika ada) dapat diunduh secara mandiri oleh Anda di halaman rincian status pesanan Anda setelah proses pengujian selesai sepenuhnya dan dokumen telah diterbitkan oleh Balai.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
        <Button asChild size="lg" className="rounded-full px-8 shadow-md">
          <Link to="/katalog" search={{ page: 1, perPage: 12 }}>
            Mulai Pengujian Sekarang <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="rounded-full px-8 bg-white">
          <Link to="/dashboard">
            Kembali ke Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
