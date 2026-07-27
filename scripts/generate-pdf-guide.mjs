import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function createGuidePDF() {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const timesBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([600, 800]);
  const { width, height } = page.getSize();
  
  let y = height - 50;

  page.drawText('Panduan Layanan Pengujian K3', {
    x: 50,
    y,
    size: 24,
    font: timesBoldFont,
    color: rgb(0.1, 0.3, 0.5),
  });
  
  y -= 40;

  const steps = [
    { title: '1. Pendaftaran', desc: 'Pilih parameter uji dari katalog dan buat pesanan pengujian baru melalui website Tepian K3. Anda dapat memilih layanan utama maupun tambahan.' },
    { title: '2. Penawaran & SPK', desc: 'Tim kami akan mengkaji permintaan, menghitung estimasi biaya (termasuk biaya operasional dan bagasi jika ada), lalu menerbitkan Surat Penawaran.' },
    { title: '3. Pembayaran', desc: 'Lakukan pembayaran sesuai tagihan (invoice) yang diterbitkan. Bendahara kami akan memverifikasi bukti pembayaran Anda.' },
    { title: '4. Penjadwalan & Pengujian', desc: 'Tim akan menjadwalkan personil, mengalokasikan alat pengujian, lalu melakukan pengambilan sampel di lokasi perusahaan Anda.' },
    { title: '5. Hasil & Sertifikat', desc: 'Setelah sampel dianalisis di laboratorium, Laporan Hasil Uji (LHU) dan Sertifikat akan diterbitkan dengan TTE (Tanda Tangan Elektronik) Srikandi.' },
  ];

  page.drawText('Alur Proses Layanan:', { x: 50, y, size: 16, font: timesBoldFont });
  y -= 30;

  for (const step of steps) {
    page.drawText(step.title, { x: 50, y, size: 14, font: timesBoldFont, color: rgb(0.2, 0.4, 0.6) });
    y -= 20;
    
    // Simple text wrapping logic
    const words = step.desc.split(' ');
    let line = '';
    for (const word of words) {
      if ((line + word).length > 80) {
        page.drawText(line, { x: 50, y, size: 12, font: timesRomanFont });
        y -= 15;
        line = word + ' ';
      } else {
        line += word + ' ';
      }
    }
    if (line) {
      page.drawText(line, { x: 50, y, size: 12, font: timesRomanFont });
      y -= 15;
    }
    y -= 15;
  }

  y -= 20;
  page.drawText('Pertanyaan yang Sering Diajukan (FAQ):', { x: 50, y, size: 16, font: timesBoldFont });
  y -= 30;

  const faqs = [
    { q: 'Apa itu parameter K3?', a: 'Parameter K3 adalah faktor-faktor di lingkungan kerja yang berpotensi mempengaruhi keselamatan dan kesehatan pekerja (seperti udara, kebisingan, ergonomi).' },
    { q: 'Berapa lama prosesnya dari awal sampai sertifikat?', a: 'Biasanya 3-5 hari kerja untuk penjadwalan, 7-14 hari kerja untuk analisis lab.' },
    { q: 'Sertifikat ini untuk apa?', a: 'Sebagai bukti resmi pemenuhan regulasi pemerintah, audit ISO, dan memastikan keselamatan pekerja.' },
  ];

  for (const faq of faqs) {
    page.drawText('T: ' + faq.q, { x: 50, y, size: 12, font: timesBoldFont });
    y -= 15;
    
    const words = ('J: ' + faq.a).split(' ');
    let line = '';
    for (const word of words) {
      if ((line + word).length > 80) {
        page.drawText(line, { x: 50, y, size: 12, font: timesRomanFont });
        y -= 15;
        line = word + ' ';
      } else {
        line += word + ' ';
      }
    }
    if (line) {
      page.drawText(line, { x: 50, y, size: 12, font: timesRomanFont });
      y -= 15;
    }
    y -= 15;
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(path.join(__dirname, '../apps/web/public/assets/Panduan_Layanan_Pengujian_K3.pdf'), pdfBytes);
  console.log('PDF generated successfully!');
}

createGuidePDF().catch(console.error);
